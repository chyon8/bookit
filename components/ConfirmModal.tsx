"use client";

import React from "react";
import { XMarkIcon } from "./Icons";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-sm mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-text-heading dark:text-dark-text-heading">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-light-gray dark:hover:bg-dark-bg"
            >
              <XMarkIcon className="w-5 h-5 text-text-body dark:text-dark-text-body" />
            </button>
          </div>
          <div className="mt-4 text-text-body dark:text-dark-text-body">
            {children}
          </div>
        </div>
        <div className="bg-light-gray dark:bg-dark-bg px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-white dark:bg-dark-card border border-border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
