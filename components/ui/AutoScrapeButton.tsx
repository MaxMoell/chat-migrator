'use client';

import { useState } from 'react';
import type { ScraperProgress } from '@/types/scraper';
import { scrapeWithAPI } from '@/lib/scraper/browser-scraper';

interface AutoScrapeButtonProps {
  onComplete: (conversations: any[]) => void;
  onError: (error: string) => void;
}

export function AutoScrapeButton({ onComplete, onError }: AutoScrapeButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ScraperProgress | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleStart = async () => {
    setShowInstructions(true);
  };

  const handleConfirm = async () => {
    setShowInstructions(false);
    setIsRunning(true);

    try {
      // Start the scraping process
      const conversations = await scrapeWithAPI((prog) => {
        setProgress(prog);
      });

      // Success!
      setProgress({
        phase: 'completed',
        conversationsFound: conversations.length,
        conversationsScraped: conversations.length,
      });

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Pass results to parent
      onComplete(conversations);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setProgress({
        phase: 'error',
        conversationsFound: 0,
        conversationsScraped: 0,
        error: errorMessage,
      });

      onError(errorMessage);
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(null), 3000);
    }
  };

  const getPhaseMessage = () => {
    if (!progress) return '';

    switch (progress.phase) {
      case 'initializing':
        return 'Initializing browser...';
      case 'logging-in':
        return 'Waiting for login...';
      case 'loading-chats':
        return 'Loading conversation list...';
      case 'scraping':
        return `Scraping conversations... (${progress.conversationsScraped}/${progress.conversationsFound})`;
      case 'processing':
        return 'Processing conversations...';
      case 'completed':
        return 'Complete!';
      case 'error':
        return 'Error occurred';
      default:
        return '';
    }
  };

  return (
    <>
      <button
        onClick={handleStart}
        disabled={isRunning}
        className={`
          w-full px-6 py-3 rounded-lg font-medium text-white
          transition-all duration-200 flex items-center justify-center gap-3
          ${isRunning
            ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
          }
        `}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {isRunning ? 'Scraping in Progress...' : 'Auto-Scrape from ChatGPT'}
      </button>

      {/* Progress Display */}
      {isRunning && progress && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{getPhaseMessage()}</span>
            {progress.conversationsFound > 0 && (
              <span>
                {Math.round((progress.conversationsScraped / progress.conversationsFound) * 100)}%
              </span>
            )}
          </div>

          {progress.conversationsFound > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-600 to-blue-600 h-full transition-all duration-300"
                style={{
                  width: `${(progress.conversationsScraped / progress.conversationsFound) * 100}%`,
                }}
              />
            </div>
          )}

          {progress.currentConversation && (
            <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
              Current: {progress.currentConversation}
            </div>
          )}
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Auto-Scrape from ChatGPT
            </h2>

            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="text-lg">
                This feature will automatically extract all your ChatGPT conversations.
              </p>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  How it works:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>A browser window will open and navigate to ChatGPT</li>
                  <li>You'll need to log in (if not already logged in)</li>
                  <li>The tool will automatically scroll through your conversations</li>
                  <li>Each conversation will be opened and the messages extracted</li>
                  <li>All data is processed locally - nothing is sent to any server</li>
                  <li>When complete, you can select and export the conversations</li>
                </ol>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Important notes:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Keep the browser window open during the process</li>
                  <li>This may take several minutes for many conversations</li>
                  <li>Don't interact with the browser while scraping</li>
                  <li>Your ChatGPT session will be used (you must be logged in)</li>
                </ul>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Privacy & Security:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Everything runs locally on your computer</li>
                  <li>No data is sent to any external server</li>
                  <li>Your ChatGPT credentials stay with you</li>
                  <li>The extracted data is only stored in your browser</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleConfirm}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Start Auto-Scraping
              </button>
              <button
                onClick={() => setShowInstructions(false)}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
