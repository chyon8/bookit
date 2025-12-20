import { GoogleGenAI, Type } from "@google/genai";
import { Book, BookWithReview } from '../types';
import { DEFAULT_GEMINI_MODEL } from '../config/constants';

const getAIClient = () => {
    if (!process.env.GOOGLE_API_KEY) {
        throw new Error("GOOGLE_API_KEY environment variable is required for Gemini AI service.");
    }
    return new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
};

const bookSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: {
          type: Type.STRING,
          description: 'A unique identifier for the book (use ISBN-13 if available, otherwise generate a unique ID).'
        },
        isbn13: {
          type: Type.STRING,
          description: 'The ISBN-13 number of the book if available.'
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
          description: 'The primary genre or category of the book (e.g., Fiction, Non-Fiction, Science, History, etc.).'
        },
        coverImageUrl: {
          type: Type.STRING,
          description: 'A public URL to an image of the book cover. Try to find real book cover URLs when possible.'
        },
        description: {
            type: Type.STRING,
            description: 'A brief, one-paragraph summary of the book.'
        }
      },
      required: ["id", "title", "author", "category", "coverImageUrl", "description"],
    },
};

export const searchBooks = async (query: string): Promise<Book[]> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: DEFAULT_GEMINI_MODEL,
            contents: `Find real books matching the query: "${query}". Return at least 5 results with accurate information. Include ISBN-13 when available. Provide real book cover image URLs if possible.`,
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
        throw new Error("Failed to search books. Please check your API key and try again.");
    }
};

export const getChatResponseStream = async function* (books: BookWithReview[], prompt: string): AsyncGenerator<string> {
    const bookData = JSON.stringify(books.map(b => ({
        title: b.title,
        author: b.author,
        category: b.category,
        description: b.description,
        // User review data from database
        status: b.review?.status,
        rating: b.review?.rating,
        startDate: b.review?.start_date,
        endDate: b.review?.end_date,
        oneLineReview: b.review?.one_line_review,
        motivation: b.review?.motivation,
        memorableQuotes: b.review?.memorable_quotes,
        learnings: b.review?.learnings,
        questionsFromBook: b.review?.questions_from_book,
        rereadWill: b.review?.reread_will,
        rereadReason: b.review?.reread_reason,
        connectedThoughts: b.review?.connected_thoughts,
        overallImpression: b.review?.overall_impression,
        worthOwning: b.review?.worth_owning,
        notes: b.review?.notes
    })), null, 2);

    const systemInstruction = `You are a helpful and insightful literary assistant for a reading journal app. The user's entire library is provided below in JSON format. Your primary role is to analyze this data and provide thoughtful, personalized responses.

    **User's Library:**
    ${bookData}

    **Book Data Fields Explained:**
    - **status**: Reading status (Reading, Finished, Dropped, Want to Read)
    - **rating**: User rating (0-5 stars)
    - **startDate/endDate**: When they started/finished reading
    - **oneLineReview**: User's brief one-line review
    - **motivation**: Why they chose to read this book
    - **memorableQuotes**: Quotes they found meaningful (with page numbers and thoughts)
    - **learnings**: What they learned from the book
    - **questionsFromBook**: Questions raised while reading
    - **rereadWill**: Whether they plan to reread it
    - **rereadReason**: Why they want to reread it
    - **connectedThoughts**: Related thoughts and connections
    - **overallImpression**: Their overall impression
    - **worthOwning**: Whether they think the book is worth owning physically
    - **notes**: Additional notes

    **Your Tasks:**
    1.  **Analyze and Converse:** Engage in a natural conversation about the user's reading habits. Answer questions about their library directly (e.g., "What did I think of [book]?," "Which books did I rate 5 stars?", "What did I learn from [book]?").
    2.  **AI Report Command:** If the user's prompt is exactly "AI Report" or "AI 리포트", you MUST provide a comprehensive analysis covering the following points in a friendly, encouraging tone:
        *   **Taste Profile:** A summary of their main genre preferences and favorite authors.
        *   **Reading Patterns:** Analyze their reading habits based on start/end dates, completion rates, and statuses.
        *   **Mood Analysis:** Infer the general mood or themes from their notes, learnings, and questions (e.g., "It seems you've been exploring themes of...").
        *   **Deep Insights:** Highlight meaningful quotes, learnings, or connected thoughts they've noted.
        *   **Recommendation:** Suggest a specific new book or author based on their highest-rated books, preferred genres, motivations, and learnings. Explain *why* you are recommending it.
        *   **Provocative Question:** End the report with a specific, open-ended question about one of the books in their library to encourage deeper reflection (reference their notes, learnings, or questions if available).
    3.  **General Interaction:** Be encouraging and curious. Keep responses concise and easy to read. Use markdown for formatting (headers, lists, bold text, etc.) to improve readability. Reference specific fields from their reviews to make responses more personal.`;

    try {
        const ai = getAIClient();

        const result = await ai.models.generateContentStream({
            model: DEFAULT_GEMINI_MODEL,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        for await (const chunk of result) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    } catch (error) {
        console.error("Error getting chat response from Gemini:", error);
        console.error("Error details:", error);
        throw new Error("Failed to get AI response. Please try again.");
    }
};

export const getChatResponse = async (books: BookWithReview[], prompt: string): Promise<string> => {
    const bookData = JSON.stringify(books.map(b => ({
        title: b.title,
        author: b.author,
        category: b.category,
        description: b.description,
        // User review data from database
        status: b.review?.status,
        rating: b.review?.rating,
        startDate: b.review?.start_date,
        endDate: b.review?.end_date,
        oneLineReview: b.review?.one_line_review,
        motivation: b.review?.motivation,
        memorableQuotes: b.review?.memorable_quotes,
        learnings: b.review?.learnings,
        questionsFromBook: b.review?.questions_from_book,
        rereadWill: b.review?.reread_will,
        rereadReason: b.review?.reread_reason,
        connectedThoughts: b.review?.connected_thoughts,
        overallImpression: b.review?.overall_impression,
        worthOwning: b.review?.worth_owning,
        notes: b.review?.notes
    })), null, 2);

    const systemInstruction = `You are a helpful and insightful literary assistant for a reading journal app. The user's entire library is provided below in JSON format. Your primary role is to analyze this data and provide thoughtful, personalized responses.

    **User's Library:**
    ${bookData}

    **Book Data Fields Explained:**
    - **status**: Reading status (Reading, Finished, Dropped, Want to Read)
    - **rating**: User rating (0-5 stars)
    - **startDate/endDate**: When they started/finished reading
    - **oneLineReview**: User's brief one-line review
    - **motivation**: Why they chose to read this book
    - **memorableQuotes**: Quotes they found meaningful (with page numbers and thoughts)
    - **learnings**: What they learned from the book
    - **questionsFromBook**: Questions raised while reading
    - **rereadWill**: Whether they plan to reread it
    - **rereadReason**: Why they want to reread it
    - **connectedThoughts**: Related thoughts and connections
    - **overallImpression**: Their overall impression
    - **worthOwning**: Whether they think the book is worth owning physically
    - **notes**: Additional notes

    **Your Tasks:**
    1.  **Analyze and Converse:** Engage in a natural conversation about the user's reading habits. Answer questions about their library directly (e.g., "What did I think of [book]?," "Which books did I rate 5 stars?", "What did I learn from [book]?").
    2.  **AI Report Command:** If the user's prompt is exactly "AI Report", you MUST provide a comprehensive analysis covering the following points in a friendly, encouraging tone:
        *   **Taste Profile:** A summary of their main genre preferences and favorite authors.
        *   **Reading Patterns:** Analyze their reading habits based on start/end dates, completion rates, and statuses.
        *   **Mood Analysis:** Infer the general mood or themes from their notes, learnings, and questions (e.g., "It seems you've been exploring themes of...").
        *   **Deep Insights:** Highlight meaningful quotes, learnings, or connected thoughts they've noted.
        *   **Recommendation:** Suggest a specific new book or author based on their highest-rated books, preferred genres, motivations, and learnings. Explain *why* you are recommending it.
        *   **Provocative Question:** End the report with a specific, open-ended question about one of the books in their library to encourage deeper reflection (reference their notes, learnings, or questions if available).
    3.  **General Interaction:** Be encouraging and curious. Keep responses concise and easy to read. Use markdown for formatting if it helps clarity (like lists or bold text). Reference specific fields from their reviews to make responses more personal.`;

    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: DEFAULT_GEMINI_MODEL,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting chat response from Gemini:", error);
        throw new Error("Failed to get AI response. Please try again.");
    }
};
