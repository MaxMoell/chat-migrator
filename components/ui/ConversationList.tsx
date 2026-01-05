'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import type { ProcessedConversation } from '@/types/chatgpt';

interface ConversationListProps {
  conversations: ProcessedConversation[];
  selectedIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

export function ConversationList({
  conversations,
  selectedIds,
  onSelectionChange,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'messages'>('date');
  const [filterCode, setFilterCode] = useState(false);
  const [filterBranches, setFilterBranches] = useState(false);

  const filteredAndSorted = useMemo(() => {
    let result = [...conversations];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(conv =>
        conv.title.toLowerCase().includes(query) ||
        conv.id.toLowerCase().includes(query)
      );
    }

    // Filter by code
    if (filterCode) {
      result = result.filter(conv => conv.metadata.hasCode);
    }

    // Filter by branches
    if (filterBranches) {
      result = result.filter(conv => conv.metadata.hasBranches);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.updated.getTime() - a.updated.getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'messages':
          return b.messageCount - a.messageCount;
        default:
          return 0;
      }
    });

    return result;
  }, [conversations, searchQuery, sortBy, filterCode, filterBranches]);

  const toggleConversation = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredAndSorted.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(filteredAndSorted.map(c => c.id)));
    }
  };

  const allSelected = filteredAndSorted.length > 0 && selectedIds.size === filteredAndSorted.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredAndSorted.length;

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap gap-2 items-center">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={filterCode}
              onChange={(e) => setFilterCode(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Has Code</span>
          </label>

          <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <input
              type="checkbox"
              checked={filterBranches}
              onChange={(e) => setFilterBranches(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Has Branches</span>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="messages">Messages</option>
            </select>
          </div>
        </div>

        {/* Select All */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someSelected;
                }
              }}
              onChange={toggleAll}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Select All
            </span>
          </label>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedIds.size} of {filteredAndSorted.length} selected
          </span>
        </div>
      </div>

      {/* Conversation List */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No conversations found
          </div>
        ) : (
          filteredAndSorted.map((conv) => (
            <label
              key={conv.id}
              className={`
                block p-4 border rounded-lg cursor-pointer transition-all
                ${selectedIds.has(conv.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(conv.id)}
                  onChange={() => toggleConversation(conv.id)}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {conv.title}
                  </h3>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>{format(conv.updated, 'PP')}</span>
                    <span>{conv.messageCount} messages</span>
                    {conv.metadata.models.length > 0 && (
                      <span className="text-gray-500 dark:text-gray-500">
                        {conv.metadata.models[0]}
                      </span>
                    )}
                  </div>

                  {(conv.metadata.hasCode || conv.metadata.hasBranches || conv.metadata.hasImages) && (
                    <div className="mt-2 flex gap-2">
                      {conv.metadata.hasCode && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          Code
                        </span>
                      )}
                      {conv.metadata.hasBranches && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                          Branches
                        </span>
                      )}
                      {conv.metadata.hasImages && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                          Images
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
