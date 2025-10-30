import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { BookWithReview } from '../types';
import { SparklesIcon } from './Icons';

interface ChatViewProps {
  books: BookWithReview[];
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

const ChatView: React.FC<ChatViewProps> = ({ books }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "안녕하세요! 저는 당신의 AI 독서 비서입니다. 당신의 독서 기록에 대해 무엇이든 물어보세요. 또는 **\"AI 리포트\"**라고 입력하여 독서 취향에 대한 상세 분석을 받아보세요.",
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent, messageText: string) => {
    e.preventDefault();
    if (!messageText.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getChatResponse(books, messageText);
      const newAiMessage: Message = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
      };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Failed to get chat response:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "죄송합니다, 지금은 AI 두뇌에 연결할 수 없어요. 나중에 다시 시도해주세요.",
        sender: 'ai',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const SuggestionButton: React.FC<{ text: string }> = ({ text }) => (
    <button
      onClick={(e) => handleSendMessage(e as any, text)}
      className="bg-light-gray dark:bg-dark-card border border-border dark:border-dark-border rounded-lg px-3 py-1.5 text-sm text-text-body dark:text-dark-text-body hover:bg-border dark:hover:bg-dark-border/50 transition-colors"
    >
      {text}
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] bg-white dark:bg-dark-card rounded-lg shadow-sm border border-border dark:border-dark-border">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
            {message.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white" /></div>}
            <div className={`max-w-md p-3 rounded-lg ${message.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-light-gray dark:bg-dark-bg text-text-heading dark:text-dark-text-heading rounded-bl-none'}`}>
              <p className="text-sm" dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white" /></div>
            <div className="max-w-md p-3 rounded-lg bg-light-gray dark:bg-dark-bg text-text-heading dark:text-dark-text-heading rounded-bl-none">
                <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse delay-75"></span>
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-text-muted rounded-full animate-pulse delay-300"></span>
                </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-border dark:border-dark-border">
        <div className="flex flex-wrap gap-2 mb-3">
            <SuggestionButton text="AI 리포트" />
            <SuggestionButton text="별점 5점을 준 책은 뭐야?" />
            <SuggestionButton text="책 추천해 줘" />
        </div>
        <form onSubmit={(e) => handleSendMessage(e, input)} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AI 독서 비서에게 질문하기..."
            className="w-full pl-4 pr-4 py-2 bg-light-gray dark:bg-dark-bg text-text-heading dark:text-dark-text-heading border border-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
