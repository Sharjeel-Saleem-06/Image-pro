import { ActionFunction } from "react-router-dom";

// Standardize image dimensions to optimize token usage while maintaining readability
const MAX_DIMENSION_FAST = 1024;
const MAX_DIMENSION_ACCURATE = 2048;

/**
 * Resizes an image ensuring its largest dimension does not exceed maxDimension.
 * Returns a base64 string.
 */
const prepareImageForGroq = async (file: File, maxDimension: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                // Use JPEG for better compression/token ratio than PNG for photos/scans
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
    usage?: {
        total_tokens: number;
        completion_time?: number;
    };
}

export const extractTextWithGroq = async (
    file: File,
    mode: 'fast' | 'balanced' | 'accurate',
    apiKey: string,
    onProgress?: (stage: string) => void,
    language?: string
): Promise<{ text: string; confidence: number; processingTime: number; model: string }> => {

    const startTime = Date.now();
    onProgress?.('Preparing image...');

    // Select model based on mode
    // The 'preview' models (11b-vision-preview, 90b-vision-preview) are often decommissioned.
    // We default to the stable/current active model IDs.
    // Try using the base active model or the specific Llama 4 Scout if available.
    // For now, let's try 'llama-3.2-90b-vision' (standard) or fallback to 'llama-3.2-11b-vision'.
    // NOTE: Groq often rotates model IDs. 

    // As of late 2024/2025:
    let model = 'llama-3.2-90b-vision-preview'; // Keeping this for a second, but if it fails, we need the new one.
    // Actually, user logs prove it failed.

    // Switch to Llama 3.2 11B Vision (Stable) or Llama 4 Scout
    // Let's use the widely available 11b vision or 90b vision without preview if possible, 
    // BUT search results suggested 'meta-llama/llama-4-scout-17b-16e-instruct' is the replacement.
    model = 'meta-llama/llama-4-scout-17b-16e-instruct'; // Primary candidate

    let maxDim = MAX_DIMENSION_FAST;

    // Check if user has a custom model defined that supports vision
    const envModel = import.meta.env.VITE_GROQ_MODEL;
    if (envModel && (envModel.includes('vision') || envModel.includes('scout') || envModel.includes('maverick') || envModel.includes('pixtral') || envModel.includes('llava'))) {
        model = envModel;
    }

    if (mode === 'accurate') {
        maxDim = MAX_DIMENSION_ACCURATE;
        // If 90b vision is available/valid, we might prefer it for 'accurate', but 'scout' is the safest bet now.
        // model = 'llama-3.2-90b-vision'; // Potential alternative if Scout isn't enough
    } else if (mode === 'balanced') {
        maxDim = 1536;
    } else {
        // Fast
        maxDim = MAX_DIMENSION_FAST;
    }

    try {
        const base64Image = await prepareImageForGroq(file, maxDim);

        onProgress?.('Sending to AI engine...');

        const promptText = `Extract ALL text from this image exactly as it appears. 
${language ? `The text is likely in ${language}.` : ''}
Preserve the original layout, spacing, and line breaks. If there are tables, try to represent them with spacing or standard markdown table syntax. Do NOT add any conversational filler like 'Here is the text'. Output ONLY the extracted text content. If the image contains no text, return 'No text found'.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: promptText
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64Image
                                }
                            }
                        ]
                    }
                ],
                temperature: 0.1, // Low temp for extraction accuracy
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || `Groq API Error: ${response.status}`);
        }

        onProgress?.('Processing AI response...');
        const data: GroqResponse = await response.json();
        const extractedText = data.choices[0]?.message?.content || "";

        // Calculate simple stats
        const processingTime = Date.now() - startTime;
        // Mock confidence since LLMs don't return per-character confidence easily
        // We assume high confidence if it returns result
        const confidence = mode === 'accurate' ? 98 : 95;

        return {
            text: extractedText,
            confidence,
            processingTime,
            model
        };

    } catch (error) {
        console.error("Groq OCR Error:", error);
        throw error;
    }
};
