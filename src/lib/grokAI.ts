import { toast } from "sonner";

// Using GROQ API keys (not xAI Grok) - Multiple keys for fallback
const GROQ_KEYS = [
    import.meta.env.VITE_GROQ_API_KEY,
    import.meta.env.VITE_GROQ_API_KEY_2,
    import.meta.env.VITE_GROQ_API_KEY_3,
    import.meta.env.VITE_GROQ_API_KEY_4,
    import.meta.env.VITE_GROQ_API_KEY_5
].filter(Boolean);

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Vision model for image analysis (updated - 90b was decommissioned)
const VISION_MODEL = "llama-3.2-11b-vision-preview";

/**
 * Converts a File object to a Base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export type AnalysisType =
    | 'caption'
    | 'hashtags'
    | 'summary'
    | 'critique'
    | 'suggestions'
    | 'scene_analysis'
    | 'object_detection'
    | 'technical'
    | 'virality_score'
    | 'best_time'
    | 'accessibility'
    | 'color_palette';

export type SocialPlatform = 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'all';
export type SocialTone = 'professional' | 'casual' | 'humorous' | 'inspirational' | 'dramatic' | 'witty';

/**
 * Analyzes an image using the Groq Vision API (Llama 3.2 Vision).
 */
export const analyzeImageWithGrok = async (
    file: File,
    type: AnalysisType,
    platform: SocialPlatform = 'all',
    tone: SocialTone = 'professional',
    customPrompt?: string
): Promise<string> => {
    if (GROQ_KEYS.length === 0) {
        const error = "Groq API Keys are missing. Please add VITE_GROQ_API_KEY to your .env file.";
        toast.error("Groq API not configured", { description: "Add Groq API keys to use this feature" });
        throw new Error(error);
    }

    try {
        const base64Image = await fileToBase64(file);

        const systemPrompt = "You are an expert AI with advanced vision capabilities, functioning as a world-class Social Media Strategist, Creative Director, and Technical Analyst. Your outputs must be highly actionable, professional, and optimized for maximum impact.";
        let userPrompt = "";

        const toneInstruction = `The tone of the content must be **${tone}**.`;

        switch (type) {
            case 'caption': {
                const platformContext = platform === 'all'
                    ? "Instagram, Twitter, and LinkedIn"
                    : platform.charAt(0).toUpperCase() + platform.slice(1);

                userPrompt = `Analyze this image and generate 5 highly engaging, viral-worthy captions specifically optimized for ${platformContext}.

Requirements:
- ${toneInstruction}
- Use emojis relevant to the image and platform.
- Structure:
  1. A 'Hook' (short, attention-grabbing).
  2. A 'Story' (engaging narrative).
  3. A 'Value-Add' (educational or inspirational).
  4. A 'Question' (to drive engagement).
  5. A 'Minimalist' (one-liner).`;
                break;
            }

            case 'hashtags':
                userPrompt = `Analyze this image and generate 30 high-performing, SEO-optimized hashtags for ${platform === 'all' ? 'social media' : platform}.
         
Categorize them strictly into:
1. **Mega-Viral** (1M+ posts) - Broad reach.
2. **Niche-Specific** (100k-500k) - Targeted audience.
3. **Community/Tribal** (10k-50k) - High engagement.
4. **Visual Descriptors** - Content specific.

Formatting: List them clearly under these headers.`;
                break;

            case 'virality_score':
                userPrompt = `Analyze this image for its "Virality Potential" on ${platform === 'all' ? 'Instagram' : platform}.
                 
Provide a Score from 0-10.

Breakdown:
- **Visual Hook**: Does it grab attention immediately?
- **Emotional Trigger**: What emotion does it evoke?
- **Shareability**: Why would someone share this?

Give 3 specific "Pro Tips" to increase this score (e.g., editing changes, caption angle, trending audio pairing).`;
                break;

            case 'best_time':
                userPrompt = `Based on the visual content of this image (e.g., coffee, sunset, office setting, party), predict the **Best Time to Post** on ${platform === 'all' ? 'Instagram and LinkedIn' : platform}.
                 
Explain the psychology behind the timing.
Example: "Since this is a productivity workspace image, post on Monday at 8 AM when users are planning their week."`;
                break;

            case 'summary':
                userPrompt = "Provide a comprehensive, high-fidelity description of this image. Detail the subject matter, interaction, setting, distinct colors, emotions conveyed, and any text present in the image.";
                break;

            case 'critique':
                userPrompt = "Conduct a rigorous Professional Photography Critique. Evaluate Composition (rule of thirds, framing), Lighting (exposure, contrast, direction), Color Theory (harmony, saturation), and Subject Isolation. Provide 3 specific, actionable edits to reach professional standards.";
                break;

            case 'suggestions':
                userPrompt = "Act as an AI Editor. Suggest 3 specific AI enhancements. For each, explain the 'Before' state (problem) and the expected 'After' result (benefit). Example: 'Use Face Restoration because the subject is slightly out of focus.'";
                break;

            case 'scene_analysis':
                userPrompt = `Perform a Deep Scene Analysis.
         
- **Context**: What is the exact scenario?
- **Environment**: Describe the foreground, midground, and background details.
- **Mood/Atmosphere**: What feeling does the lighting and color grade convey?
- **Narrative**: If this image told a story, what would it be?`;
                break;

            case 'object_detection':
                userPrompt = "Perform a visual inventory. List EVERY distinct object, person, and element visible. Group them logically (e.g., 'Wearables', 'Furniture', 'Nature', 'Electronics'). Be thorough.";
                break;

            case 'technical':
                userPrompt = `Provide a Technical Metadata Assessment.
         
- **Lighting Style**: (e.g., Rembrandt, Butterfly, Natural Golden Hour).
- **Estimated Focal Length**: (e.g., 35mm wide vs 85mm portrait).
- **Depth of Field**: (e.g., Shallow f/1.8 vs Deep f/8).
- **Color Palette**: Describe the dominant hex codes or color names.`;
                break;

            case 'color_palette':
                userPrompt = `Extract the **Color Palette** of this image. 
Identify the 5 distinct dominant colors.
For each color, provide:
- Approximate **Hex Code**.
- **Color Name**.
- **Psychological Effect** (e.g., Blue = Trust).`;
                break;

            case 'accessibility':
                userPrompt = `Generate **SEO-Optimized Alt Text** for this image ensuring web accessibility compliance (WCAG).
                
Also provide a list of 10 **SEO Keywords** derived from the image content that should be included in the file name or page metadata.`;
                break;

            default:
                userPrompt = customPrompt || "Analyze this image.";
        }

        let lastError: Error | null = null;

        // Loop through keys for fallback
        for (const apiKey of GROQ_KEYS) {
            try {
                console.log(`🚀 Analyzing with Groq Vision ${apiKey === GROQ_KEYS[0] ? '(Primary)' : '(Backup)'}...`);

                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: VISION_MODEL,
                        messages: [
                            {
                                role: "system",
                                content: systemPrompt
                            },
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: userPrompt },
                                    { 
                                        type: "image_url", 
                                        image_url: { 
                                            url: base64Image
                                        } 
                                    }
                                ]
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 2048
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("Groq API Error:", errorData);
                    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
                }

                const data = await response.json();
                console.log("✅ Groq Vision response received");
                return data.choices[0]?.message?.content || "No analysis generated.";
            } catch (e: any) {
                console.warn(`⚠️ Groq Key failed: ${e.message}`);
                lastError = e;
                // Continue to next key
                continue;
            }
        }

        // If all keys fail
        throw new Error(lastError?.message || "All Groq API keys failed.");

    } catch (error: any) {
        console.error("Groq Analysis Error:", error);
        throw new Error(error.message || "Failed to analyze image with Groq.");
    }
};
