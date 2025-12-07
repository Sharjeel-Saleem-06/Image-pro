// Image processing utilities for ImagePro
import imageCompression from 'browser-image-compression';

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  format: string;
  aspectRatio: number;
}

export interface ConversionOptions {
  format: string;
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  preserveExif?: boolean;
}

export interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  quality: number;
}

// Get image information
export const getImageInfo = (file: File): Promise<ImageInfo> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const info: ImageInfo = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        format: file.type.split('/')[1] || 'unknown',
        aspectRatio: img.naturalWidth / img.naturalHeight
      };
      URL.revokeObjectURL(url);
      resolve(info);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

// Convert image format
export const convertImageFormat = async (
  file: File,
  options: ConversionOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Set canvas dimensions
      canvas.width = options.maxWidth || img.naturalWidth;
      canvas.height = options.maxHeight || img.naturalHeight;
      
      // Maintain aspect ratio if only one dimension is specified
      if (options.maxWidth && !options.maxHeight) {
        canvas.height = (canvas.width / img.naturalWidth) * img.naturalHeight;
      } else if (options.maxHeight && !options.maxWidth) {
        canvas.width = (canvas.height / img.naturalHeight) * img.naturalWidth;
      }
      
      // Draw image on canvas
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image'));
          }
        },
        `image/${options.format}`,
        options.quality / 100
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Compress image
export const compressImage = async (
  file: File,
  options: CompressionOptions
): Promise<File> => {
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight,
      useWebWorker: options.useWebWorker,
      initialQuality: options.quality / 100,
    });
    return compressedFile;
  } catch (error) {
    throw new Error(`Compression failed: ${error}`);
  }
};

// Resize image
export const resizeImage = (
  file: File,
  width: number,
  height: number,
  maintainAspectRatio = true
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      if (maintainAspectRatio) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        if (width / height > aspectRatio) {
          width = height * aspectRatio;
        } else {
          height = width / aspectRatio;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to resize image'));
        },
        'image/png'
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Apply image filters
export const applyImageFilters = (
  file: File,
  filters: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
    hue?: number;
  }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Build filter string
      const filterParts = [];
      if (filters.brightness !== undefined) filterParts.push(`brightness(${filters.brightness}%)`);
      if (filters.contrast !== undefined) filterParts.push(`contrast(${filters.contrast}%)`);
      if (filters.saturation !== undefined) filterParts.push(`saturate(${filters.saturation}%)`);
      if (filters.blur !== undefined) filterParts.push(`blur(${filters.blur}px)`);
      if (filters.hue !== undefined) filterParts.push(`hue-rotate(${filters.hue}deg)`);
      
      if (ctx) {
        ctx.filter = filterParts.join(' ');
        ctx.drawImage(img, 0, 0);
      }
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to apply filters'));
        },
        'image/png'
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Rotate image
export const rotateImage = (file: File, degrees: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const radians = (degrees * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));
      
      canvas.width = img.naturalWidth * cos + img.naturalHeight * sin;
      canvas.height = img.naturalWidth * sin + img.naturalHeight * cos;
      
      if (ctx) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      }
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to rotate image'));
        },
        'image/png'
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Flip image
export const flipImage = (file: File, horizontal: boolean, vertical: boolean): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {
        ctx.save();
        ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
        ctx.drawImage(
          img,
          horizontal ? -canvas.width : 0,
          vertical ? -canvas.height : 0
        );
        ctx.restore();
      }
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to flip image'));
        },
        'image/png'
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Crop image
export const cropImage = (
  file: File,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, x, y, width, height, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to crop image'));
        },
        'image/png'
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Generate image thumbnail
export const generateThumbnail = (file: File, size = 150): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let { width, height } = { width: size, height: size };
      
      if (aspectRatio > 1) {
        height = size / aspectRatio;
      } else {
        width = size * aspectRatio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.onerror = () => reject(new Error('Failed to generate thumbnail'));
    img.src = URL.createObjectURL(file);
  });
};

// Validate image file
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please select an image file.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 50MB.' };
  }
  
  return { valid: true };
};

// Get optimal format recommendation
export const getFormatRecommendation = async (file: File): Promise<string> => {
  const info = await getImageInfo(file);
  
  // Recommend WebP for photos with good browser support
  if (info.width * info.height > 500000) { // Large images
    return 'webp';
  }
  
  // Recommend PNG for images with transparency or small images
  if (file.type === 'image/png' || info.width * info.height < 100000) {
    return 'png';
  }
  
  // Default to JPEG for photos
  return 'jpeg';
};

// Create download link
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Convert blob to file
export const blobToFile = (blob: Blob, filename: string): File => {
  return new File([blob], filename, { type: blob.type });
}; 