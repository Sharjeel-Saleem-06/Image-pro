# ImagePro - Professional AI Image Suite

ImagePro is a comprehensive, browser-based image processing platform that combines professional-grade tools with the power of Artificial Intelligence. Built for creators, developers, and everyday users, ImagePro offers a privacy-focused, secure, and feature-rich environment for all your image editing needs.

## 🚀 Features

### 🔐 Secure Authentication & Data
*   **Magic Link Login**: Passwordless, secure sign-in via email.
*   **Supabase Backend**: Industry-standard security for user data and authentication.
*   **Private & Secure**: Your original images are processed securely, with a focus on privacy.

### 🎨 Advanced Image Editor
*   **Professional Tools**: Crop, resize, rotate, and adjust your images with precision.
*   **Filters & Effects**: Apply a wide range of filters to enhance the mood of your photos.
*   **Fine-Tuning**: Adjust brightness, contrast, saturation, and more.

### ✨ AI Magic Studio (AI Enhancer)
Unlock the power of multiple state-of-the-art AI models:
*   **Image Upscaling**: Scale images up to 4x (2x/4x) without losing quality using Real-ESRGAN and Stability AI.
*   **Background Removal**: Instantly remove backgrounds with industry-leading accuracy (Remove.bg, Removal.ai, and local fallbacks).
*   **Face Restoration**: Restore old or blurry face photos with GFPGAN and CodeFormer.
*   **AI Generation**: Generate images from text prompts using Z-Image-Turbo.
*   **Smart Model Selection**: Automatically switches between Replicate, Hugging Face, and Local models to ensure the best result.

### 📝 Smart OCR (Text Extractor)
*   **Extract Text**: Instantly convert images containing text into editable digital text.
*   **Multi-Language**: Support for multiple languages.
*   **Copy & Export**: One-click copy or export to standard text formats.

### 🔄 Universal Image Converter
*   **Format Freedom**: Convert between JPG, PNG, WEBP, and other popular formats.
*   **Batch Processing**: Convert multiple images at once.
*   **Compression Control**: Optimize file sizes for the web.

### 📜 History & Dashboard
*   **Activity Tracking**: Keep track of your recent edits, conversions, and AI enhancements.
*   **Statistics**: View your usage stats and storage savings.

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), TypeScript
*   **Styling**: Tailwind CSS, Shadcn/ui (Radix UI)
*   **AI Integration**: Replicate, Hugging Face (Gradio), Stability AI
*   **Backend/Auth**: Supabase
*   **Local Processing**: @imgly/background-removal, Tesseract.js

## 📦 Deployment (Netlify)

This project is optimized for deployment on Netlify.

### Automatic Deployment (Recommended)
1.  Fork this repository.
2.  Connect your GitHub repo to Netlify.
3.  Configure Build Settings:
    *   **Build Command**: `npm run build`
    *   **Publish Directory**: `dist`
4.  Add Environment Variables (see `.env.example`).

### Manual Deployment
1.  Run the build command locally:
    ```bash
    npm run build
    ```
2.  Locate the generated `dist` folder in your project root.
3.  Drag and drop the `dist` folder into the Netlify Drop interface.

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file (or Netlify environment settings):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_REMOVEBG_API_KEY=optional_key
VITE_REPLICATE_API_KEY=optional_key
VITE_STABILITY_API_KEY=optional_key
VITE_HUGGINGFACE_API_KEY=optional_key
```

## 📄 License

This project is free for personal and commercial use. No attribution required.
