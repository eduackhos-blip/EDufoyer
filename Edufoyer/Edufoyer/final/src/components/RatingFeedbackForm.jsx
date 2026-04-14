import React, { useState } from 'react';
import { Star, X, Send, Loader2, CheckCircle } from 'lucide-react';

const RatingFeedbackForm = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    rating: 0,
    feedback: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user_name || !formData.rating || !formData.feedback) {
      setMessage('Please fill all required fields');
      return;
    }

    if (formData.rating === 0) {
      setMessage('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      console.log('Submitting rating:', formData);
      
      const response = await fetch('/api/rating/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: formData.user_name,
          user_email: formData.user_email || undefined,
          rating: formData.rating,
          feedback: formData.feedback
        }),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to submit feedback' }));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setMessage('Thank you for your feedback!');
        setFormData({
          user_name: '',
          user_email: '',
          rating: 0,
          feedback: ''
        });
        setTimeout(() => {
          onClose();
          setMessage('');
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Submit rating error:', error);
      setMessage(error.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rate Your Experience</h2>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">Help us improve by sharing your feedback</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Your Name *
            </label>
            <input
              type="text"
              value={formData.user_name}
              onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
              className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.user_email}
              onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
              className="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 sm:w-8 sm:h-8 ${
                      star <= (hoveredRating || formData.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {formData.rating > 0 && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
                {formData.rating === 5 && 'Excellent!'}
                {formData.rating === 4 && 'Great!'}
                {formData.rating === 3 && 'Good!'}
                {formData.rating === 2 && 'Fair'}
                {formData.rating === 1 && 'Poor'}
              </p>
            )}
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
              Your Feedback *
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              className="w-full min-h-[100px] sm:min-h-[120px] bg-gray-50 border-2 border-gray-200 text-gray-900 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-vertical transition-all text-sm"
              placeholder="Tell us about your experience..."
              required
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl flex items-center gap-2 text-xs sm:text-sm ${
              message.includes('Thank you')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.includes('Thank you') ? (
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              ) : null}
              <span className="break-words">{message}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || formData.rating === 0}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-1.5 sm:gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span className="hidden sm:inline">Submitting...</span>
                  <span className="sm:hidden">Submit...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingFeedbackForm;

