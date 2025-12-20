import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { BookWithReview } from '../types';
import { BookOpenIcon } from './Icons';

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
      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
    >
      {text}
    </button>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden">
      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-2 md:gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
            {message.sender === 'ai' && (
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="w-4 h-4 md:w-4.5 md:h-4.5 text-slate-600 dark:text-slate-300" />
              </div>
            )}
            <div className={`max-w-[75%] md:max-w-md p-3 md:p-4 rounded-2xl ${
              message.sender === 'user'
                ? 'bg-slate-800 dark:bg-slate-700 text-white rounded-tr-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 rounded-bl-sm'
            }`}>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
              <BookOpenIcon className="w-4 h-4 md:w-4.5 md:h-4.5 text-slate-600 dark:text-slate-300" />
            </div>
            <div className="max-w-[75%] md:max-w-md p-3 md:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm text-slate-700 dark:text-slate-200 rounded-bl-sm">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse delay-75"></span>
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse delay-150"></span>
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-pulse delay-300"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 md:p-4">
        {/* 추천 버튼 */}
        <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1">
          <SuggestionButton text="AI 리포트" />
          <SuggestionButton text="별점 5점을 준 책은 뭐야?" />
          <SuggestionButton text="책 추천해 줘" />
        </div>

        {/* 입력 폼 */}
        <form onSubmit={(e) => handleSendMessage(e, input)} className="relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AI 독서 비서에게 질문하기..."
            className="w-full pl-4 md:pl-6 pr-14 md:pr-16 py-3 md:py-4 bg-slate-50 dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:border-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm md:text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2.5 md:p-3 bg-slate-800 dark:bg-slate-700 text-white rounded-full hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4 md:w-5 md:h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
