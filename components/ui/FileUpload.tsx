'use client';

import { useCallback, useState } from 'react';
import { readFileAsText, isValidJsonFile, formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  onFileLoaded: (content: string, filename: string) => void;
  onError: (error: string) => void;
}

export function FileUpload({ onFileLoaded, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!isValidJsonFile(file)) {
      onError('Please upload a valid JSON file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      onError('File is too large. Maximum size is 100MB');
      return;
    }

    setIsLoading(true);

    try {
      const content = await readFileAsText(file);
      onFileLoaded(content, file.name);
    } catch (error) {
      onError('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [onFileLoaded, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleFileInput}
          disabled={isLoading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            {isLoading ? (
              <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isLoading ? 'Loading...' : 'Drop your ChatGPT export here'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              or click to browse
            </p>
          </div>

          <div className="text-xs text-gray-400 dark:text-gray-500">
            Accepts JSON files up to 100MB
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium mb-2">How to get your ChatGPT export:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Go to ChatGPT Settings → Data controls → Export data</li>
          <li>Click "Export" and confirm</li>
          <li>Wait for the email with your download link</li>
          <li>Download and extract the ZIP file</li>
          <li>Upload the <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">conversations.json</code> file here</li>
        </ol>
      </div>
    </div>
  );
}
