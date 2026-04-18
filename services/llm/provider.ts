import { LLMProvider } from './types';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';

export function getLLMProvider(): LLMProvider {
  const provider = process.env.NEXT_PUBLIC_LLM_PROVIDER || process.env.LLM_PROVIDER || 'openai';
  
  switch (provider.toLowerCase()) {
    case 'gemini':
      return new GeminiProvider();
    case 'openai':
      return new OpenAIProvider();
    default:
      console.warn(`Unsupported LLM provider: ${provider}, falling back to OpenAI`);
      return new OpenAIProvider();
  }
}
