'use client';
import SearchView from "../../components/SearchView";
import { useAppContext } from "../../context/AppContext";
import { BookWithReview } from "../../types";

export default function SearchPage() {
  const { handleOpenReview } = useAppContext();

  const handleSelectBook = (book: BookWithReview) => {
    handleOpenReview(book);
  };

  return <SearchView onSelectBook={handleSelectBook} />;
}
