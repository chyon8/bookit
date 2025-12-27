
import { Platform } from 'react-native';

const GOOGLE_CLOUD_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY;

interface OCRResult {
  text: string;
  pageNumber?: string;
  error?: string;
}

export const performOCR = async (base64Image: string): Promise<OCRResult> => {
  try {
    if (!GOOGLE_CLOUD_VISION_API_KEY) {
      throw new Error('API Configuration Error: API Key is missing.');
    }

    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`;

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION',
            },
          ],
          imageContext: {
            languageHints: ['ko', 'en'],
          },
        },
      ],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
        if (data.error?.message?.includes('billing to be enabled')) {
            throw new Error('Google Cloud 결제 설정이 필요합니다. (월 1,000회 무료)');
        }
        throw new Error(data.error?.message || 'Failed to communicate with Google Vision API');
    }

    // Advanced Filtering Logic (Ported from web route.ts)
    const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
    
    if (!fullTextAnnotation) {
       return { text: '' };
    }

    const pages = fullTextAnnotation.pages || [];
    let finalString = "";

    // 1. Get Image Dimensions (from the first page object)
    const pageObj = pages[0];
    const width = pageObj.width;
    const height = pageObj.height;

    // Thresholds
    const rightMarginThreshold = width * 0.85; // Skip right 15%
    const topMarginThreshold = height * 0.15; // Top 15% (Header)
    const bottomMarginThreshold = height * 0.85; // Bottom 15% (Footer)
    const confidenceThreshold = 0.5;

    // 2. Iterate Blocks
    let pageNumber = "";

    if (pageObj.blocks) {
       for (const block of pageObj.blocks) {
          // Get position
          let minX = width, maxX = 0, minY = height, maxY = 0;
          
          if (block.boundingBox && block.boundingBox.vertices) {
             for (const vertex of block.boundingBox.vertices) {
                const x = vertex.x || 0;
                const y = vertex.y || 0;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
             }
          }

          // Reconstruct text
          let blockText = "";
          if (block.paragraphs) {
             for (const paragraph of block.paragraphs) {
                if (paragraph.words) {
                   for (const word of paragraph.words) {
                      if (word.symbols) {
                         for (const symbol of word.symbols) {
                            blockText += symbol.text;
                            if (symbol.property && symbol.property.detectedBreak) {
                               const breakType = symbol.property.detectedBreak.type;
                               if (breakType === 'SPACE' || breakType === 'SURE_SPACE') {
                                  blockText += " ";
                               } else if (breakType === 'EOL_SURE_SPACE' || breakType === 'LINE_BREAK') {
                                  blockText += "\n";
                               }
                            }
                         }
                      }
                   }
                }
                blockText += "\n"; 
             }
          }
          blockText = blockText.trim();

          const isInTopMargin = maxY < topMarginThreshold;
          const isInBottomMargin = minY > bottomMarginThreshold;
          
          const isLikelyPageNumber = (isInTopMargin || isInBottomMargin) && 
                                      blockText.length < 15 && 
                                      /[0-9]/.test(blockText);
          
          if (block.confidence < confidenceThreshold && !isLikelyPageNumber) {
             continue;
          }

          // Filter Right Margin
          if (minX > rightMarginThreshold) {
             continue; 
          }

          // Check for Page Number
          if (isInTopMargin || isInBottomMargin) {
             if (blockText.length < 15 && /[0-9]/.test(blockText)) {
                const match = blockText.match(/(\d+)/);
                if (match) {
                   pageNumber = match[1];
                }
             }
             continue;
          }

          finalString += blockText + "\n\n";
       }
    }

    const cleanedText = finalString.trim().replace(/\n{3,}/g, "\n\n");

    return { text: cleanedText, pageNumber };

  } catch (error: any) {
    console.error('OCR Error:', error);
    return { text: '', error: error.message || 'OCR 처리 중 오류가 발생했습니다.' };
  }
};
