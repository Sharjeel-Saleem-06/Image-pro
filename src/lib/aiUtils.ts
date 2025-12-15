// AI utilities for ImagePro
export interface AIProcessingOptions {
  type: 'upscale' | 'background-remove' | 'style-transfer' | 'enhance' | 'ascii-art';
  scale?: number;
  style?: string;
  density?: number;
  quality?: number;
}

export interface AIResult {
  success: boolean;
  result?: Blob;
  error?: string;
  processingTime?: number;
}

// ASCII Art Generator
export const generateASCIIArt = async (
  file: File,
  options: { density?: number; width?: number; colored?: boolean } = {}
): Promise<string> => {
  const { density = 10, width = 80, colored = false } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate dimensions
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      const height = Math.floor(width * aspectRatio * 0.5); // 0.5 to account for character height

      canvas.width = width;
      canvas.height = height;

      // Draw and get image data
      ctx?.drawImage(img, 0, 0, width, height);
      const imageData = ctx?.getImageData(0, 0, width, height);

      if (!imageData) {
        reject(new Error('Failed to get image data'));
        return;
      }

      // ASCII characters from darkest to lightest
      const chars = '@%#*+=-:. ';
      let ascii = '';

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const r = imageData.data[offset];
          const g = imageData.data[offset + 1];
          const b = imageData.data[offset + 2];

          // Calculate brightness
          const brightness = (r + g + b) / 3;
          const charIndex = Math.floor((brightness / 255) * (chars.length - 1));

          if (colored) {
            const color = `rgb(${r},${g},${b})`;
            ascii += `<span style="color:${color}">${chars[charIndex]}</span>`;
          } else {
            ascii += chars[charIndex];
          }
        }
        ascii += '\n';
      }

      resolve(ascii);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Real AI image processing utilities

// Upscale image using canvas interpolation and sharpening
export const upscaleImage = async (file: File, scale: number = 2): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      // Set new dimensions
      canvas.width = originalWidth * scale;
      canvas.height = originalHeight * scale;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Use high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw upscaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply sharpening filter
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const sharpened = new Uint8ClampedArray(data);

      // Sharpening kernel
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * canvas.width + (x + kx)) * 4 + c;
                sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const idx = (y * canvas.width + x) * 4 + c;
            sharpened[idx] = Math.max(0, Math.min(255, sum));
          }
        }
      }

      const sharpenedImageData = new ImageData(sharpened, canvas.width, canvas.height);
      ctx.putImageData(sharpenedImageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to upscale image'));
        },
        'image/png'
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Remove background using advanced edge detection and color analysis
export const removeBackground = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // Sample background colors from all edges (top, bottom, left, right)
      const bgSamples: number[][] = [];
      const sampleCount = 20;

      // Top edge
      for (let i = 0; i < sampleCount; i++) {
        const x = Math.floor((width / sampleCount) * i);
        const idx = x * 4;
        bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }

      // Bottom edge
      for (let i = 0; i < sampleCount; i++) {
        const x = Math.floor((width / sampleCount) * i);
        const y = height - 1;
        const idx = (y * width + x) * 4;
        bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }

      // Left edge
      for (let i = 0; i < sampleCount; i++) {
        const y = Math.floor((height / sampleCount) * i);
        const idx = y * width * 4;
        bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }

      // Right edge
      for (let i = 0; i < sampleCount; i++) {
        const y = Math.floor((height / sampleCount) * i);
        const x = width - 1;
        const idx = (y * width + x) * 4;
        bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }

      // Calculate median background color (more robust than average)
      const sortedR = bgSamples.map(c => c[0]).sort((a, b) => a - b);
      const sortedG = bgSamples.map(c => c[1]).sort((a, b) => a - b);
      const sortedB = bgSamples.map(c => c[2]).sort((a, b) => a - b);
      const mid = Math.floor(bgSamples.length / 2);

      const medianBgColor = [sortedR[mid], sortedG[mid], sortedB[mid]];

      // Calculate color variance to determine threshold dynamically
      const variance = bgSamples.reduce((sum, color) => {
        return sum + Math.sqrt(
          Math.pow(color[0] - medianBgColor[0], 2) +
          Math.pow(color[1] - medianBgColor[1], 2) +
          Math.pow(color[2] - medianBgColor[2], 2)
        );
      }, 0) / bgSamples.length;

      // Dynamic threshold based on background variance
      const baseThreshold = Math.max(25, Math.min(60, variance * 2));

      // Create alpha mask
      const alphaMask = new Uint8Array(width * height);

      // First pass: mark background pixels
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Color difference in LAB-like space (weighted RGB)
          const colorDiff = Math.sqrt(
            Math.pow((r - medianBgColor[0]) * 0.299, 2) +
            Math.pow((g - medianBgColor[1]) * 0.587, 2) +
            Math.pow((b - medianBgColor[2]) * 0.114, 2)
          ) * 2;

          // Distance from center (foreground usually in center)
          const centerX = width / 2;
          const centerY = height / 2;
          const distFromCenter = Math.sqrt(
            Math.pow((x - centerX) / centerX, 2) +
            Math.pow((y - centerY) / centerY, 2)
          );

          // Adjust threshold based on position (more lenient at center)
          const positionAdjust = distFromCenter * 15;
          const adjustedThreshold = baseThreshold + positionAdjust;

          if (colorDiff < adjustedThreshold) {
            alphaMask[y * width + x] = 0; // Background
          } else {
            // Smooth alpha transition
            const alpha = Math.min(255, Math.max(0,
              Math.floor((colorDiff - adjustedThreshold) * 4)
            ));
            alphaMask[y * width + x] = alpha;
          }
        }
      }

      // Flood fill from edges to ensure connected background
      const visited = new Set<number>();
      const queue: number[] = [];

      // Add edge pixels to queue
      for (let x = 0; x < width; x++) {
        queue.push(x); // Top edge
        queue.push((height - 1) * width + x); // Bottom edge
      }
      for (let y = 0; y < height; y++) {
        queue.push(y * width); // Left edge
        queue.push(y * width + width - 1); // Right edge
      }

      // BFS flood fill for background
      while (queue.length > 0) {
        const pos = queue.shift()!;
        if (visited.has(pos)) continue;
        visited.add(pos);

        const x = pos % width;
        const y = Math.floor(pos / width);

        if (alphaMask[pos] < 128) { // Is background-ish
          alphaMask[pos] = 0; // Mark as definite background

          // Add neighbors
          const neighbors = [
            pos - 1, pos + 1, // left, right
            pos - width, pos + width // up, down
          ];

          for (const npos of neighbors) {
            const nx = npos % width;
            const ny = Math.floor(npos / width);
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(npos)) {
              queue.push(npos);
            }
          }
        }
      }

      // Apply alpha mask with smoothing
      for (let i = 0; i < data.length; i += 4) {
        const pixelIdx = i / 4;
        data[i + 3] = alphaMask[pixelIdx];
      }

      // Edge smoothing pass
      const smoothedData = new Uint8ClampedArray(data);
      const kernelSize = 2;

      for (let y = kernelSize; y < height - kernelSize; y++) {
        for (let x = kernelSize; x < width - kernelSize; x++) {
          const idx = (y * width + x) * 4;

          // Only smooth edge pixels
          if (data[idx + 3] > 0 && data[idx + 3] < 255) {
            let sum = 0;
            let count = 0;

            for (let ky = -kernelSize; ky <= kernelSize; ky++) {
              for (let kx = -kernelSize; kx <= kernelSize; kx++) {
                const kidx = ((y + ky) * width + (x + kx)) * 4;
                sum += data[kidx + 3];
                count++;
              }
            }

            smoothedData[idx + 3] = Math.round(sum / count);
          }
        }
      }

      // Apply smoothed alpha
      for (let i = 3; i < data.length; i += 4) {
        data[i] = smoothedData[i];
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to remove background'));
        },
        'image/png'
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Apply style transfer effects
export const applyStyleTransfer = async (
  file: File,
  style: 'sketch' | 'watercolor' | 'oil-painting' | 'cartoon'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      switch (style) {
        case 'sketch':
          // Convert to grayscale and apply edge detection
          for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const inverted = 255 - gray;
            const blurred = inverted * 0.8; // Simulate blur
            const sketch = gray + (inverted - blurred) * 2;

            data[i] = data[i + 1] = data[i + 2] = Math.max(0, Math.min(255, sketch));
          }
          break;

        case 'watercolor':
          // Apply watercolor effect with color bleeding
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.2 + 20);     // Red boost
            data[i + 1] = Math.min(255, data[i + 1] * 1.1 + 15); // Green boost
            data[i + 2] = Math.min(255, data[i + 2] * 1.3 + 10); // Blue boost

            // Add some randomness for watercolor effect
            const noise = (Math.random() - 0.5) * 30;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
          }
          break;

        case 'oil-painting':
          // Apply oil painting effect with color quantization
          for (let i = 0; i < data.length; i += 4) {
            // Quantize colors to create oil painting effect
            data[i] = Math.round(data[i] / 32) * 32;
            data[i + 1] = Math.round(data[i + 1] / 32) * 32;
            data[i + 2] = Math.round(data[i + 2] / 32) * 32;

            // Increase saturation
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = Math.min(255, gray + (data[i] - gray) * 1.5);
            data[i + 1] = Math.min(255, gray + (data[i + 1] - gray) * 1.5);
            data[i + 2] = Math.min(255, gray + (data[i + 2] - gray) * 1.5);
          }
          break;

        case 'cartoon':
          // Apply cartoon effect with edge enhancement and color reduction
          for (let i = 0; i < data.length; i += 4) {
            // Reduce color palette
            data[i] = Math.round(data[i] / 64) * 64;
            data[i + 1] = Math.round(data[i + 1] / 64) * 64;
            data[i + 2] = Math.round(data[i + 2] / 64) * 64;

            // Boost contrast
            data[i] = data[i] > 128 ? Math.min(255, data[i] * 1.2) : Math.max(0, data[i] * 0.8);
            data[i + 1] = data[i + 1] > 128 ? Math.min(255, data[i + 1] * 1.2) : Math.max(0, data[i + 1] * 0.8);
            data[i + 2] = data[i + 2] > 128 ? Math.min(255, data[i + 2] * 1.2) : Math.max(0, data[i + 2] * 0.8);
          }
          break;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to apply style transfer'));
        },
        'image/png'
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Auto enhance image (brightness, contrast, color correction)
export const autoEnhanceImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate histogram for auto-adjustment
      let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
      let sumR = 0, sumG = 0, sumB = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minG = Math.min(minG, g);
        maxG = Math.max(maxG, g);
        minB = Math.min(minB, b);
        maxB = Math.max(maxB, b);

        sumR += r;
        sumG += g;
        sumB += b;
      }

      // Calculate averages
      const avgR = sumR / pixelCount;
      const avgG = sumG / pixelCount;
      const avgB = sumB / pixelCount;

      // Auto-level adjustment with contrast enhancement
      const rangeR = maxR - minR;
      const rangeG = maxG - minG;
      const rangeB = maxB - minB;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Auto-level
        if (rangeR > 0) r = ((r - minR) / rangeR) * 255;
        if (rangeG > 0) g = ((g - minG) / rangeG) * 255;
        if (rangeB > 0) b = ((b - minB) / rangeB) * 255;

        // Contrast enhancement
        r = ((r / 255 - 0.5) * 1.2 + 0.5) * 255;
        g = ((g / 255 - 0.5) * 1.2 + 0.5) * 255;
        b = ((b / 255 - 0.5) * 1.2 + 0.5) * 255;

        // Color balance adjustment
        const grayTarget = 128;
        const rAdjust = (grayTarget - avgR) * 0.1;
        const gAdjust = (grayTarget - avgG) * 0.1;
        const bAdjust = (grayTarget - avgB) * 0.1;

        r += rAdjust;
        g += gAdjust;
        b += bAdjust;

        // Clamp values
        data[i] = Math.max(0, Math.min(255, r));
        data[i + 1] = Math.max(0, Math.min(255, g));
        data[i + 2] = Math.max(0, Math.min(255, b));
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to enhance image'));
        },
        'image/png'
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Main AI processing function
export const processWithAI = async (
  file: File,
  options: AIProcessingOptions,
  onProgress?: (progress: number) => void
): Promise<AIResult> => {
  const startTime = Date.now();

  try {
    onProgress?.(10);

    let result: Blob;

    switch (options.type) {
      case 'upscale':
        onProgress?.(30);
        result = await upscaleImage(file, options.scale || 2);
        break;

      case 'background-remove':
        onProgress?.(40);
        result = await removeBackground(file);
        break;

      case 'style-transfer':
        onProgress?.(50);
        result = await applyStyleTransfer(file, options.style as any);
        break;

      case 'enhance':
        onProgress?.(60);
        result = await autoEnhanceImage(file);
        break;

      case 'ascii-art':
        onProgress?.(70);
        const ascii = await generateASCIIArt(file, { density: options.density });
        // Convert ASCII to blob
        result = new Blob([ascii], { type: 'text/plain' });
        break;

      default:
        throw new Error('Unknown AI processing type');
    }

    onProgress?.(100);

    return {
      success: true,
      result,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      processingTime: Date.now() - startTime
    };
  }
};

// Check if AI processing is supported
export const isAISupported = (): boolean => {
  return typeof HTMLCanvasElement !== 'undefined' &&
    typeof CanvasRenderingContext2D !== 'undefined';
};

// Get available AI tools
export const getAvailableAITools = () => {
  return [
    {
      id: 'upscale',
      name: 'AI Upscaler',
      description: 'Enhance image resolution up to 4x',
      supported: isAISupported()
    },
    {
      id: 'background-remove',
      name: 'Background Removal',
      description: 'Remove background automatically',
      supported: isAISupported()
    },
    {
      id: 'style-transfer',
      name: 'Style Transfer',
      description: 'Apply artistic styles',
      supported: isAISupported()
    },
    {
      id: 'enhance',
      name: 'Auto Enhancement',
      description: 'Improve image quality automatically',
      supported: isAISupported()
    },
    {
      id: 'ascii-art',
      name: 'ASCII Art',
      description: 'Convert to text art',
      supported: isAISupported()
    }
  ];
}; 