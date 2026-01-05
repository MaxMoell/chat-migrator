'use client';

import { useState } from 'react';
import type { ProcessedConversation } from '@/types/chatgpt';
import { exportAndDownload, getEstimatedSize, type ExportProgress } from '@/lib/exporter';
import type { MarkdownOptions } from '@/lib/converter';

interface ExportButtonProps {
  conversations: ProcessedConversation[];
  disabled?: boolean;
}

export function ExportButton({ conversations, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setProgress({ current: 0, total: conversations.length });

    try {
      const options: MarkdownOptions = {
        includeBranches: true,
        includeMetadata: true,
        includeTimestamps: true,
        formatCodeBlocks: true,
      };

      await exportAndDownload(conversations, options, (prog) => {
        setProgress(prog);
      });

      // Success
      setProgress(null);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const { sizeFormatted } = getEstimatedSize(conversations);

  return (
    <div className="space-y-3">
      <button
        onClick={handleExport}
        disabled={disabled || isExporting || conversations.length === 0}
        className={`
          w-full px-6 py-3 rounded-lg font-medium text-white
          transition-all duration-200
          ${disabled || isExporting || conversations.length === 0
            ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
          ${isExporting ? 'cursor-wait' : ''}
        `}
      >
        {isExporting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Exporting...
          </span>
        ) : (
          `Export ${conversations.length} Conversation${conversations.length !== 1 ? 's' : ''}`
        )}
      </button>

      {isExporting && progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Processing {progress.current} of {progress.total}
            </span>
            <span>
              {Math.round((progress.current / progress.total) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          {progress.currentFile && (
            <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
              {progress.currentFile}
            </div>
          )}
        </div>
      )}

      {!isExporting && conversations.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Estimated size: {sizeFormatted}
        </div>
      )}
    </div>
  );
}
