// Gemini AI Models
export const GEMINI_MODELS = {
  FLASH: "gemini-2.5-flash",
  FLASH_EXP: "gemini-2.0-flash-exp",
  PRO: "gemini-1.5-pro",
} as const;

// Default model for chat and search
export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS.FLASH;
