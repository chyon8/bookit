import { BASE_URL } from "../constants/Config";

export const fetchBooks = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/books`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};
