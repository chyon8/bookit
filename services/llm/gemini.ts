import { GoogleGenAI } from "@google/genai";
import { LLMProvider, ChatParams, ChatMessage } from './types';
import { DEFAULT_GEMINI_MODEL } from '../../config/constants';

const getAIClient = () => {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is required for Gemini AI service.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to map our 'assistant' role to Gemini's 'model' role
const mapMessages = (messages: ChatMessage[]) => {
    return messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));
};

export class GeminiProvider implements LLMProvider {
  
  async *chatStream(params: ChatParams): AsyncGenerator<string> {
    const ai = getAIClient();
    
    const contents = mapMessages(params.messages);
    contents.push({ role: 'user', parts: [{ text: params.prompt }] });

    const modelName = process.env.LLM_MODEL || DEFAULT_GEMINI_MODEL;

    try {
        const result = await ai.models.generateContentStream({
            model: modelName,
            contents: contents,
            config: {
                systemInstruction: params.systemPrompt,
            }
        });

        for await (const chunk of result) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    } catch (error) {
        console.error("Gemini chatStream error:", error);
        throw error;
    }
  }

  async chatOnce(params: ChatParams): Promise<string> {
    const ai = getAIClient();
    
    const contents = mapMessages(params.messages);
    contents.push({ role: 'user', parts: [{ text: params.prompt }] });

    const modelName = process.env.LLM_MODEL || DEFAULT_GEMINI_MODEL;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
                systemInstruction: params.systemPrompt,
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("Gemini chatOnce error:", error);
        throw error;
    }
  }
}
