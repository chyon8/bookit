"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { BookWithReview, UserBook } from "../types";
import { BookOpenIcon, SparklesIcon } from "../components/Icons";
import { createClient } from "../utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

interface AppContextType {
  books: BookWithReview[];
  isLoading: boolean;
  user: User | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
  isReviewModalOpen: boolean;
  selectedBook: BookWithReview | null;
  handleOpenReview: (book: BookWithReview) => void;
  handleCloseReview: () => void;
  handleSaveReview: (reviewedBook: BookWithReview) => Promise<void>;
  handleDeleteBook: (bookId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<BookWithReview[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookWithReview | null>(null);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isLoading, setIsLoading] = useState(true);

  // Get user session
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session) {
          fetchUserBooks(session.user);
        } else {
          setBooks([]); // Clear books on logout
        }
        setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const fetchUserBooks = useCallback(
    async (currentUser: User) => {
      if (!currentUser) return;

      const { data: userBooks, error } = await supabase
        .from("user_books")
        .select(`*, books (*)`)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user books:", error);
        toast.error("Could not fetch your bookshelf.");
        setBooks([]);
      } else if (userBooks) {
        const formattedBooks: BookWithReview[] = userBooks.map((ub: any) => {
          const { books: bookData, ...reviewData } = ub;
          
          // Create the searchable content string
          const searchable_content = [
            bookData.title,
            bookData.author,
            reviewData.one_line_review,
            ...(reviewData.memos || []),
            ...((reviewData.memorable_quotes as any[]) || []).flatMap((q: any) => [
              q.quote,
              q.thought,
            ]),
            ...(reviewData.questions_from_book || []),
            reviewData.connected_thoughts,
            reviewData.overall_impression,
            reviewData.reread_reason,
            reviewData.notes,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return {
            id: bookData.id,
            isbn13: bookData.isbn13,
            title: bookData.title,
            author: bookData.author,

            category: bookData.category,
            description: bookData.description,
            coverImageUrl: bookData.cover_image_url, // Fix: Map snake_case to camelCase
            review: reviewData as UserBook,
            searchable_content,
          };
        });
        setBooks(formattedBooks);
      }
    },
    [supabase]
  );

  // Initial fetch
  useEffect(() => {
    if (user) fetchUserBooks(user);
  }, [user, fetchUserBooks]);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) setTheme(savedTheme);
    document.documentElement.classList.toggle(
      "dark",
      (savedTheme || "dark") === "dark"
    );
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      return newTheme;
    });
  };

  const handleOpenReview = useCallback((book: BookWithReview) => {
    setSelectedBook(book);
    setReviewModalOpen(true);
  }, []);

  const handleCloseReview = useCallback(() => {
    setReviewModalOpen(false);
    setSelectedBook(null);
  }, []);

  const handleSaveReview = async (reviewedBook: BookWithReview) => {
    const savePromise = async () => {
      if (!user) throw new Error("User not authenticated.");

      const { review, ...bookData } = reviewedBook;
      const cleanedAuthor = bookData.author.split("(지은이")[0].trim();

      const bookRecord = {
        title: bookData.title,
        author: cleanedAuthor,
        cover_image_url: bookData.coverImageUrl,
        category: bookData.category,
        isbn13: bookData.isbn13,
      };

      let finalBookData: any;

      if (bookData.id && bookData.id.length > 15) {
        // DB id is a uuid, aladin id is shorter.
        // Existing book: update using its primary key.
        const { data, error } = await supabase
          .from("books")
          .update(bookRecord)
          .eq("id", bookData.id)
          .select()
          .single();

        if (error) throw error;
        finalBookData = data;
      } else {
        // New book from search: select or insert to avoid duplicates.
        const { data: existingBook, error: selectError } = await supabase
          .from("books")
          .select("id, cover_image_url")
          .eq("isbn13", bookRecord.isbn13)
          .single();

        if (selectError && selectError.code !== 'PGRST116') { // PGRST116: "exact one row not found"
          throw selectError;
        }

        if (existingBook) {
          finalBookData = { ...bookRecord, ...existingBook };
        } else {
          const { data: newBook, error: insertError } = await supabase
            .from("books")
            .insert(bookRecord)
            .select()
            .single();
          
          if (insertError) throw insertError;
          finalBookData = newBook;
        }
      }

      if (!finalBookData) throw new Error("Book saving failed.");

      const reviewData = {
        ...review,
        user_id: user.id,
        book_id: finalBookData.id,
      };
      const { data: upsertedReview, error: reviewError } = await supabase
        .from("user_books")
        .upsert(reviewData, { onConflict: "user_id,book_id" })
        .select()
        .single();

      if (reviewError) throw reviewError;

      const finalReview = upsertedReview as UserBook;

      const searchable_content = [
        bookData.title,
        bookData.author,
        finalReview.one_line_review,
        ...(finalReview.memos || []),
        ...((finalReview.memorable_quotes as any[]) || []).flatMap((q: any) => [
          q.quote,
          q.thought,
        ]),
        ...(finalReview.questions_from_book || []),
        finalReview.connected_thoughts,
        finalReview.overall_impression,
        finalReview.reread_reason,
        finalReview.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const finalBook: BookWithReview = {
        ...bookData,
        id: finalBookData.id,
        coverImageUrl: finalBookData.cover_image_url,
        review: finalReview,
        searchable_content,
      };

      setBooks((currentBooks) => {
        const existingIndex = currentBooks.findIndex(
          (b) => b.id === finalBook.id
        );
        if (existingIndex > -1) {
          const newBooks = [...currentBooks];
          newBooks[existingIndex] = finalBook;
          return newBooks;
        } else {
          const newBooks = currentBooks.filter(
            (b) => b.review.book_id !== finalBook.review.book_id
          );
          return [...newBooks, finalBook];
        }
      });
    };

    await toast.promise(savePromise(), {
      loading: "내 책장에 저장 중...",
      success: "저장되었습니다!",
      error: (err) => `Save failed: ${err.message}`,
    });

    handleCloseReview();
  };

  const handleDeleteBook = async (bookId: string) => {
    const deletePromise = async () => {
      if (!user) throw new Error("User not authenticated.");

      const { error } = await supabase
        .from("user_books")
        .delete()
        .match({ book_id: bookId, user_id: user.id });
      if (error) throw error;

      setBooks(books.filter((b) => b.id !== bookId));
    };

    await toast.promise(deletePromise(), {
      loading: "책장에서 삭제 중...",
      success: "삭제되었습니다!",
      error: (err) => `Delete failed: ${err.message}`,
    });
  };

  if (isLoading && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-light-gray dark:bg-dark-bg">
        <div className="text-center">
          <BookOpenIcon className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-text-body dark:text-dark-text-body mt-4">
            책장 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        books,
        isLoading,
        user,
        theme,
        toggleTheme,
        isReviewModalOpen,
        selectedBook,
        handleOpenReview,
        handleCloseReview,
        handleSaveReview,
        handleDeleteBook,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
};
