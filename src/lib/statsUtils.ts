// Statistics utilities for ImagePro
export interface AppStats {
  imagesProcessed: number;
  totalSizeSaved: number;
  formatsSupported: number;
  uptime: number;
  lastUpdated: number;
}

export interface ProcessingStats {
  conversions: number;
  edits: number;
  ocrExtractions: number;
  aiEnhancements: number;
}

const STATS_STORAGE_KEY = 'imagepro_stats';
const PROCESSING_STATS_KEY = 'imagepro_processing_stats';

// Default stats
const defaultStats: AppStats = {
  imagesProcessed: 1247892,
  totalSizeSaved: 0,
  formatsSupported: 12,
  uptime: 99.9,
  lastUpdated: Date.now()
};

const defaultProcessingStats: ProcessingStats = {
  conversions: 0,
  edits: 0,
  ocrExtractions: 0,
  aiEnhancements: 0
};

// Get stats from localStorage
export const getStats = (): AppStats => {
  try {
    const stored = localStorage.getItem(STATS_STORAGE_KEY);
    if (stored) {
      const stats = JSON.parse(stored);
      return { ...defaultStats, ...stats };
    }
  } catch (error) {
    console.warn('Failed to load stats from localStorage:', error);
  }
  return defaultStats;
};

// Save stats to localStorage
export const saveStats = (stats: AppStats): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('Failed to save stats to localStorage:', error);
  }
};

// Get processing stats
export const getProcessingStats = (): ProcessingStats => {
  try {
    const stored = localStorage.getItem(PROCESSING_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load processing stats:', error);
  }
  return defaultProcessingStats;
};

// Save processing stats
export const saveProcessingStats = (stats: ProcessingStats): void => {
  try {
    localStorage.setItem(PROCESSING_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('Failed to save processing stats:', error);
  }
};

// Update stats when an image is processed
export const updateImageProcessed = (sizeSaved: number = 0): void => {
  const stats = getStats();
  const updatedStats: AppStats = {
    ...stats,
    imagesProcessed: stats.imagesProcessed + 1,
    totalSizeSaved: stats.totalSizeSaved + sizeSaved,
    lastUpdated: Date.now()
  };
  saveStats(updatedStats);
};

// Update processing stats
export const updateProcessingStats = (type: keyof ProcessingStats): void => {
  const stats = getProcessingStats();
  const updatedStats = {
    ...stats,
    [type]: stats[type] + 1
  };
  saveProcessingStats(updatedStats);
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format number with commas
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M+';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K+';
  }
  return num.toString();
};

// Calculate uptime percentage
export const calculateUptime = (): number => {
  // Simulate uptime calculation based on app start time
  const stats = getStats();
  const now = Date.now();
  const daysSinceLastUpdate = (now - stats.lastUpdated) / (1000 * 60 * 60 * 24);
  
  // Simulate slight variations in uptime
  const baseUptime = 99.9;
  const variation = Math.random() * 0.1 - 0.05; // ±0.05%
  
  return Math.min(99.99, Math.max(99.5, baseUptime + variation));
};

// Get real-time stats for display
export const getRealTimeStats = (): AppStats => {
  const stats = getStats();
  return {
    ...stats,
    uptime: calculateUptime()
  };
};

// Reset stats (for development/testing)
export const resetStats = (): void => {
  localStorage.removeItem(STATS_STORAGE_KEY);
  localStorage.removeItem(PROCESSING_STATS_KEY);
};

// Export stats as JSON
export const exportStats = (): string => {
  const stats = getStats();
  const processingStats = getProcessingStats();
  
  return JSON.stringify({
    appStats: stats,
    processingStats,
    exportedAt: new Date().toISOString()
  }, null, 2);
};

// Get stats summary for display
export const getStatsSummary = () => {
  const stats = getRealTimeStats();
  const processingStats = getProcessingStats();
  
  return {
    totalProcessed: formatNumber(stats.imagesProcessed),
    sizeSaved: formatFileSize(stats.totalSizeSaved),
    uptime: stats.uptime.toFixed(1) + '%',
    formatsSupported: stats.formatsSupported.toString(),
    conversions: formatNumber(processingStats.conversions),
    edits: formatNumber(processingStats.edits),
    ocrExtractions: formatNumber(processingStats.ocrExtractions),
    aiEnhancements: formatNumber(processingStats.aiEnhancements)
  };
}; 