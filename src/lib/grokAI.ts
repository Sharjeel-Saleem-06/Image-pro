import { toast } from "sonner";

// Using GROQ API keys - Multiple keys for fallback
const GROQ_KEYS = [
    import.meta.env.VITE_GROQ_API_KEY,
    import.meta.env.VITE_GROQ_API_KEY_2,
    import.meta.env.VITE_GROQ_API_KEY_3,
    import.meta.env.VITE_GROQ_API_KEY_4,
    import.meta.env.VITE_GROQ_API_KEY_5
].filter(Boolean);

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Vision model for image analysis - Llama 4 Scout (current production model)
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

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
 * Analyzes an image using the Groq Vision API (Llama 4 Scout).
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

        // System prompt emphasizes NO markdown formatting
        const systemPrompt = `You are an expert Social Media Strategist and Content Creator. 

CRITICAL FORMATTING RULES:
- DO NOT use markdown formatting (no **, *, #, etc.)
- DO NOT use bullet points with asterisks
- Use plain text only
- Use line breaks and spacing for structure
- Use emojis appropriately for social media content
- Write in a natural, readable format
- Number lists with "1.", "2.", etc.
- Separate sections with blank lines

Your outputs must be ready to copy-paste directly to social media.`;

        let userPrompt = "";
        const toneMap: Record<SocialTone, string> = {
            professional: "professional and polished",
            casual: "friendly and conversational",
            humorous: "witty and fun",
            inspirational: "motivating and uplifting",
            dramatic: "bold and impactful",
            witty: "clever and smart"
        };
        const toneStyle = toneMap[tone];

        switch (type) {
            case 'caption': {
                const platformContext = platform === 'all'
                    ? "Instagram, Twitter, and LinkedIn"
                    : platform.charAt(0).toUpperCase() + platform.slice(1);

                userPrompt = `Analyze this image and create 5 engaging captions for ${platformContext}.

Tone: ${toneStyle}

Format each caption like this:

CAPTION 1 (Hook)
[Write a short, attention-grabbing caption with relevant emojis]

CAPTION 2 (Story)
[Write an engaging narrative caption that tells a story]

CAPTION 3 (Value)
[Write an educational or inspirational caption]

CAPTION 4 (Question)
[Write a caption that asks an engaging question]

CAPTION 5 (Minimalist)
[Write a punchy one-liner]

Remember: No asterisks, no markdown. Just clean, copy-paste ready text.`;
                break;
            }

            case 'hashtags':
                userPrompt = `Analyze this image and generate 30 high-performing hashtags for ${platform === 'all' ? 'social media' : platform}.

Format the hashtags in these categories:

MEGA-VIRAL (1M+ posts)
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7 #hashtag8

NICHE-SPECIFIC (100k-500k posts)
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7 #hashtag8

COMMUNITY (10k-50k posts)
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7

VISUAL DESCRIPTORS
#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 #hashtag6 #hashtag7

Remember: Just the hashtags, no asterisks or special formatting. Ready to copy-paste.`;
                break;

            case 'virality_score':
                userPrompt = `Analyze this image for its virality potential on ${platform === 'all' ? 'Instagram' : platform}.

Provide your analysis in this format:

VIRALITY SCORE: [X/10]

VISUAL HOOK
Does it grab attention immediately? Explain why or why not.

EMOTIONAL TRIGGER
What emotion does this image evoke? How strong is it?

SHAREABILITY FACTOR
Why would someone share this? What makes it share-worthy?

PRO TIPS TO BOOST VIRALITY

1. [First specific tip to improve the score]

2. [Second specific tip with actionable advice]

3. [Third tip - could be about editing, caption, or timing]

Remember: Write in plain text, no asterisks or markdown formatting.`;
                break;

            case 'best_time':
                userPrompt = `Based on the visual content of this image, predict the best time to post on ${platform === 'all' ? 'social media platforms' : platform}.

Format your response like this:

BEST POSTING TIMES

Primary Time: [Day] at [Time] [Timezone]
Secondary Time: [Day] at [Time] [Timezone]

WHY THIS TIMING WORKS

[Explain the psychology behind the timing based on what's in the image]

PLATFORM-SPECIFIC RECOMMENDATIONS

Instagram: [Specific time and reason]
LinkedIn: [Specific time and reason]  
Twitter: [Specific time and reason]

Remember: Plain text only, no asterisks or markdown.`;
                break;

            case 'summary':
                userPrompt = `Provide a comprehensive description of this image.

Format your response like this:

OVERVIEW
[2-3 sentence summary of what the image shows]

SUBJECT
[Describe the main subject or focus]

SETTING
[Describe the environment, location, or background]

COLORS AND MOOD
[Describe the color palette and emotional atmosphere]

NOTABLE DETAILS
[List any interesting or important details]

TEXT IN IMAGE
[Transcribe any text visible, or write "None visible" if there is no text]

Remember: Plain text, no asterisks or markdown formatting.`;
                break;

            case 'critique':
                userPrompt = `Conduct a professional photography critique of this image.

COMPOSITION ANALYSIS
[Evaluate rule of thirds, framing, balance, and visual flow]

LIGHTING ASSESSMENT  
[Evaluate exposure, contrast, direction, and quality of light]

COLOR EVALUATION
[Assess color harmony, saturation, and overall color grading]

SUBJECT FOCUS
[How well is the subject isolated and emphasized?]

IMPROVEMENT RECOMMENDATIONS

1. [First specific, actionable edit to improve the image]

2. [Second recommendation with clear instructions]

3. [Third professional tip to elevate the quality]

Remember: Write in plain text without any asterisks or markdown symbols.`;
                break;

            case 'suggestions':
                userPrompt = `Suggest 3 AI enhancements for this image.

Format each suggestion like this:

ENHANCEMENT 1: [Name of Enhancement]
Current Issue: [What problem exists in the image]
Recommended Fix: [Which AI tool to use and why]
Expected Result: [What the improvement will look like]

ENHANCEMENT 2: [Name of Enhancement]
Current Issue: [What problem exists]
Recommended Fix: [Which AI tool to use]
Expected Result: [Expected improvement]

ENHANCEMENT 3: [Name of Enhancement]
Current Issue: [What problem exists]
Recommended Fix: [Which AI tool to use]
Expected Result: [Expected improvement]

Remember: Plain text only, no asterisks or special formatting.`;
                break;

            case 'scene_analysis':
                userPrompt = `Perform a deep scene analysis of this image.

CONTEXT
[What scenario or situation is depicted?]

FOREGROUND
[Describe what's in the immediate front of the image]

MIDGROUND
[Describe the middle layer of the scene]

BACKGROUND
[Describe what's visible in the distance or behind the subject]

MOOD AND ATMOSPHERE
[What feeling does the lighting and colors convey?]

THE STORY
[If this image told a story, what would it be? Write 2-3 sentences.]

Remember: Plain text format, no asterisks or markdown.`;
                break;

            case 'object_detection':
                userPrompt = `List every distinct object, person, and element visible in this image.

PEOPLE
[List all people visible with brief descriptions]

OBJECTS
[List all objects, grouped logically]

NATURE ELEMENTS
[Trees, plants, sky, water, etc.]

TECHNOLOGY
[Electronics, devices, screens, etc.]

FURNITURE AND FIXTURES
[Tables, chairs, decorations, etc.]

TEXT AND SIGNAGE
[Any visible text, logos, or signs]

OTHER DETAILS
[Anything else noteworthy]

Remember: Simple list format, no asterisks or markdown symbols.`;
                break;

            case 'technical':
                userPrompt = `Provide a technical photography assessment of this image.

LIGHTING STYLE
[Identify the lighting technique - e.g., Rembrandt, Butterfly, Natural, etc.]

ESTIMATED FOCAL LENGTH
[Estimate the lens used - wide angle, standard, telephoto]

DEPTH OF FIELD
[Shallow (blurry background) or Deep (everything in focus)]

APERTURE ESTIMATE
[Estimated f-stop based on depth of field]

COLOR TEMPERATURE
[Warm, cool, or neutral]

DOMINANT COLORS
[List the 3-5 main colors with their approximate hex codes]

OVERALL STYLE
[What photography style or genre does this fit?]

Remember: Plain text, no asterisks or markdown formatting.`;
                break;

            case 'color_palette':
                userPrompt = `Extract the color palette from this image.

Identify the 5 dominant colors and format like this:

COLOR 1
Name: [Color name]
Hex Code: #XXXXXX
Mood: [What feeling this color evokes]

COLOR 2
Name: [Color name]
Hex Code: #XXXXXX
Mood: [What feeling this color evokes]

COLOR 3
Name: [Color name]
Hex Code: #XXXXXX
Mood: [What feeling this color evokes]

COLOR 4
Name: [Color name]
Hex Code: #XXXXXX
Mood: [What feeling this color evokes]

COLOR 5
Name: [Color name]
Hex Code: #XXXXXX
Mood: [What feeling this color evokes]

PALETTE HARMONY
[Describe how these colors work together]

Remember: Plain text only, no asterisks or markdown.`;
                break;

            case 'accessibility':
                userPrompt = `Generate SEO-optimized alt text and keywords for this image.

ALT TEXT (Short)
[Concise description under 125 characters for screen readers]

ALT TEXT (Detailed)
[Comprehensive description for maximum accessibility]

SEO KEYWORDS
1. [keyword]
2. [keyword]
3. [keyword]
4. [keyword]
5. [keyword]
6. [keyword]
7. [keyword]
8. [keyword]
9. [keyword]
10. [keyword]

RECOMMENDED FILENAME
[suggested-filename-with-keywords.jpg]

Remember: Plain text format, no asterisks or markdown symbols.`;
                break;

            default:
                userPrompt = customPrompt || "Analyze this image and provide a detailed description. Use plain text without any markdown formatting.";
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
                
                // Clean any remaining markdown artifacts from the response
                let content = data.choices[0]?.message?.content || "No analysis generated.";
                content = cleanMarkdownArtifacts(content);
                
                return content;
            } catch (e: any) {
                console.warn(`⚠️ Groq Key failed: ${e.message}`);
                lastError = e;
                continue;
            }
        }

        throw new Error(lastError?.message || "All Groq API keys failed.");

    } catch (error: any) {
        console.error("Groq Analysis Error:", error);
        throw new Error(error.message || "Failed to analyze image with Groq.");
    }
};

/**
 * Cleans markdown artifacts from the response
 */
function cleanMarkdownArtifacts(text: string): string {
    return text
        // Remove bold markdown (**text** or __text__)
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        // Remove italic markdown (*text* or _text_) - be careful not to remove bullet asterisks
        .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
        .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1')
        // Remove markdown headers
        .replace(/^#{1,6}\s+/gm, '')
        // Clean up bullet points that use asterisks (convert to dashes or remove)
        .replace(/^\s*\*\s+/gm, '• ')
        // Remove code blocks
        .replace(/```[^`]*```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        // Clean up excessive whitespace while preserving paragraph breaks
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
