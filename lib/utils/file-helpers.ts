/**
 * File Helper Utilities
 */

/**
 * Read a file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate file is JSON
 */
export function isValidJsonFile(file: File): boolean {
  const validExtensions = ['.json'];
  const fileName = file.name.toLowerCase();
  return validExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate ChatGPT export structure
 */
export function validateChatGPTExport(data: any): {
  valid: boolean;
  error?: string;
} {
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      error: 'Invalid JSON structure',
    };
  }

  // Check if it's an array or has conversations property
  const conversations = Array.isArray(data) ? data : data.conversations;

  if (!conversations || !Array.isArray(conversations)) {
    return {
      valid: false,
      error: 'No conversations array found in export',
    };
  }

  if (conversations.length === 0) {
    return {
      valid: false,
      error: 'Export contains no conversations',
    };
  }

  // Validate at least one conversation has the expected structure
  const firstConv = conversations[0];
  if (!firstConv.id || !firstConv.mapping || typeof firstConv.mapping !== 'object') {
    return {
      valid: false,
      error: 'Invalid conversation structure',
    };
  }

  return {
    valid: true,
  };
}
