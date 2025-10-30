'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookshelfIcon, ChartBarIcon, SearchIcon, ChatBubbleLeftRightIcon } from './Icons';

type View = '/' | '/search' | '/stats' | '/chat';

const Nav: React.FC = () => {
    const pathname = usePathname();

    const NavItem: React.FC<{
        href: View;
        label: string;
        icon: React.ReactNode;
    }> = ({ href, label, icon }) => (
        <Link
          href={href}
          className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
            (pathname === href || (href === '/' && pathname.startsWith('/bookshelf')))  ? 'text-primary' : 'text-white/70 hover:text-white'
          }`}
        >
          {icon}
          <span className="text-xs mt-1">{label}</span>
        </Link>
    );

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-footer dark:bg-dark-footer shadow-lg z-20 border-t border-black/20">
            <nav className="max-w-5xl mx-auto flex justify-around">
                <NavItem href="/search" label="검색" icon={<SearchIcon className="w-6 h-6" />} />
                <NavItem href="/" label="내 책장" icon={<BookshelfIcon className="w-6 h-6" />} />
                <NavItem href="/stats" label="통계" icon={<ChartBarIcon className="w-6 h-6" />} />
                <NavItem href="/chat" label="AI 채팅" icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />} />
            </nav>
        </footer>
    );
};

export default Nav;
