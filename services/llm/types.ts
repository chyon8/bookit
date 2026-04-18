export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatParams {
  systemPrompt: string;
  messages: ChatMessage[];
  prompt: string;
}

export interface LLMProvider {
  chatStream(params: ChatParams): AsyncGenerator<string>;
  chatOnce(params: ChatParams): Promise<string>;
}
