import React, { useState } from 'react';
import { Clock, Eye, MessageCircle, Video } from 'lucide-react';
import { DoubtStatusBadge, ResolutionStatusBadge } from './StatusBadges';

const FALLBACK_AVATAR_URL = 'https://mui.com/static/images/avatar/2.jpg';

const getTimeStatus = (status, createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();

  if (status === 'resolved' || status === 'closed') {
    return 'Completed';
  }

  const diffTime = now.getTime() - created.getTime();
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffHours >= 1) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes >= 1) return `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const formatTimeAgo = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-IN');
};

const truncateText = (text, maxLen) => {
  if (!text) return '';
  const str = String(text);
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen).trim()}...`;
};

const DoubtCard = ({
  doubt,
  type,
  onAcceptDoubt,
  onJoinSession,
  onViewAnswer
}) => {
  if (type === 'my-doubts') {
    const [isAvatarBroken, setIsAvatarBroken] = useState(false);
    const answerText = doubt.solverDoubt?.feedback_comment;
    const solverName = doubt.solver?.name || 'Rahul';
    const solverAvatarUrl = doubt.solver?.avatarUrl || FALLBACK_AVATAR_URL;
    const shouldShowAvatarImage = Boolean(solverAvatarUrl) && !isAvatarBroken;

    console.log('[DoubtCard][my-doubts]', {
      doubtId: doubt?._id,
      status: doubt?.status,
      createdAt: doubt?.createdAt,
      hasSolverDoubt: Boolean(doubt?.solverDoubt),
      solverDoubt: doubt?.solverDoubt,
      hasAnswerText: answerText !== undefined && answerText !== null && answerText !== '',
      answerTextValue: answerText
    });

    const timeAgo = formatTimeAgo(doubt.solverDoubt?.resolved_at || doubt.createdAt);
    const question = doubt.description || '';
    const answerPreview =
      answerText === undefined || answerText === null || String(answerText).trim() === ''
        ? 'No answer preview available yet.'
        : truncateText(answerText, 110);
    const isNew = true;

    const initials = solverName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    return (
      <div className="bg-white border border-[#e8e8f0] rounded-[18px] p-[20px_22px] w-[501.5px] h-[245.5px] box-border overflow-hidden font-sans">
        <div className="flex items-start gap-3">
          <div className="w-[46px] h-[46px] rounded-full overflow-hidden shrink-0 bg-[#d0d8f0] flex items-center justify-center text-[16px] font-semibold text-[#0189FF]">
            {shouldShowAvatarImage ? (
              <img
                src={solverAvatarUrl}
                alt={solverName}
                className="w-full h-full object-cover"
                onError={() => setIsAvatarBroken(true)}
              />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              {isNew && (
                <span className="bg-[#e8eeff] text-[#0189FF] text-[11.5px] font-bold px-[11px] py-[3px] rounded-[20px]">
                  New Answer
                </span>
              )}
              <span className="text-[12.5px] text-[#aaaabc]">{timeAgo}</span>
            </div>
            <div className="text-[14.5px] text-[#1a1a2e]">
              <span className="font-bold">{solverName}</span> answered your question
            </div>

            <div className="bg-[#fafbff] border-gray-200 border rounded-[12px] px-4 py-[14px] mt-[14px] mb-[14px]">
              <div className="text-[13.5px] font-bold text-[#1a1a2e] mb-[5px] leading-[1.45] line-clamp-2">
                {question}
              </div>
              <div className="text-[13px] text-[#888899] leading-[1.5] line-clamp-2">
                &quot;{answerPreview}&quot;
              </div>
            </div>

            <button
              className="self-start mt-4 font-medium text-[#0189FF] text-[13.5px] hover:underline"
              onClick={() =>
                onViewAnswer?.({
                  doubtId: doubt._id,
                  solverName: solverName || 'Solver',
                  questionText: question,
                  answerText: answerText || 'No answer available yet.',
                  timeLabel: timeAgo
                })
              }
            >
              View Answer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSessionReady = type === 'assigned' && doubt.solverDoubt?.resolution_status === 'session_scheduled';
  const isAvailable = type === 'available';

  return (
    <div
      className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-300 overflow-hidden ${
        isAvailable
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:shadow-lg'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 break-words transition-colors duration-300">
              {doubt.subject}
            </h3>
            {isAvailable && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                Available
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 break-words break-all overflow-hidden transition-colors duration-300">
            {doubt.description}
          </p>
        </div>
        <div className="ml-4 flex flex-col items-end space-y-2">
          <DoubtStatusBadge status={doubt.status} />
          {doubt.solverDoubt && (
            <ResolutionStatusBadge status={doubt.solverDoubt.resolution_status} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4 transition-colors duration-300">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {getTimeStatus(doubt.status, doubt.createdAt)}
          </span>
          <span className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {doubt.views || 0}
          </span>
          <span className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {doubt.answers?.length || 0}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {type === 'available' && (
            <button
              onClick={() => onAcceptDoubt?.(doubt._id)}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm font-medium shadow-md hover:shadow-lg"
            >
              Accept & Solve
            </button>
          )}
          {isSessionReady && (
            <button
              onClick={() => onJoinSession?.(doubt._id)}
              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm font-medium flex items-center"
            >
              <Video className="w-4 h-4 mr-2" />
              Join Session
            </button>
          )}
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 transition-colors duration-300">
          {new Date(doubt.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default DoubtCard;

