import { GoogleGenAI } from "@google/genai";

console.log("Attempting to import GoogleGenAI...");
try {
    if (GoogleGenAI) {
        console.log("GoogleGenAI imported successfully:", typeof GoogleGenAI);
    } else {
        console.error("GoogleGenAI is undefined!");
    }
} catch (e) {
    console.error("Error checking GoogleGenAI:", e);
}
