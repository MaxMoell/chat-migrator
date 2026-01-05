'use client';

import { useState, useMemo } from 'react';
import type { ProcessedConversation } from '@/types/chatgpt';
import { parseExport, processConversations } from '@/lib/parser';
import { validateChatGPTExport } from '@/lib/utils';
import { FileUpload } from '@/components/ui/FileUpload';
import { ConversationList } from '@/components/ui/ConversationList';
import { ExportButton } from '@/components/ui/ExportButton';
import { StatsCard } from '@/components/ui/StatsCard';
import { AutoScrapeButton } from '@/components/ui/AutoScrapeButton';

export default function Home() {
  const [conversations, setConversations] = useState<ProcessedConversation[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileLoaded = (content: string, filename: string) => {
    setError(null);
    setFileName(filename);

    try {
      // Parse JSON
      const data = JSON.parse(content);

      // Validate structure
      const validation = validateChatGPTExport(data);
      if (!validation.valid) {
        setError(validation.error || 'Invalid export format');
        return;
      }

      // Parse and process
      const chatGPTExport = parseExport(content);
      const processed = processConversations(chatGPTExport);

      if (processed.length === 0) {
        setError('No valid conversations found in export');
        return;
      }

      setConversations(processed);
      // Auto-select all conversations
      setSelectedIds(new Set(processed.map(c => c.id)));

    } catch (err) {
      setError('Failed to parse file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const selectedConversations = useMemo(() => {
    return conversations.filter(c => selectedIds.has(c.id));
  }, [conversations, selectedIds]);

  const resetApp = () => {
    setConversations([]);
    setSelectedIds(new Set());
    setError(null);
    setFileName(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                ChatGPT to Claude Migration Tool
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Convert your ChatGPT conversations to Claude-compatible Markdown format
              </p>
            </div>
            <a
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="font-medium text-red-900 dark:text-red-100">Error</h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* File Upload or Conversation Management */}
          {conversations.length === 0 ? (
            <>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <FileUpload onFileLoaded={handleFileLoaded} onError={handleError} />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-50 dark:bg-black text-gray-500 dark:text-gray-500">
                    or
                  </span>
                </div>
              </div>

              {/* Auto-Scrape Option */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Automatic Extraction
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Let the tool automatically extract your conversations from ChatGPT
                  </p>
                </div>

                <AutoScrapeButton
                  onComplete={(convs) => {
                    setConversations(convs);
                    setSelectedIds(new Set(convs.map(c => c.id)));
                  }}
                  onError={handleError}
                />

                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-2">Why use Auto-Scrape?</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>No need to wait for ChatGPT's export email</li>
                    <li>Get your conversations instantly</li>
                    <li>Select specific conversations to export</li>
                    <li>All processing happens locally in your browser</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900 dark:text-green-100">
                      Successfully loaded {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </h3>
                    <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
                      From: {fileName}
                    </p>
                  </div>
                  <button
                    onClick={resetApp}
                    className="px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-green-200 dark:border-green-900 rounded-lg text-green-900 dark:text-green-100 hover:bg-green-50 dark:hover:bg-green-950/40 transition-colors"
                  >
                    Upload New File
                  </button>
                </div>
              </div>

              {/* Stats */}
              <StatsCard conversations={conversations} />

              {/* Conversation Selection */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Select Conversations to Export
                </h2>
                <ConversationList
                  conversations={conversations}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                />
              </div>

              {/* Export Section */}
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Export
                </h2>
                <ExportButton
                  conversations={selectedConversations}
                  disabled={selectedConversations.length === 0}
                />

                {selectedConversations.length === 0 && (
                  <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-500">
                    Select at least one conversation to export
                  </p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  What happens next?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Your conversations will be converted to Claude-compatible Markdown format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>All processing happens in your browser - your data never leaves your device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>A ZIP file will be downloaded containing all your conversations as .md files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Upload these files to Claude or a Claude Project to access your conversation history</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-500">
          <p>
            Open source tool for migrating ChatGPT conversations to Claude
          </p>
          <p className="mt-1">
            All processing happens locally in your browser - your data is never uploaded to any server
          </p>
        </div>
      </div>
    </div>
  );
}
