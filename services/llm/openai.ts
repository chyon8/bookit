import OpenAI from 'openai';
import { LLMProvider, ChatParams, ChatMessage } from './types';
import { DEFAULT_AI_MODEL } from '../../config/constants';

const getAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY environment variable is required for OpenAI service.");
    }
    return new OpenAI({ apiKey });
};

// Helper to map our 'assistant' role to OpenAI's 'assistant' role
const mapMessages = (messages: ChatMessage[]) => {
    return messages.map(m => ({
        role: m.role,
        content: m.content
    }));
};

export class OpenAIProvider implements LLMProvider {
  
  async *chatStream(params: ChatParams): AsyncGenerator<string> {
    const ai = getAIClient();
    
    const messages: any[] = [
      { role: 'system', content: params.systemPrompt },
      ...mapMessages(params.messages),
      { role: 'user', content: params.prompt }
    ];

    const modelName = process.env.LLM_MODEL || DEFAULT_AI_MODEL;

    try {
        const stream = await ai.chat.completions.create({
            model: modelName,
            messages: messages,
            stream: true,
        });

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
                yield text;
            }
        }
    } catch (error) {
        console.error("OpenAI chatStream error:", error);
        throw error;
    }
  }

  async chatOnce(params: ChatParams): Promise<string> {
    const ai = getAIClient();
    
    const messages: any[] = [
      { role: 'system', content: params.systemPrompt },
      ...mapMessages(params.messages),
      { role: 'user', content: params.prompt }
    ];

    const modelName = process.env.LLM_MODEL || DEFAULT_AI_MODEL;

    try {
        const response = await ai.chat.completions.create({
            model: modelName,
            messages: messages,
            stream: false,
        });
        
        return response.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("OpenAI chatOnce error:", error);
        throw error;
    }
  }
}
