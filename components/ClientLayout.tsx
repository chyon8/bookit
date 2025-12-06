"use client";

import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { Toaster } from "react-hot-toast";
import { SparklesIcon, SunIcon, MoonIcon, BookOpenIcon } from "./Icons";
import ReviewModal from "./ReviewModal";
import Nav from "./Nav";
import ConfirmModal from "./ConfirmModal";
import { createClient } from "../utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import Link from "next/link";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { Session } from "@supabase/supabase-js";
import { View } from "../types";
import BookshelfView from "./BookshelfView";
import SearchView from "./SearchView";
import StatsView from "./StatsView";
import ChatView from "./ChatView";

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    user,
    books,
    theme,
    toggleTheme,
    isReviewModalOpen,
    selectedBook,
    handleSaveReview,
    handleCloseReview,
    handleDeleteBook,
    handleOpenReview,
  } = useAppContext();

  const [isSignOutModalOpen, setSignOutModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<View>('bookshelf');
  const supabase = createClient();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const confirmSignOut = async () => {
    await supabase.auth.signOut();
    setSignOutModalOpen(false);
  };

  const handleSignOutClick = () => {
    setSignOutModalOpen(true);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'search':
        return <SearchView onSelectBook={handleOpenReview} />;
      case 'stats':
        return <StatsView books={books} theme={theme} />;
      case 'chat':
        return <ChatView books={books} />;
      case 'bookshelf':
      default:
        return <BookshelfView />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-light-gray dark:bg-dark-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-dark-card p-8 rounded-lg shadow-lg">
            <div className="flex items-center justify-center mb-6">
              <BookOpenIcon className="w-10 h-10 text-primary" />
              <h1 className="text-2xl font-bold text-text-heading dark:text-dark-text-heading ml-2">
                Bookit
              </h1>
            </div>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              theme={theme}
              providers={["google", "github"]}
              socialLayout="horizontal"
              localization={{
                variables: {
                  sign_in: {
                    email_label: "이메일 주소",
                    password_label: "비밀번호",
                    button_label: "로그인",
                    social_provider_text: "{{provider}}로 로그인",
                    link_text: "계정이 있으신가요? 로그인하세요",
                  },
                  sign_up: {
                    email_label: "이메일 주소",
                    password_label: "비밀번호",
                    button_label: "가입하기",
                    social_provider_text: "{{provider}}로 가입하기",
                    link_text: "계정이 없으신가요? 가입하세요",
                  },
                  forgotten_password: {
                    email_label: "이메일 주소",
                    password_label: "비밀번호",
                    button_label: "비밀번호 재설정",
                    link_text: "비밀번호를 잊으셨나요?",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray dark:bg-dark-bg font-sans flex flex-col">
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#2d3748" : "#ffffff",
            color: theme === "dark" ? "#e2e8f0" : "#1a202c",
          },
        }}
      />
      <header className="bg-white dark:bg-dark-card p-2 border-b border-border dark:border-dark-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div onClick={() => setActiveView('bookshelf')} className="flex items-center cursor-pointer">
            <BookOpenIcon className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold text-text-heading dark:text-dark-text-heading ml-2">
              Bookit
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-text-body dark:text-dark-text-body hover:bg-light-gray dark:hover:bg-dark-bg transition-colors"
              aria-label="테마 변경"
            >
              {theme === "light" ? (
                <MoonIcon className="w-6 h-6" />
              ) : (
                <SunIcon className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={handleSignOutClick}
              className="text-sm font-semibold text-text-body dark:text-dark-text-body hover:text-primary dark:hover:text-primary transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-6 mb-16">
        <div className="max-w-5xl mx-auto">{renderActiveView()}</div>
      </main>

      <ReviewModal />

      <ConfirmModal
        isOpen={isSignOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        onConfirm={confirmSignOut}
        title="로그아웃"
      >
        <p>정말로 로그아웃하시겠습니까?</p>
      </ConfirmModal>

      <Nav activeView={activeView} onViewChange={setActiveView} />
    </div>
  );
};

export default ClientLayout;
