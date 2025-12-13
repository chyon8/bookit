"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const ToastProvider: React.FC = () => {
  const { theme } = useAppContext();

  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: theme === "dark" ? "#2d3748" : "#ffffff",
          color: theme === "dark" ? "#e2e8f0" : "#1a202c",
        },
      }}
    />
  );
};

export default ToastProvider;