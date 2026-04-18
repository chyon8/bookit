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

// Chat logic has been moved to services/llm/gemini.ts
