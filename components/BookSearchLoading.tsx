import React from "react";

const BookSearchLoading = () => {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      style={{ minHeight: "250px" }}
    >
      <div className="bookshelf-loader">
        <div className="book book-1"></div>
        <div className="book book-2"></div>
        <div className="book book-3"></div>
        <div className="shelf"></div>
      </div>
      <p className="mt-8 text-lg text-gray-500 dark:text-gray-400 font-semibold">
        책을 찾고 있어요...
      </p>
      <style jsx>{`
        .bookshelf-loader {
          position: relative;
          width: 180px;
          height: 120px;
        }
        .book {
          position: absolute;
          bottom: 20px;
          width: 40px;
          height: 80px;
          background-color: #a8d8ea;
          border-radius: 5px 5px 2px 2px;
          transform-origin: bottom center;
          animation: place-book 2s ease-in-out infinite;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .book-1 {
          left: 20px;
          animation-delay: 0s;
          background-color: #f3c969; /* Soft yellow */
          height: 75px;
        }
        .book-2 {
          left: 70px;
          animation-delay: 0.25s;
          background-color: #f28c8c; /* Soft red */
          height: 90px;
          z-index: 10;
        }
        .book-3 {
          left: 120px;
          animation-delay: 0.5s;
          background-color: #82c4a8; /* Soft green */
          height: 80px;
        }
        .shelf {
          position: absolute;
          bottom: 15px;
          left: 0;
          width: 100%;
          height: 5px;
          background-color: #9b7a60; /* Wooden shelf color */
          border-radius: 2.5px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        @keyframes place-book {
          0% {
            opacity: 0;
            transform: translateY(60px) scale(0.8);
          }
          40% {
            opacity: 1;
            transform: translateY(-10px) rotate(-3deg) scale(1.05);
          }
          70% {
            transform: translateY(0) rotate(0) scale(1);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default BookSearchLoading;
