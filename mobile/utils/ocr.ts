
interface OCRResult {
  text: string;
  pageNumber?: string;
  error?: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const performOCR = async (base64Image: string): Promise<OCRResult> => {
  try {
    if (!API_URL) {
      throw new Error('API Configuration Error: API URL is missing.');
    }

    // Remove data:image/xxx;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(`${API_URL}/api/ocr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: cleanBase64 }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'OCR 서버 요청에 실패했습니다.');
    }

    return {
      text: data.text || '',
      pageNumber: data.pageNumber || '',
    };

  } catch (error: any) {
    console.error('OCR Error:', error);
    return { text: '', error: error.message || 'OCR 처리 중 오류가 발생했습니다.' };
  }
};
