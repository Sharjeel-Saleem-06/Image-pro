/**
 * Professional AI Image Processing APIs
 * 
 * This module integrates with the best AI APIs for professional image editing:
 * 
 * 1. Remove.bg - Professional background removal (Priority 1)
 * 2. Removal.ai - Professional background removal (Priority 2)
 * 3. @imgly/background-removal - Client-side RemBG (High quality local fallback)
 * 4. Replicate / Stability - Upscaling & Advanced features
 */

import { removeBackground as removeBackgroundImgLy } from '@imgly/background-removal';

// API Keys from environment
const REMOVEBG_API_KEY = import.meta.env.VITE_Remove_bg_KEY || import.meta.env.VITE_REMOVEBG_API_KEY || ''; // Support both names
const REMOVAL_AI_KEY = import.meta.env.VITE_Removal_ai_KEY || '';
const REPLICATE_API_KEY = import.meta.env.VITE_REPLICATE_API_KEY || '';
const STABILITY_API_KEY = import.meta.env.VITE_STABILITY_API_KEY || '';

import { Client } from "@gradio/client";

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert File to base64 data URL
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Fetch blob from URL
 */
export const urlToBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    return await response.blob();
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
};

// ==================== REMOVE.BG API ====================
// Priority 1: Industry standard

/**
 * Remove.bg Background Removal
 * Industry standard, very accurate
 */
export const removeBackgroundWithRemoveBg = async (file: File): Promise<Blob> => {
    if (!REMOVEBG_API_KEY) throw new Error('Remove.bg API key not configured.');

    const formData = new FormData();
    formData.append('image_file', file);
    formData.append('size', 'auto'); // 'auto' = best resolution available (costs credit), 'preview' = free up to 0.25MP

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
            'X-Api-Key': REMOVEBG_API_KEY
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.title || 'Remove.bg failed');
    }

    return await response.blob();
};


// ==================== REMOVAL.AI API ====================
// Priority 2: High quality alternative

export const removeBackgroundWithRemovalAI = async (file: File): Promise<Blob> => {
    if (!REMOVAL_AI_KEY) throw new Error('Removal.ai API key not configured.');

    const formData = new FormData();
    formData.append('image_file', file);
    formData.append('get_file', '1'); // Request binary response directly

    const response = await fetch('https://api.removal.ai/3.0/remove', {
        method: 'POST',
        headers: { 'Rm-Token': REMOVAL_AI_KEY },
        body: formData
    });

    if (!response.ok) {
        // Try to parse JSON error if possible, otherwise text
        try {
            const error = await response.json();
            throw new Error(error.message || 'Removal.ai failed');
        } catch (e) {
            throw new Error(`Removal.ai failed: ${response.statusText}`);
        }
    }

    return await response.blob();
};


// ==================== IMGLY (CLIENT-SIDE REMBG) ====================
// Priority 3: Free High Quality Local Fallback

export const removeBackgroundWithImgLy = async (file: File): Promise<Blob> => {
    // This runs completely in the browser using WebAssembly
    console.log('Running @imgly/background-removal (local rembg)...');
    try {
        // Use CDN for assets to ensure they load correctly without complex build config
        const config = {
            publicPath: 'https://static.img.ly/background-removal-data/1.7.0/',
        };
        const blob = await removeBackgroundImgLy(file, config);
        return blob;
    } catch (e) {
        console.error('ImgLy background removal failed:', e);
        throw e;
    }
};


// ==================== REPLICATE API ====================
// Real-ESRGAN for upscaling, GFPGAN for face restoration

interface ReplicatePrediction {
    id: string;
    status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
    output?: string | string[];
    error?: string;
}

const runReplicateModel = async (
    modelVersion: string,
    input: Record<string, any>
): Promise<string> => {
    if (!REPLICATE_API_KEY) {
        throw new Error('Replicate API key not configured.');
    }

    // Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${REPLICATE_API_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'wait' // Wait for completion up to 60 seconds
        },
        body: JSON.stringify({
            version: modelVersion,
            input
        })
    });

    if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.detail || 'Replicate API error');
    }

    let prediction: ReplicatePrediction = await createResponse.json();

    // If not complete, poll for result
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
            headers: { 'Authorization': `Bearer ${REPLICATE_API_KEY}` }
        });
        prediction = await pollResponse.json();
    }

    if (prediction.status === 'failed') {
        throw new Error(prediction.error || 'Replicate processing failed');
    }

    // Handle output - can be string or array
    const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!output) throw new Error('No output from Replicate');

    return output;
};

export const upscaleWithRealESRGAN = async (
    file: File,
    scale: 2 | 4 = 4,
    faceEnhance: boolean = false
): Promise<Blob> => {
    const base64 = await fileToBase64(file);
    const modelVersion = '42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b';
    const outputUrl = await runReplicateModel(modelVersion, {
        image: base64,
        scale: scale,
        face_enhance: faceEnhance
    });
    return await urlToBlob(outputUrl);
};

export const restoreFaceWithGFPGAN = async (
    file: File,
    version: 'v1.3' | 'v1.4' = 'v1.4',
    upscale: 2 | 4 = 2
): Promise<Blob> => {
    const base64 = await fileToBase64(file);
    const modelVersion = '9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3';
    const outputUrl = await runReplicateModel(modelVersion, {
        img: base64,
        version: version,
        scale: upscale
    });
    return await urlToBlob(outputUrl);
};

export const restoreFaceWithCodeFormer = async (
    file: File,
    fidelity: number = 0.5,
    upscale: 1 | 2 | 3 | 4 = 2
): Promise<Blob> => {
    const base64 = await fileToBase64(file);
    const modelVersion = '7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56';
    const outputUrl = await runReplicateModel(modelVersion, {
        image: base64,
        codeformer_fidelity: fidelity,
        upscale: upscale,
        background_enhance: true,
        face_upsample: true
    });
    return await urlToBlob(outputUrl);
};

// ==================== STABILITY AI API ====================

export const upscaleWithStability = async (
    file: File,
    mode: 'conservative' | 'creative' = 'creative'
): Promise<Blob> => {
    if (!STABILITY_API_KEY) throw new Error('Stability API key not configured.');
    const formData = new FormData();
    formData.append('image', file);
    const endpoint = mode === 'creative'
        ? 'https://api.stability.ai/v2beta/stable-image/upscale/creative'
        : 'https://api.stability.ai/v2beta/stable-image/upscale/conservative';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${STABILITY_API_KEY}`,
            'Accept': 'image/*'
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Stability upscale failed');
    }
    return await response.blob();
};

export const removeBackgroundWithStability = async (file: File): Promise<Blob> => {
    if (!STABILITY_API_KEY) throw new Error('Stability API key not configured');
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(
        'https://api.stability.ai/v2beta/stable-image/edit/remove-background',
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${STABILITY_API_KEY}`,
                'Accept': 'image/*'
            },
            body: formData
        }
    );
    if (!response.ok) throw new Error('Stability background removal failed');
    return await response.blob();
};



// ==================== SMART API SELECTION ====================
// Automatically choose best available API

export type AIProvider = 'removebg' | 'removalai' | 'imgly' | 'replicate' | 'stability';

interface AvailableAPIs {
    removebg: boolean;
    removalai: boolean;
    replicate: boolean;
    stability: boolean;
    huggingface: boolean;
}

export const getAvailableAPIs = (): AvailableAPIs => ({
    removebg: !!REMOVEBG_API_KEY,
    removalai: !!REMOVAL_AI_KEY,
    replicate: !!REPLICATE_API_KEY,
    stability: !!STABILITY_API_KEY,
    huggingface: true, // Our HF Space (sharry121/ImagePro) is always available
});

/**
 * Smart Background Removal Priority:
 * 1. Remove.bg (Industry Standard)
 * 2. Removal.ai (User Choice)
 * 3. @imgly/background-removal (High Quality Local)
 */
export const smartRemoveBackground = async (file: File): Promise<Blob> => {
    const apis = getAvailableAPIs();
    console.log('🎨 Smart Background Removal - Available APIs:', apis);

    // 1. Remove.bg
    if (apis.removebg) {
        try {
            console.log('Trying Remove.bg...');
            return await removeBackgroundWithRemoveBg(file);
        } catch (e) {
            console.warn('❌ Remove.bg failed:', e);
        }
    }

    // 2. Removal.ai
    if (apis.removalai) {
        try {
            console.log('Trying Removal.ai...');
            return await removeBackgroundWithRemovalAI(file);
        } catch (e) {
            console.warn('❌ Removal.ai failed:', e);
        }
    }

    // 3. Client-Side RemBG (ImgLy) - Local Fallback
    try {
        console.log('Trying @imgly/background-removal (Client-side RemBG)...');
        return await removeBackgroundWithImgLy(file);
    } catch (e) {
        console.error('❌ All background removal methods failed (including local).', e);
        throw e;
    }
};

/**
 * Smart AI Upscale
 * 
 * Priority:
 * 1. Replicate Real-ESRGAN (Best quality)
 * 2. Stability AI (Premium)
 * 3. Local Scaling (Basic fallback)
 */
export const smartUpscale = async (
    file: File,
    scale: 2 | 4 = 2,
    faceEnhance: boolean = false
): Promise<Blob> => {
    const apis = getAvailableAPIs();

    // 1. Hugging Face Cloud Space (Linked)
    try {
        console.log('Trying Hugging Face Upscale (sharry121/ImagePro)...');
        return await processImageWithGradioSpace(file, {
            faceModel: faceEnhance ? "CodeFormer.pth" : "None",
            upscaleModel: "SRVGG, realesr-general-x4v3.pth", // High quality RealESRGAN
            upscale: scale
        });
    } catch (e) {
        console.log('HF Space failed, falling back to Replicate.');
    }

    // 2. Replicate
    if (apis.replicate) {
        try {
            console.log('Trying Replicate Real-ESRGAN...');
            return await upscaleWithRealESRGAN(file, scale, faceEnhance);
        } catch (e) {
            console.warn('Replicate failed:', e);
        }
    }

    // 2. Stability AI
    if (apis.stability) {
        try {
            console.log('Trying Stability AI...');
            return await upscaleWithStability(file);
        } catch (e) {
            console.warn('Stability AI failed:', e);
        }
    }

    // 3. Local
    console.log('📍 Using local scaling fallback');
    const { upscaleImage } = await import('./aiUtils');
    return await upscaleImage(file, scale);
};


// ==================== HUGGING FACE GRADIO CLIENT ====================
/**
 * Process image using Hugging Face Gradio Space
 * Uses @gradio/client v2 with handle_file to properly upload and format files
 */
// Parse Space IDs from environment or use default
const DEFAULT_SPACE_ID = "sharry121/ImagePro";
const SPACE_IDS = (import.meta.env.VITE_HF_SPACE_IDS || DEFAULT_SPACE_ID)
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

// Parse HF Tokens for fallback/rate-limit handling
const HF_TOKENS = [
    import.meta.env.VITE_HUGGINGFACE_API_KEY,
    import.meta.env.VITE_HUGGINGFACE_API_KEY_2
].filter((t): t is string => !!t && t.length > 0);

/**
 * Helper to construct the direct Space URL from an ID
 * e.g., "sharry121/ImagePro" -> "https://sharry121-imagepro.hf.space"
 */
const getSpaceUrl = (spaceId: string): string => {
    try {
        const [user, name] = spaceId.split('/');
        if (!user || !name) return `https://${spaceId.replace('/', '-')}.hf.space`; // Fallback
        return `https://${user}-${name.toLowerCase()}.hf.space`;
    } catch (e) {
        return `https://${spaceId.replace('/', '-')}.hf.space`;
    }
};

export const processImageWithGradioSpace = async (
    file: File,
    options: {
        faceModel?: string | null,
        upscaleModel?: string | null,
        upscale?: number,
        fidelity?: number
    }
): Promise<Blob> => {
    const {
        faceModel = "CodeFormer.pth",
        upscaleModel = null,
        upscale = 2,
    } = options;

    let lastError: Error | null = null;

    // Iterate through all available spaces (fallback mechanism)
    for (const spaceId of SPACE_IDS) {
        // Try with tokens if available, otherwise just use the space without token
        const tokensToTry = HF_TOKENS.length > 0 ? HF_TOKENS : [undefined];

        for (const token of tokensToTry) {
            console.log(`🚀 Processing with HF Space (${spaceId})${token ? ' + Token' : ''}... Face: ${faceModel}, Upscale: ${upscaleModel}`);

            try {
                const client = await Client.connect(spaceId, (token ? { hf_token: token } : {}) as any);
                const spaceUrl = getSpaceUrl(spaceId);

                console.log(`✅ Connected to ${spaceId}. Uploading to ${spaceUrl}...`);

                // Use client.upload_files with space URL to properly upload the file
                const uploadResult = await client.upload_files(spaceUrl, [file]);
                console.log('✅ File uploaded:', uploadResult);

                const uploadedFiles = (uploadResult as any).files || [];

                if (!uploadedFiles || uploadedFiles.length === 0) {
                    throw new Error("File upload failed - no files returned");
                }

                const uploadedFile = uploadedFiles[0];

                // Format input for Gallery
                let galleryInput;
                if (typeof uploadedFile === 'string') {
                    galleryInput = [{
                        image: {
                            path: uploadedFile,
                            url: `${spaceUrl}/file=${uploadedFile}`,
                            orig_name: file.name,
                            size: file.size,
                            mime_type: file.type
                        },
                        caption: null
                    }];
                } else if (uploadedFile.path) {
                    galleryInput = [{
                        image: uploadedFile,
                        caption: null
                    }];
                } else {
                    galleryInput = [uploadedFile];
                }

                // Call predict
                const result = await client.predict("/inference", [
                    galleryInput,
                    faceModel,
                    upscaleModel,
                    upscale,
                    "retinaface_resnet50",
                    10,
                    false,
                    false,
                    true
                ]);

                console.log('✅ Prediction received:', result);

                const data = result.data as any[];
                if (data && data[0]) {
                    const gallery = data[0];
                    let output;

                    if (Array.isArray(gallery) && gallery.length > 0) {
                        output = gallery[gallery.length - 1];
                    } else {
                        output = gallery;
                    }

                    let url: string;
                    if (typeof output === 'string') {
                        url = output.startsWith('http') ? output : `${spaceUrl}${output}`;
                    } else if (output?.url) {
                        url = output.url;
                    } else if (output?.image?.url) {
                        url = output.image.url;
                    } else if (output?.path) {
                        url = output.startsWith('http') ? output : `${spaceUrl}${output.path}`;
                    } else {
                        throw new Error("Could not parse output image");
                    }

                    console.log('✅ Downloading result from:', url);
                    return await urlToBlob(url);
                }
                throw new Error("No output image returned from Gradio Space");

            } catch (e: any) {
                console.warn(`⚠️ Space ${spaceId} ${token ? '(Token failed)' : ''} failed:`, e.message);
                lastError = e;
                // Continue to next token/space
                continue;
            }
        }
    }

    // If we get here, all spaces failed
    console.error("❌ All Hugging Face Spaces failed.");
    throw new Error(`All High-Performance Recovery servers failed. Last error: ${lastError?.message || 'Unknown'}`);
};

export const smartFaceRestore = async (
    file: File,
    upscale: 2 | 4 = 2
): Promise<Blob> => {
    // 1. Hugging Face Cloud Space (Linked)
    try {
        console.log('Trying Hugging Face Space for face restore...');
        return await processImageWithGradioSpace(file, {
            faceModel: "CodeFormer.pth",
            upscaleModel: null, // null = no upscaling, focus on face restoration only
            upscale
        });
    } catch (e: any) {
        console.log('HF Space failed:', e.message, '- falling back to Replicate.');
    }

    // 2. Replicate API Fallback
    if (REPLICATE_API_KEY) {
        try {
            console.log('Trying Replicate CodeFormer...');
            return await restoreFaceWithCodeFormer(file, 0.5, upscale);
        } catch (e) {
            try {
                console.log('CodeFormer failed, trying GFPGAN...');
                return await restoreFaceWithGFPGAN(file, 'v1.4', upscale);
            } catch (e2) {
                console.warn('Replicate GFPGAN failed:', e2);
            }
        }
    }

    // 3. Local Fallback
    console.log('📍 Using local scaling fallback for face restore');
    const { upscaleImage } = await import('./aiUtils');
    return await upscaleImage(file, upscale);
};

// ==================== TEXT TO IMAGE (Z-Image-Turbo) ====================
// Uses https://huggingface.co/spaces/mrfakename/Z-Image-Turbo

interface ZImageGenerationOptions {
    prompt: string;
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
}

// Parse Z-Image-Turbo Space IDs
const DEFAULT_Z_TURBO_ID = "mrfakename/Z-Image-Turbo";
const Z_TURBO_IDS = (import.meta.env.VITE_Z_IMAGE_TURBO_IDS || DEFAULT_Z_TURBO_ID)
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0);

export const generateImageWithZImageTurbo = async (options: ZImageGenerationOptions): Promise<Blob> => {
    const {
        prompt,
        width = 1024,
        height = 1024,
        steps = 9,
        seed = 42
    } = options;

    let lastError: Error | null = null;

    for (const spaceId of Z_TURBO_IDS) {
        const tokensToTry = HF_TOKENS.length > 0 ? HF_TOKENS : [undefined];

        for (const token of tokensToTry) {
            console.log(`🚀 Generating with Z-Image-Turbo (${spaceId})${token ? ' + Token' : ''}...`, { prompt, width, height });

            try {
                // Connect to the space
                const client = await Client.connect(spaceId, (token ? { hf_token: token } : {}) as any);

                // Call the generate_image endpoint
                const result = await client.predict("/generate_image", {
                    prompt: prompt,
                    height: height,
                    width: width,
                    num_inference_steps: steps,
                    seed: seed,
                    randomize_seed: true
                });

                console.log('✅ Generation result:', result);

                const data = result.data as any[];

                if (data && data[0]) {
                    const imageOutput = data[0];
                    let url: string;

                    if (typeof imageOutput === 'string') {
                        url = imageOutput;
                    } else if (imageOutput?.url) {
                        url = imageOutput.url;
                    } else if (imageOutput?.path) {
                        // For Z-Image-Turbo, sometimes we get a path that needs the space URL prefix
                        // Construct space URL similarly to ImagePro
                        const spaceUrl = getSpaceUrl(spaceId);
                        url = imageOutput.path.startsWith('http') ? imageOutput.path : `${spaceUrl}/file=${imageOutput.path}`;
                    } else {
                        console.error('Unknown output format:', imageOutput);
                        throw new Error("Could not parse output image");
                    }

                    console.log('✅ Downloading generated image from:', url);
                    return await urlToBlob(url);
                }

                throw new Error("No output image returned from Generator");

            } catch (e: any) {
                console.warn(`⚠️ Z-Image-Turbo Space ${spaceId} ${token ? '(Token failed)' : ''} failed:`, e.message);
                lastError = e;
                continue; // Try next token/space
            }
        }
    }

    console.error("❌ All Z-Image-Turbo Spaces failed.");
    throw new Error(`All Image Generation servers failed. Last error: ${lastError?.message || 'Unknown'}`);
};

export default {
    removeBackgroundWithRemoveBg,
    removeBackgroundWithRemovalAI,
    removeBackgroundWithImgLy,
    upscaleWithRealESRGAN,
    restoreFaceWithGFPGAN,
    restoreFaceWithCodeFormer,
    upscaleWithStability,
    generateImageWithZImageTurbo, // Add new function
    smartRemoveBackground,
    smartUpscale,
    smartFaceRestore,
    getAvailableAPIs,
    fileToBase64,
    urlToBlob
};
