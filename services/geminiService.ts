import { GoogleGenAI, Type } from "@google/genai";
import { Book, BookWithReview } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a mock service.");
}
  
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

const bookSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { 
          type: Type.STRING,
          description: 'A unique identifier for the book, like an ISBN or a generated ID.'
        },
        title: {
          type: Type.STRING,
          description: 'The full title of the book.'
        },
        author: {
          type: Type.STRING,
          description: 'The name of the book\'s author.'
        },
        category: {
          type: Type.STRING,
          description: 'The primary genre or category of the book.'
        },
        coverImageUrl: {
          type: Type.STRING,
          description: 'A public URL to an image of the book cover. Use a service like picsum.photos for placeholders if a real one isn\'t available.'
        },
        description: {
            type: Type.STRING,
            description: 'A brief, one-paragraph summary of the book.'
        }
      },
      required: ["id", "title", "author", "category", "coverImageUrl", "description"],
    },
};

const MOCK_BOOKS: Book[] = [
    { id: '9780316769488', title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', coverImageUrl: 'https://picsum.photos/seed/catcher/300/450', description: 'A classic novel about teenage angst and alienation.' },
    { id: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', coverImageUrl: 'https://picsum.photos/seed/gatsby/300/450', description: 'A story of wealth, love, and the American Dream in the 1920s.' },
    { id: '9780451524935', title: '1984', author: 'George Orwell', category: 'Dystopian', coverImageUrl: 'https://picsum.photos/seed/1984/300/450', description: 'A cautionary tale about totalitarianism and surveillance.' },
];


export const searchBooks = async (query: string): Promise<Book[]> => {
    if (!ai) {
        console.log("Using mock book search response.");
        return new Promise(resolve => setTimeout(() => resolve(MOCK_BOOKS.filter(b => b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()))), 500));
    }
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find books matching the query: "${query}". Return at least 5 results. Generate a unique ID for each.`,
            config: {
              responseMimeType: "application/json",
              responseSchema: bookSchema,
            },
        });
        
        const jsonStr = response.text.trim();
        const books = JSON.parse(jsonStr);
        return books;

    } catch (error) {
        console.error("Error searching for books with Gemini:", error);
        // Fallback to mock data on API error
        return MOCK_BOOKS.filter(b => b.title.toLowerCase().includes(query.toLowerCase()));
    }
};

export const getChatResponse = async (books: BookWithReview[], prompt: string): Promise<string> => {
    if (!ai) {
        console.log("Using mock chat response.");
        const mockResponses: { [key: string]: string } = {
            "ai report": "Based on your library, you seem to enjoy classic Fiction and Dystopian novels. You've rated '1984' highly. Perhaps you would enjoy 'Brave New World' by Aldous Huxley next. What was it about '1984' that you found most compelling?",
            "default": "This is a mock response. Please set your API key to have a real conversation. Based on your prompt about '" + prompt + "', I would recommend reading more books by George Orwell."
        };
        const response = prompt.toLowerCase().includes('ai report') ? mockResponses['ai report'] : mockResponses['default'];
        return new Promise(resolve => setTimeout(() => resolve(response), 1000));
    }

    const bookData = JSON.stringify(books.map(b => ({
        title: b.title,
        author: b.author,
        category: b.category,
        status: b.review?.status,
        rating: b.review?.rating,
        notes: b.review?.notes
    })), null, 2);

    const systemInstruction = `You are a helpful and insightful literary assistant for a reading journal app. The user's entire library is provided below in JSON format. Your primary role is to analyze this data and provide thoughtful, personalized responses.

    **User's Library:**
    ${bookData}

    **Your Tasks:**
    1.  **Analyze and Converse:** Engage in a natural conversation about the user's reading habits. Answer questions about their library directly (e.g., "What did I think of [book]?," "Which books did I rate 5 stars?").
    2.  **AI Report Command:** If the user's prompt is exactly "AI Report", you MUST provide a comprehensive analysis covering the following points in a friendly, encouraging tone:
        *   **Taste Profile:** A summary of their main genre preferences and favorite authors.
        *   **Mood Analysis:** Infer the general mood or themes from their notes (e.g., "It seems you've been exploring themes of...").
        *   **Recommendation:** Suggest a specific new book or author based on their highest-rated books and preferred genres. Explain *why* you are recommending it.
        *   **Provocative Question:** End the report with a specific, open-ended question about one of the books in their library to encourage deeper reflection (e.g., "In '1984', you noted the theme of surveillance. How do you see that theme playing out in today's world?").
    3.  **General Interaction:** Be encouraging and curious. Keep responses concise and easy to read. Use markdown for formatting if it helps clarity (like lists or bold text).`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting chat response from Gemini:", error);
        return "I'm sorry, I encountered an error trying to process that. Could you try rephrasing your question?";
    }
};
