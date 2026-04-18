// Gemini AI Models
export const GEMINI_MODELS = {
  FLASH: "gemini-2.5-flash",
  FLASH_EXP: "gemini-2.0-flash-exp",
  PRO: "gemini-1.5-pro",
} as const;

// OpenAI Models
export const OPENAI_MODELS = {
  GPT_4O_MINI: "gpt-4o-mini",
  GPT_4O: "gpt-4o",
} as const;

// Default model for chat and search
export const DEFAULT_AI_MODEL = OPENAI_MODELS.GPT_4O_MINI;
export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS.FLASH;
