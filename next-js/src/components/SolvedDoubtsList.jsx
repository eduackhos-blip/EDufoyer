import React, { useEffect, useState } from 'react';
import { CheckCircle, Star, Calendar, User, MessageSquare } from 'lucide-react';
import solverService from '../services/solverService';

const SolvedDoubtsList = () => {
  const [solvedDoubts, setSolvedDoubts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchSolvedDoubts();
  }, [currentPage]);

  const fetchSolvedDoubts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await solverService.getSolvedDoubts(currentPage, 10);
      setSolvedDoubts(data.solvedDoubts);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 transition-colors duration-300 ${
          i < rating ? 'text-yellow-400 dark:text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 transition-colors duration-300">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button
          onClick={fetchSolvedDoubts}
          className="mt-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (solvedDoubts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No Solved Doubts Yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Start solving doubts to see them here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">Solved Doubts</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
          <CheckCircle className="w-4 h-4" />
          <span>{pagination?.totalCount || 0} doubts solved</span>
        </div>
      </div>

      <div className="space-y-4">
        {solvedDoubts.map((solverDoubt) => {
          const doubt = solverDoubt.doubt_id;
          const doubter = doubt?.doubter_id;
          
          return (
            <div
              key={solverDoubt._id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">
                    {doubt?.subject}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2 transition-colors duration-300">
                    {doubt?.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{doubter?.name || 'Unknown Student'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Solved on {formatDate(solverDoubt.resolved_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <div className="flex items-center gap-1">
                    {renderStars(solverDoubt.feedback_rating || 0)}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    {solverDoubt.feedback_rating || 0}/5
                  </span>
                </div>
              </div>

              {solverDoubt.feedback_comment && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 transition-colors duration-300">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">Feedback:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">{solverDoubt.feedback_comment}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 transition-colors duration-300">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
                    Session completed on {formatDate(solverDoubt.resolved_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SolvedDoubtsList;




