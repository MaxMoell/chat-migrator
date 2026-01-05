'use client';

import { useState, useEffect } from 'react';
import type { ScraperProgress } from '@/types/scraper';
import { scrapeWithAPI } from '@/lib/scraper/browser-scraper';
import { loadProgress, clearProgress } from '@/lib/scraper/enhanced-scraper';

interface AutoScrapeButtonProps {
  onComplete: (conversations: any[]) => void;
  onError: (error: string) => void;
}

interface FailedConversation {
  id: string;
  title: string;
  url: string;
  error: string;
  retryCount: number;
}

export function AutoScrapeButton({ onComplete, onError }: AutoScrapeButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<ScraperProgress | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasExistingProgress, setHasExistingProgress] = useState(false);
  const [failedConversations, setFailedConversations] = useState<FailedConversation[]>([]);

  // Check for existing progress on mount
  useEffect(() => {
    const existingProgress = loadProgress();
    if (existingProgress && !existingProgress.isComplete) {
      setHasExistingProgress(true);
    }
  }, []);

  const handleStart = async () => {
    setShowInstructions(true);
  };

  const handleConfirm = async (resume: boolean = false) => {
    setShowInstructions(false);
    setIsRunning(true);

    if (!resume) {
      // Clear old progress if starting fresh
      clearProgress();
    }

    try {
      // Start the scraping process with enhanced scraper
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxConversations: 0, // 0 = unlimited
          config: {}, // Use default config
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Scraping failed');
      }

      // Success!
      setProgress({
        phase: 'completed',
        conversationsFound: data.statistics.totalConversations,
        conversationsScraped: data.statistics.successfulConversations,
      });

      // Store failed conversations
      if (data.failed && data.failed.length > 0) {
        setFailedConversations(data.failed);
      }

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Pass results to parent
      onComplete(data.conversations);

      // Clear progress after successful completion
      clearProgress();

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
      setHasExistingProgress(false);
      setTimeout(() => setProgress(null), 3000);
    }
  };

  const handleClearProgress = () => {
    clearProgress();
    setHasExistingProgress(false);
    setFailedConversations([]);
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
      {/* Resume Notice */}
      {hasExistingProgress && !isRunning && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Unfinished Scrape Detected
              </h3>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                You have an incomplete scrape session. You can resume where you left off or start fresh.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleConfirm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Resume Scraping
                </button>
                <button
                  onClick={handleClearProgress}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failed Conversations */}
      {failedConversations.length > 0 && !isRunning && (
        <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                {failedConversations.length} Conversation{failedConversations.length !== 1 ? 's' : ''} Failed
              </h3>
              <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                Some conversations could not be scraped. You can retry them later.
              </p>
              <details className="mt-2">
                <summary className="text-sm text-yellow-900 dark:text-yellow-100 cursor-pointer hover:underline">
                  View failed conversations
                </summary>
                <ul className="mt-2 text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  {failedConversations.map((conv, idx) => (
                    <li key={idx} className="truncate">
                      • {conv.title}: {conv.error}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Main Button */}
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
            <span className="font-medium">{getPhaseMessage()}</span>
            {progress.conversationsFound > 0 && (
              <span className="font-mono">
                {progress.conversationsScraped}/{progress.conversationsFound} ({Math.round((progress.conversationsScraped / progress.conversationsFound) * 100)}%)
              </span>
            )}
          </div>

          {progress.conversationsFound > 0 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-600 to-blue-600 h-full transition-all duration-300 ease-out"
                style={{
                  width: `${(progress.conversationsScraped / progress.conversationsFound) * 100}%`,
                }}
              />
            </div>
          )}

          {progress.currentConversation && (
            <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
              <span className="font-medium">Current:</span> {progress.currentConversation}
            </div>
          )}

          {/* Enhanced stats during scrape */}
          {progress.conversationsFound > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                <span className="font-medium">Found:</span> {progress.conversationsFound}
              </div>
              <div className="bg-green-100 dark:bg-green-950/30 rounded px-2 py-1 text-green-800 dark:text-green-300">
                <span className="font-medium">Scraped:</span> {progress.conversationsScraped}
              </div>
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
                onClick={() => handleConfirm(false)}
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
