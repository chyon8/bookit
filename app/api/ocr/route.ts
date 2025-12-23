import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Configuration Error: API Key is missing.' },
        { status: 500 }
      );
    }

    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    // Remove data:image/xxx;base64, prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'DOCUMENT_TEXT_DETECTION', // Optimized for dense text (books, documents)
            },
          ],
          imageContext: {
            languageHints: ['ko', 'en'], // Hint to prioritize Korean and English
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
        console.error('Google Vision API Error:', data);
        
        // Handle Billing Error
        if (data.error?.message?.includes('billing to be enabled')) {
            return NextResponse.json({ 
                error: 'Google Cloud 결제 설정이 필요합니다.\nGoogle Cloud Console에서 해당 프로젝트의 결제(Billing)를 활성화해주세요.\n(월 1,000회까지는 요금이 부과되지 않습니다.)' 
            }, { status: 403 });
        }

        return NextResponse.json({ error: data.error?.message || 'Failed to communicate with Google Vision API' }, { status: response.status });
    }

    // Advanced Filtering Logic
    const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;
    
    if (!fullTextAnnotation) {
       return NextResponse.json({ text: '' }, { status: 200 });
    }

    const pages = fullTextAnnotation.pages || [];
    let finalString = "";

    // 1. Get Image Dimensions (from the first page object)
    const pageObj = pages[0];
    const width = pageObj.width;
    const height = pageObj.height;

    // Thresholds
    const rightMarginThreshold = width * 0.85; // Skip right 15%
    const bottomMarginThreshold = height * 0.90; // Skip bottom 10%
    const confidenceThreshold = 0.9;

    // 2. Iterate Blocks
    if (pageObj.blocks) {
       for (const block of pageObj.blocks) {
          // Check Confidence
          if (block.confidence < confidenceThreshold) {
             continue;
          }

          // Check Position (Bounding Box)
          // We use the bounding box center or average position to determine if it falls in the skip zone.
          // Let's check vertices.
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

          // Filter Right Margin: If the block starts in the right margin zone
          if (minX > rightMarginThreshold) {
             continue; 
          }

          // Filter Bottom Margin: If the block starts in the bottom margin zone
          if (minY > bottomMarginThreshold) {
             continue;
          }

          // 3. Aggregate Text
          // Blocks contain paragraphs -> words -> symbols. 
          // We need to reconstruct the string.
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
                blockText += "\n"; // Paragraph break
             }
          }
          finalString += blockText + "\n";
       }
    }

    // Only fallback to raw text if our filtering removed everything (which is unlikely but possible)
    // or if we just want to ensure we return something. Default to our filtered string.
    
    // Cleanup extra newlines
    const cleanedText = finalString.trim().replace(/\n{3,}/g, "\n\n");

    return NextResponse.json({ text: cleanedText });

  } catch (error: any) {
    console.error('OCR Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
