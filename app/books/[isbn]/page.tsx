"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { BookWithReview, ReadingStatus } from "../../../types";
import { createClient } from "../../../utils/supabase/client";
import { BookOpenIcon } from "../../../components/Icons";
import { useAppContext } from "../../../context/AppContext";
import toast from "react-hot-toast";

const BookPreviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const isbn = params.isbn as string;

  const supabase = createClient();
  const { user, handleSaveReview } = useAppContext();

  console.log("BookPreviewPage rendered, ISBN:", isbn, "User:", user);

  const [book, setBook] = useState<BookWithReview | null>(null);
  const [existingBookId, setExistingBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      if (!isbn) {
        toast.error("잘못된 ISBN입니다.");
        router.push("/search");
        setIsLoading(false);
        return;
      }

      if (!user) {
        // Wait for user to load from AppContext
        return;
      }

      setIsLoading(true);

      try {
        // 1. Fetch book details from Aladin API
        const aladinResponse = await fetch(
          `/api/aladin-detail?isbn=${encodeURIComponent(isbn)}`
        );

        if (!aladinResponse.ok) {
          throw new Error("책 정보를 불러오는데 실패했습니다.");
        }

        const aladinData = await aladinResponse.json();

        if (!aladinData.book) {
          throw new Error("책 정보를 찾을 수 없습니다.");
        }

        // 2. More robustly check if the book is in the user's bookshelf
        // Step 2.1: Check if the book exists in the main 'books' table by ISBN
        const { data: bookInDb, error: bookError } = await supabase
          .from("books")
          .select("id")
          .eq("isbn13", isbn)
          .single();

        if (bookError && bookError.code !== "PGRST116") {
          console.error("Error checking books table:", bookError);
          throw new Error("데이터베이스에서 책 확인 중 오류가 발생했습니다.");
        }

        let foundUserBookId = null;

        // Step 2.2: If the book exists in our DB, check if the current user has it
        if (bookInDb) {
          const { data: userBookLink, error: userBookError } = await supabase
            .from("user_books")
            .select("book_id")
            .eq("user_id", user.id)
            .eq("book_id", bookInDb.id)
            .single();

          if (userBookError && userBookError.code !== "PGRST116") {
            console.error("Error checking user_books table:", userBookError);
            throw new Error("사용자 서재 확인 중 오류가 발생했습니다.");
          }

          if (userBookLink) {
            foundUserBookId = userBookLink.book_id;
          }
        }

        setExistingBookId(foundUserBookId);
        setBook(aladinData.book);
      } catch (error: any) {
        console.error("Error fetching book:", error);
        toast.error(error.message || "책 정보를 불러오는데 실패했습니다.");
        router.push("/search");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookDetails();
  }, [isbn, user, router, supabase]);

  const handleAddToBookshelf = async () => {
    if (!book || !user) return;

    setIsSaving(true);

    try {
      // Create a BookWithReview object with default review status
      const bookToSave: BookWithReview = {
        ...book,
        review: {
          status: ReadingStatus.WantToRead,
          rating: 0,
        },
      };

      // Use the existing handleSaveReview from AppContext
      await handleSaveReview(bookToSave);

      toast.success("책장에 추가되었습니다.");

      // Navigate back to the previous page (search results)
      router.back();
    } catch (error: any) {
      console.error("Error adding to bookshelf:", error);
      toast.error("책을 저장하는데 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToRecord = () => {
    if (existingBookId) {
      router.replace(`/book-record/${existingBookId}`);
    }
  };

  // Debug: Always show something
  if (!isbn) {
    return <div className="p-4">No ISBN provided</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-light-gray dark:bg-dark-bg">
        <div className="text-center">
          <p className="text-text-body dark:text-dark-text-body mt-4">
            사용자 정보 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !book) {
    return (
      <div className="bg-light-gray dark:bg-dark-bg min-h-screen">
        {/* Header is interactive */}
        <header className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-dark-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => router.back()}
              className="text-text-heading dark:text-dark-text-heading font-semibold"
            >
              ← 뒤로
            </button>
            <h1 className="text-lg font-bold text-text-heading dark:text-dark-text-heading">
              책 정보
            </h1>
            <div className="w-12"></div>
          </div>
        </header>

        {/* Main content skeleton */}
        <main className="pt-14 pb-24">
          {/* Hero Section Skeleton */}
          <div className="relative h-64 animate-pulse overflow-hidden bg-gray-200 p-4 dark:bg-gray-800">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div className="relative z-[1] flex h-full flex-col items-center justify-center text-white">
              <div
                className="h-36 w-auto rounded-md bg-gray-300 object-cover dark:bg-gray-700"
                style={{ width: "9rem" }}
              ></div>
              <div className="mt-3 h-7 w-48 rounded-md bg-gray-300 dark:bg-gray-600"></div>
              <div className="mt-2 h-4 w-32 rounded-md bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>

          {/* Book Details Skeleton */}
          <div className="relative z-[2] -mt-10 space-y-4 p-4">
            <div className="animate-pulse space-y-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-dark-card">
              {/* Category Skeleton */}
              <div>
                <div className="mb-3 h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-5 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700"></div>
              </div>

              {/* Description Skeleton */}
              <div>
                <div className="mb-3 h-4 w-20 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                <div className="space-y-2">
                  <div className="h-4 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-5/6 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>

              {/* ISBN Skeleton */}
              <div className="border-t border-border pt-4 dark:border-dark-border">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-12 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                  <div className="h-4 w-28 rounded-md bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Fixed Bottom Action Button Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg dark:bg-dark-card">
          <div className="h-12 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light-gray dark:bg-dark-bg min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-dark-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="text-text-heading dark:text-dark-text-heading font-semibold"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg font-bold text-text-heading dark:text-dark-text-heading">
            책 정보
          </h1>
          <div className="w-12"></div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-14 pb-24">
        {/* Hero Section */}
        <div className="relative h-64 overflow-hidden p-4">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${book.coverImageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-lg"></div>
          </div>
          <div className="relative z-[1] flex h-full flex-col items-center justify-center text-white">
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="h-36 w-auto rounded-md object-cover"
              style={{ boxShadow: "0 10px 20px rgba(0,0,0,0.25)" }}
            />
            <h2 className="mt-3 text-center text-xl font-bold">{book.title}</h2>
            <p className="text-sm opacity-80">
              {book.author.split("(지은이")[0].trim()}
            </p>
          </div>
        </div>

        {/* Book Details */}
        <div className="p-4 space-y-4 -mt-10 relative z-[2]">
          <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">
                카테고리
              </h3>
              <p className="text-text-heading dark:text-dark-text-heading">
                {book.category}
              </p>
            </div>

            {book.description && (
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">
                  책 소개
                </h3>
                <p className="text-text-body dark:text-dark-text-body leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-border dark:border-dark-border">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">ISBN</span>
                <span className="text-text-body dark:text-dark-text-body font-mono">
                  {book.isbn13}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card shadow-lg p-4">
        {existingBookId ? (
          <button
            onClick={handleGoToRecord}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors"
          >
            기록 보러가기
          </button>
        ) : (
          <button
            onClick={handleAddToBookshelf}
            disabled={isSaving}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "저장 중..." : "내 서재에 담기"}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookPreviewPage;
