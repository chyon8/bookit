'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../../context/AppContext';
import { BookWithReview, ReadingStatus } from '../../../types';
import { BookshelfCard } from '../../../components/BookshelfView';
import { ChevronLeftIcon } from '../../../components/Icons';
import ConfirmModal from '../../../components/ConfirmModal';


const readingStatusKorean = {
  [ReadingStatus.Reading]: '읽는 중',
  [ReadingStatus.Finished]: '완독',
  [ReadingStatus.Dropped]: '중단',
  [ReadingStatus.WantToRead]: '읽고 싶은',
};

const BookshelfStatusPage = () => {
  const { status } = useParams<{ status: ReadingStatus }>();
  const { books, handleOpenReview, handleDeleteBook } = useAppContext();
  const router = useRouter();

  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleRequestDelete = (bookId: string, bookTitle: string) => {
      setBookToDelete({ id: bookId, title: bookTitle });
      setConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (bookToDelete) {
          await handleDeleteBook(bookToDelete.id);
          setConfirmModalOpen(false);
          setBookToDelete(null);
      }
  };

  const handleCancelDelete = () => {
      setConfirmModalOpen(false);
      setBookToDelete(null);
  };

  const filteredBooks = books.filter(book => book.review?.status === status);

  const title = readingStatusKorean[status] || '책장';

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button onClick={() => router.back()} className="p-2 mr-2">
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
        {filteredBooks.map((book: BookWithReview) => (
          <BookshelfCard key={book.id} book={book} onSelect={handleOpenReview} onDelete={handleRequestDelete} />
        ))}
      </div>
      <ConfirmModal
            isOpen={isConfirmModalOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            title="책 삭제"
        >
            <p>정말로 <span className="font-bold">{bookToDelete?.title}</span> 책을 책장에서 삭제하시겠습니까?</p>
        </ConfirmModal>
    </div>
  );
};

export default BookshelfStatusPage;
