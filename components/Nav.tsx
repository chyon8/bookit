'use client';

import React from 'react';
import { BookshelfIcon, ChartBarIcon, SearchIcon, ChatBubbleLeftRightIcon } from './Icons';
import { View } from '../types';

interface NavProps {
    activeView: View;
    onViewChange: (view: View) => void;
}

const Nav: React.FC<NavProps> = ({ activeView, onViewChange }) => {

    const NavItem: React.FC<{
        view: View;
        label: string;
        icon: React.ReactNode;
    }> = ({ view, label, icon }) => (
        <button
          onClick={() => onViewChange(view)}
          className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
            activeView === view ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-800 dark:text-dark-text-body/70 dark:hover:text-dark-text-body'
          }`}
        >
          {icon}
          <span className="text-xs mt-1">{label}</span>
        </button>
    );

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card shadow-lg z-20 border-t border-gray-200 dark:border-dark-border">
            <nav className="max-w-5xl mx-auto flex justify-around">
                <NavItem view="search" label="검색" icon={<SearchIcon className="w-6 h-6" />} />
                <NavItem view="bookshelf" label="내 책장" icon={<BookshelfIcon className="w-6 h-6" />} />
                <NavItem view="stats" label="통계" icon={<ChartBarIcon className="w-6 h-6" />} />
                <NavItem view="chat" label="AI 채팅" icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />} />
            </nav>
        </footer>
    );
};

export default Nav;
