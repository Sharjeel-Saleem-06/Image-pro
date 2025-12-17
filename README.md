# ImagePro - Advanced AI Image Suite

A professional-grade, browser-based image processing platform powered by state-of-the-art Artificial Intelligence. ImagePro combines advanced editing tools, AI generation/restoration, and secure cloud storage into a seamless, privacy-focused application.

🌟 **Live Demo**
🚀 **Production:** [https://imagepro-advanced.netlify.app/](https://imagepro-advanced.netlify.app/)

---

## ✨ Features

### 🎨 Advanced Image Editor
*   **Professional Tools**: Precision crop, resize, rotate, and flip operations.
*   **Filters & Effects**: Cinema-grade filters and mood adjustments.
*   **Fine-Tuning**: Granular control over brightness, contrast, saturation, exposure, and temperature.
*   **Annotation**: Draw, add text, and shapes directly onto your images.

### 🤖 AI Magic Studio
*   **Smart Background Removal**: instantly removes backgrounds using **Remove.bg**, **Removal.ai**, or local **@imgly/background-removal** (auto-switching based on availability).
*   **AI Upscaling (4K)**: Upscale images up to 4x losslessly using **Real-ESRGAN** and **Stability AI**.
*   **Face Restoration**: Restore old, blurry, or damaged portraits with **GFPGAN** and **CodeFormer**.
*   **Text-to-Image Generation**: Generate stunning visuals from text prompts using **Z-Image-Turbo (SDXL)**.
*   **Smart Model Switching**: Automatically falls back to local or alternative cloud providers if an API is unavailable.

### 📝 Smart OCR & Document Intelligence
*   **Text Extraction**: Extract text from images and documents with high accuracy using **Tesseract.js**.
*   **Multi-Format Export**: Copy text to clipboard or export as structured data.
*   **Privacy-First**: OCR processing happens locally in the browser.

### 🔄 Universal Converter
*   **Format Freedom**: Convert between JPG, PNG, WEBP, TIFF, and GIF.
*   **Batch Processing**: Handle multiple files simultaneously.
*   **Compression Control**: Optimize quality vs. file size with visual feedback.

### 🔐 Security & User Management
*   **Supabase Authentication**: Enterprise-grade security with support for:
    *   **Magic Links** (Passwordless login)
    *   **Social Login** (Google)
    *   **Secure Email/Password**
*   **Private Cloud Storage**: Processed images and history are securely stored in your personal Supabase bucket (`processed_images`).
*   **Row Level Security (RLS)**: Ensures only YOU can access your data.

### 🎨 User Experience
*   **Modern UI**: Sleek, responsive interface built with **TailwindCSS** and **shadcn/ui**.
*   **Dark/Light Mode**: Seamless theme switching for comfortable editing day or night.
*   **Real-time Feedback**: Loading states, toast notifications, and progress bars.
*   **Drag & Drop**: Intuitive file handling across the entire app.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React 18 with TypeScript
*   **Build Tool**: Vite (Lightning-fast HMR)
*   **Routing**: React Router v6

### UI & Styling
*   **CSS Framework**: TailwindCSS
*   **Components**: shadcn/ui (Radix UI)
*   **Animations**: Framer Motion
*   **Icons**: Lucide React

### AI & Backend
*   **Cloud AI**: Replicate, Hugging Face (Gradio Client), Stability AI
*   **Local AI**: @imgly/background-removal (Wasm), Tesseract.js (Wasm)
*   **Backend Services**: Supabase (Auth, Storage, Database/PostgreSQL)

### Image Processing
*   **Core**: React-Filerobot-Image-Editor through custom implementation
*   **Canvas**: React-Konva, HTML5 Canvas API

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   npm or yarn
*   Supabase account
*   API Keys (Optional but recommended for full AI features): Remove.bg, Replicate, Stability AI, Hugging Face

### Installation

```bash
# Clone the repository
git clone https://github.com/Sharjeel-Saleem-06/Image-pro.git
cd Image-pro

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start development server
npm run dev
# App will open at http://localhost:5173
```

### Environment Variables

To enable all features, populate your `.env` file with the following keys. 
*Note: The app allows graceful degradation (local fallbacks) if some keys are missing.*

```env
# Supabase (Required for Auth & History)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services (Optional - Falls back to local/free tiers)
VITE_REMOVEBG_API_KEY=your_removebg_key
VITE_REPLICATE_API_KEY=your_replicate_key
VITE_STABILITY_API_KEY=your_stability_key
VITE_HUGGINGFACE_API_KEY=your_hf_token
```

---

## 📁 Project Structure

```
ImagePro/
├── public/                 # Static assets & Netlify redirects
├── resources/              # Documentation & SQL setup scripts
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── ...             # Feature components
│   ├── contexts/           # React Context (Auth, Theme)
│   ├── hooks/              # Custom Hooks
│   ├── lib/                # Core Logic & Utilities
│   │   ├── professionalAI.ts  # AI Service Orchestrator
│   │   ├── supabase.ts        # Database Client
│   │   └── imageUtils.ts      # Canvas/Image Helpers
│   ├── pages/              # Application Routes (Editor, History, Auth)
│   └── ...
├── netlify.toml            # Deployment Config
└── package.json            # Dependencies
```

---

## 🎯 Key Features Explained

### 🧠 Smart AI Orchestration
ImagePro uses a sophisticated fallback mechanism implemented in `professionalAI.ts`. It doesn't rely on a single provider:
1.  **Priority**: Checks for high-quality API keys (e.g., Remove.bg for background).
2.  **Fallback**: If no key or error occurs, it falls back to alternative APIs (e.g., Removal.ai).
3.  **Local Safety Net**: If all cloud APIs fail, it executes WebAssembly-based local models (e.g., `@imgly/background-removal`) directly in the browser. This ensures the app **always works**.

### 🔒 Secure History
Your editing history isn't just local storage—it's synced to the cloud.
*   **Table**: `image_history` stores metadata and settings.
*   **Bucket**: `processed_images` stores the actual high-res files.
*   **Security**: RLS policies ensure strict data isolation.

---

## 🚢 Deployment

### Netlify (Recommended)

This project is optimized for Netlify. A `netlify.toml` and `public/_redirects` are included for perfect SPA routing.

1.  **Fork** this repository.
2.  **Import** to Netlify.
3.  **Build Settings**:
    *   Command: `npm run build`
    *   Directory: `dist`
4.  **Environment Variables**: Paste the contents of your `.env` into Netlify's Environment Variables settings.

---

## 📊 Database Setup

1.  Create a new project at [Supabase](https://supabase.com).
2.  Go to the **SQL Editor**.
3.  Copy and run the contents of `resources/supabase_history_setup.sql`.
    *   This sets up the `processed_images` storage bucket.
    *   Creates the `image_history` table.
    *   Enables Row Level Security (RLS) policies.

---

## 🤝 Contributing

Contributions are welcome! Please:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewMagic`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

---

## 📝 License

This project is licensed under the MIT License. Free for personal and commercial use.

---

## 👨‍💻 Developer

**Muhammad Sharjeel**

*   **Portfolio**: [https://muhammad-sharjeel-portfolio.netlify.app/](https://muhammad-sharjeel-portfolio.netlify.app/)
*   **Email**: sharry00010@gmail.com
*   **GitHub**: [https://github.com/Sharjeel-Saleem-06](https://github.com/Sharjeel-Saleem-06)

---

### 🙏 Acknowledgments
*   **shadcn/ui** for the beautiful component library.
*   **Supabase** for the incredible backend-as-a-service.
*   **Replicate & Hugging Face** for democratizing access to SOTA AI models.
