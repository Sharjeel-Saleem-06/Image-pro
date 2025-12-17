# 🎨 ImagePro - Learning-Focused Image Processing Platform

![ImagePro Logo](https://img.shields.io/badge/ImagePro-Modern%20Image%20Processing-blue?style=for-the-badge&logo=image&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript)
![Tesseract](https://img.shields.io/badge/Tesseract.js-5.1-00A86B?style=flat-square)

**ImagePro** is a modern, learning-focused image processing platform built as a student project to explore web technologies and client-side image manipulation. This application demonstrates practical implementations of image editing, format conversion, OCR text extraction, and canvas-based AI effects—all running directly in your browser.

## 🎯 Project Goals

This project was built to learn and demonstrate:
- **Modern React Development** with TypeScript and hooks
- **Client-side Image Processing** using Canvas API
- **OCR Integration** with Tesseract.js
- **Responsive UI Design** with TailwindCSS and ShadCN UI
- **State Management** patterns in React applications

## 🌟 Live Demo

🚀 **[Try ImagePro Live](https://studyflow-quizapp.netlify.app/)**

## 📫 Contact

- Portfolio: [muhammad-sharjeel-portfolio.netlify.app](https://muhammad-sharjeel-portfolio.netlify.app/)
- Email: sharry00010@gmail.com

---

## ✨ Features

### 🔄 Image Converter
- **Multi-format Support**: Convert between PNG, JPG, WebP, GIF, BMP
- **Batch Processing**: Convert multiple images at once
- **Quality Control**: Adjustable compression settings (10-100%)
- **ZIP Downloads**: Bulk download converted images

### 🎨 Image Editor
- **Transform Tools**: Crop, rotate (90°), flip horizontal/vertical
- **Filters**: Grayscale, Sepia, Vintage, Cool, Warm, Dramatic
- **Adjustments**: Brightness, contrast, saturation, hue, gamma, blur
- **Text Overlays**: Draggable text with font/color customization
- **History System**: 20-step undo/redo support
- **Canvas-based**: Real-time preview with zoom controls

### 📝 OCR Text Extractor
- **16 Languages**: English, Spanish, French, German, Chinese, Japanese, Arabic, and more
- **Powered by Tesseract.js**: Industry-standard OCR engine
- **Quality Modes**: Fast, Balanced, and Accurate processing options
- **Export Formats**: TXT, DOCX, and JSON
- **Confidence Scoring**: Shows extraction accuracy

### 🤖 AI Enhancement Tools
> ⚠️ **Note**: These are canvas-based filters, not true ML-powered AI features

- **Image Upscaling**: 2x-4x enlargement with sharpening
- **Background Removal**: Color-similarity based removal (works best on solid backgrounds)
- **Style Transfer**: Sketch, watercolor, oil painting, and cartoon effects
- **Auto Enhancement**: Histogram-based brightness/contrast adjustment
- **ASCII Art Generator**: Convert images to text art

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | TailwindCSS, ShadCN UI, Framer Motion |
| **Image Processing** | Canvas API, browser-image-compression |
| **OCR** | Tesseract.js v5 |
| **File Handling** | JSZip, FileSaver.js, docx.js |
| **State** | React hooks, localStorage |

## 📁 Project Structure

```
imagepro/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # ShadCN UI components (48 files)
│   │   ├── Layout.tsx       # Main layout wrapper
│   │   ├── Navigation.tsx   # Navigation component
│   │   └── Footer.tsx       # Footer component
│   ├── pages/               # Main page components
│   │   ├── HomePage.tsx     # Landing page
│   │   ├── ImageConverter.tsx
│   │   ├── ImageEditor.tsx  # ~1600 lines
│   │   ├── OCR.tsx          # ~985 lines
│   │   ├── AIEnhancer.tsx   # ~750 lines
│   │   ├── About.tsx
│   │   └── Contact.tsx
│   ├── lib/                 # Utility functions
│   │   ├── aiUtils.ts       # AI enhancement functions
│   │   ├── imageUtils.ts    # Image processing utilities
│   │   └── statsUtils.ts    # Usage tracking
│   └── hooks/               # Custom React hooks
├── public/                  # Static assets
└── config files             # Vite, Tailwind, TypeScript configs
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/imagepro.git

# Navigate to project directory
cd imagepro

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📊 Feature Status & Analysis

### ✅ Fully Working Features

| Feature | Status | Notes |
|---------|--------|-------|
| Image Converter | ✅ Working | All format conversions functional |
| Image Editor - Basic | ✅ Working | Rotate, flip, crop, filters |
| Image Editor - Adjustments | ✅ Working | Brightness, contrast, saturation, etc. |
| Text Overlays | ✅ Working | Draggable with customization |
| Undo/Redo | ✅ Working | 20-step history |
| OCR - Basic | ✅ Working | Text extraction with Tesseract.js |
| OCR - Multi-language | ✅ Working | 16 languages supported |
| Export Formats | ✅ Working | TXT, DOCX, JSON export |
| ASCII Art | ✅ Working | Canvas-based conversion |

### ⚠️ Features with Limitations

| Feature | Status | Current Issue | Improvement Path |
|---------|--------|---------------|------------------|
| Background Removal | ⚠️ Basic | Uses simple color-similarity algorithm | Consider using @imgly/background-removal-js for ML-based removal |
| Image Upscaling | ⚠️ Basic | Canvas interpolation + sharpening only | Research Real-ESRGAN.js or similar |
| Style Transfer | ⚠️ Basic | Pixel manipulation filters | Consider TensorFlow.js with pre-trained style transfer models |
| Auto Enhancement | ⚠️ Basic | Histogram stretching only | Could add adaptive histogram equalization |
| Quality Modes in OCR | ⚠️ UI Only | Settings don't affect processing | Need to implement PSM modes properly |

### 🔧 Known Issues

1. **OCR Quality Mode**: The Fast/Balanced/Accurate modes in the UI don't currently change Tesseract parameters meaningfully
2. **Background Removal**: Works poorly on complex backgrounds—best for solid color backgrounds
3. **Large Image Performance**: Large images (>5MB) may cause browser slowdown
4. **TensorFlow.js Warning**: TensorFlow.js is included in dependencies but not actively used

---

## 🎓 What I Learned

### Technical Skills
- **Canvas API mastery**: Pixel manipulation, transformations, and filters
- **Async processing**: Handling long-running operations with progress feedback
- **File API**: Reading, converting, and downloading files
- **Web Workers**: Tesseract.js uses workers for non-blocking OCR

### Design Patterns
- **Component composition** with React
- **Custom hooks** for reusable logic
- **State management** for complex editor history
- **Responsive design** with Tailwind utilities

### Challenges Overcome
- Implementing undo/redo with canvas-based editing
- Managing memory when processing large images
- Handling cross-browser blob/file operations

---

## 🚀 Future Improvements

### Short-term
- [ ] Fix OCR quality mode to use different Tesseract PSM settings
- [ ] Add loading skeleton during image processing
- [ ] Improve error handling and user feedback
- [ ] Add keyboard shortcuts for editor

### Medium-term
- [ ] Integrate ML-based background removal (remove.bg API or local ML)
- [ ] Add real AI upscaling with Super Resolution models
- [ ] Implement proper TensorFlow.js style transfer
- [ ] Add batch OCR processing

### Long-term
- [ ] PWA support for offline use
- [ ] Image annotation tools
- [ ] Cloud storage integration
- [ ] Collaborative editing features

---

## 🧪 Testing the Features

### Testing OCR
1. Navigate to OCR page
2. Upload a clear image with text
3. Select language (English works best)
4. Click "Extract Text"
5. View results with confidence score

### Testing AI Tools
1. Navigate to AI Enhancer
2. Upload an image
3. Try each tool to see effects:
   - **Upscaler**: Best for small images
   - **Background Removal**: Best with solid backgrounds
   - **Style Transfer**: Works on all images
   - **Auto Enhance**: Best for underexposed photos

---

## 📝 Configuration

### Environment Variables
```env
VITE_APP_NAME=ImagePro
VITE_APP_VERSION=1.0.0
```

### Supported Image Formats
- **Input**: JPEG, PNG, WebP, GIF, BMP, TIFF
- **Output**: JPEG, PNG, WebP

---

## 🤝 Contributing

This is a learning project, but contributions are welcome! Feel free to:
- Report bugs and issues
- Suggest improvements
- Submit pull requests

---

## 📜 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- **Tesseract.js** for OCR capabilities
- **ShadCN UI** for beautiful components
- **Framer Motion** for animations
- Built with curiosity and lots of ☕

---

*Built as a learning project to explore modern web development and image processing techniques.*
