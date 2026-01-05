'use client';

import { format } from 'date-fns';
import type { ProcessedConversation } from '@/types/chatgpt';
import { getExportStats } from '@/lib/parser';

interface StatsCardProps {
  conversations: ProcessedConversation[];
}

export function StatsCard({ conversations }: StatsCardProps) {
  const stats = getExportStats(conversations);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stats.totalConversations}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Conversations
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stats.totalMessages}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Messages
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stats.conversationsWithCode}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          With Code
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {stats.conversationsWithBranches}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          With Branches
        </div>
      </div>

      {stats.dateRange && (
        <div className="col-span-2 md:col-span-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <span className="font-medium">Date Range:</span>{' '}
            {format(stats.dateRange.earliest, 'PP')} → {format(stats.dateRange.latest, 'PP')}
          </div>
        </div>
      )}
    </div>
  );
}
