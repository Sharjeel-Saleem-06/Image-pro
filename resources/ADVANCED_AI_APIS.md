# Advanced AI Image Processing APIs - Integration Guide

## 🚀 Recommended Free/Freemium APIs for 2024

### 1. **Hugging Face Inference API** (FREE tier available)
**Use for:** Background removal, upscaling, style transfer
- **URL:** https://huggingface.co/inference-api
- **Models to integrate:**
  - `briaai/RMBG-1.4` - Background removal (state-of-the-art)
  - `tencentarc/gfpgan` - Face enhancement
  - `Salesforce/blip-image-captioning-large` - AI image descriptions
- **Pricing:** FREE tier with rate limits
- **Setup:** Create account at huggingface.co → Get API key

### 2. **Replicate** (Pay-as-you-go, free trial)
**Use for:** Advanced AI models
- **URL:** https://replicate.com
- **Top models:**
  - `stability-ai/sdxl` - Image generation/editing
  - `nightmareai/real-esrgan` - AI upscaling
  - `rembg/rembg` - Background removal
- **Pricing:** ~$0.001-0.01 per image
- **Setup:** Sign up → Add billing (free trial credits)

### 3. **Remove.bg API** (Free tier: 50 images/month)
**Use for:** Professional background removal
- **URL:** https://www.remove.bg/api
- **Pricing:** 50 free credits/month, then $0.20/image
- **Quality:** Industry-leading accuracy
- **Setup:** Sign up → Get API key

### 4. **Cloudinary** (FREE tier: 25GB storage, 25K transformations/month)
**Use for:** Image transformations, AI cropping, background removal
- **URL:** https://cloudinary.com/documentation/image_transformations
- **Features:**
  - Auto-crop with AI
  - Background removal
  - Quality enhancement
  - Auto-format conversion
- **Setup:** Free account → Use transformation API

### 5. **imgly/background-removal** (Open Source - Fully FREE)
**Use for:** Client-side background removal (no API key needed!)
- **GitHub:** https://github.com/imgly/background-removal-js
- **Type:** Browser-based ML model
- **Quality:** Good for free
- **Setup:** `npm install @imgly/background-removal`

### 6. **ImgBB API** (FREE image hosting)
**Use for:** Temporary image storage for API processing
- **URL:** https://api.imgbb.com
- **Pricing:** FREE
- **Setup:** Get API key at imgbb.com

## 📦 Recommended Integration Priority

### Phase 1: Client-Side (No API key)
1. ✅ Install `@imgly/background-removal` for free BG removal
2. ✅ Use existing canvas-based enhancements

### Phase 2: Free Tier APIs
1. Hugging Face (`briaai/RMBG-1.4`) - Better background removal
2. Hugging Face (`tencentarc/gfpgan`) - Face enhancement
3. Remove.bg (50 free/month) - Premium background removal

### Phase 3: Paid (if needed)
1. Replicate (Real-ESRGAN) for true AI upscaling
2. Cloudinary for professional transformations

## 🔧 Example API Integration

### Hugging Face Background Removal
```typescript
async function removeBgWithHuggingFace(imageFile: File, apiKey: string): Promise<Blob> {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch(
    'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    }
  );
  
  return await response.blob();
}
```

### Replicate Real-ESRGAN Upscaling
```typescript
async function upscaleWithReplicate(imageUrl: string, apiKey: string, scale: number): Promise<string> {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
      input: {
        image: imageUrl,
        scale: scale,
        face_enhance: false
      }
    })
  });
  
  const prediction = await response.json();
  // Poll for completion...
  return prediction.output;
}
```

## 🎯 Next Steps
1. Choose which APIs you want to integrate
2. Provide API keys in `.env`:
   - `VITE_HUGGINGFACE_API_KEY`
   - `VITE_REPLICATE_API_KEY`
   - `VITE_REMOVEBG_API_KEY`
   - `VITE_CLOUDINARY_CLOUD_NAME` (if using Cloudinary)
3. I'll integrate them into the AI Enhancer with proper error handling
