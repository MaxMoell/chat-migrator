/**
 * ZIP Exporter
 * Creates downloadable ZIP archive with all markdown files
 */

import JSZip from 'jszip';
import type { ProcessedConversation } from '@/types/chatgpt';
import { convertToMarkdown, generateFilename, generateIndexMarkdown, type MarkdownOptions } from '@/lib/converter';

export interface ExportProgress {
  current: number;
  total: number;
  currentFile?: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

/**
 * Export conversations as a ZIP file
 */
export async function exportAsZip(
  conversations: ProcessedConversation[],
  options: MarkdownOptions = {},
  onProgress?: ProgressCallback
): Promise<Blob> {
  const zip = new JSZip();

  // Generate index file
  const indexContent = generateIndexMarkdown(conversations);
  zip.file('README.md', indexContent);

  // Add each conversation as a markdown file
  for (let i = 0; i < conversations.length; i++) {
    const conversation = conversations[i];
    const filename = generateFilename(conversation);
    const markdown = convertToMarkdown(conversation, options);

    zip.file(filename, markdown);

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: conversations.length,
        currentFile: filename,
      });
    }
  }

  // Generate the ZIP blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  });

  return blob;
}

/**
 * Trigger download of the ZIP file
 */
export function downloadZip(blob: Blob, filename: string = 'chatgpt-export.zip') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export and download in one step
 */
export async function exportAndDownload(
  conversations: ProcessedConversation[],
  options: MarkdownOptions = {},
  onProgress?: ProgressCallback
): Promise<void> {
  const blob = await exportAsZip(conversations, options, onProgress);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `chatgpt-to-claude_${timestamp}.zip`;
  downloadZip(blob, filename);
}

/**
 * Export individual conversation as downloadable markdown file
 */
export function exportSingleAsMarkdown(
  conversation: ProcessedConversation,
  options: MarkdownOptions = {}
): void {
  const markdown = convertToMarkdown(conversation, options);
  const filename = generateFilename(conversation);

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Get estimated export size
 */
export function getEstimatedSize(conversations: ProcessedConversation[]): {
  sizeBytes: number;
  sizeFormatted: string;
} {
  let totalSize = 0;

  // Estimate index file
  const indexContent = generateIndexMarkdown(conversations);
  totalSize += new Blob([indexContent]).size;

  // Estimate all conversation files
  conversations.forEach(conversation => {
    const markdown = convertToMarkdown(conversation);
    totalSize += new Blob([markdown]).size;
  });

  // Add compression estimate (roughly 60% of original)
  const compressedSize = Math.floor(totalSize * 0.6);

  return {
    sizeBytes: compressedSize,
    sizeFormatted: formatBytes(compressedSize),
  };
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
