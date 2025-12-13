"use client";

import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "./Icons";

interface RecordHeaderProps {
  onSave: () => void;
  isSaving: boolean;
  onBack: () => void;
}

const RecordHeader: React.FC<RecordHeaderProps> = ({ onSave, isSaving, onBack }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex h-14 items-center justify-between bg-white bg-opacity-80 px-4 backdrop-blur-sm dark:bg-dark-bg dark:bg-opacity-80">
      <button
        onClick={onBack}
        className="flex h-12 w-12 items-center justify-center"
      >
        <ChevronLeftIcon className="h-6 w-6 dark:text-white" />
      </button>
      <h1 className="text-lg font-bold dark:text-white">독서 기록</h1>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="h-12 rounded-lg px-4 text-base font-bold text-primary disabled:text-gray-400"
      >
        {isSaving ? "저장중..." : "저장"}
      </button>
    </header>
  );
};

export default RecordHeader;
