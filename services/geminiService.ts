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

const minifyBookData = (books: BookWithReview[]) => {
    return books.map(b => ({
        t: b.title,
        a: b.author,
        c: b.category,
        // Shorten status keys
        s: b.review?.status,
        r: b.review?.rating,
        // Only include review text if it exists
        ...(b.review?.one_line_review && { rev: b.review.one_line_review }),
        ...(b.review?.motivation && { mot: b.review.motivation }),
        ...(b.review?.memorable_quotes && { q: b.review.memorable_quotes }),
        ...(b.review?.learnings && { l: b.review.learnings }),
        ...(b.review?.questions_from_book && { qs: b.review.questions_from_book }),
        ...(b.review?.connected_thoughts && { th: b.review.connected_thoughts }),
        ...(b.review?.overall_impression && { imp: b.review.overall_impression }),
        ...(b.review?.notes && { n: b.review.notes })
    }));
};

export const getChatResponseStream = async function* (books: BookWithReview[], prompt: string): AsyncGenerator<string> {
    const minifiedData = minifyBookData(books);
    const bookData = JSON.stringify(minifiedData);

    const systemInstruction = `You are a helpful and insightful literary assistant for a reading journal app. The user's entire library is provided below in a minified JSON format to save space.
    
    **Data Key Legend:**
    t: Title, a: Author, c: Category, s: Status, r: Rating (0-5)
    rev: One-line review, mot: Motivation, q: Quotes, l: Learnings
    qs: Questions, th: Connected thoughts, imp: Overall impression, n: Notes

    **User's Library:**
    ${bookData}

    **Your Tasks:**
    1.  **Analyze and Converse:** Engage in natural conversation. You have full access to the user's library.
    2.  **AI Report:** If asked for an "AI Report" or "AI 리포트", provide a comprehensive analysis of taste, reading patterns, mood, deep insights, and recommendations.
    3.  **General:** Be encouraging and curious. Use markdown. Reference specific details from the user's notes (n), quotes (q), or learnings (l) to make it personal.`;

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
    // Re-use logic (in a real scenario we might refactor to a shared internal function, but keeping it simple here)
    const minifiedData = minifyBookData(books);
    const bookData = JSON.stringify(minifiedData);

    const systemInstruction = `You are a helpful and insightful literary assistant for a reading journal app. The user's entire library is provided below in a minified JSON format.
    
    **Data Key Legend:**
    t: Title, a: Author, c: Category, s: Status, r: Rating (0-5)
    rev: One-line review, mot: Motivation, q: Quotes, l: Learnings
    qs: Questions, th: Connected thoughts, imp: Overall impression, n: Notes

    **User's Library:**
    ${bookData}

    **Your Tasks:**
    1.  **Analyze and Converse:** Engage in natural conversation.
    2.  **AI Report:** Provide analysis if requested.
    3.  **General:** Be encouraging, use markdown, reference specific user notes.`;

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
