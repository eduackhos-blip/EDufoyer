import React, { useEffect, useState } from 'react';
import { HelpCircle, X, AlertCircle, Info, Calendar, Clock, CheckCircle } from 'lucide-react';
import doubtService from '../services/doubtService';
import AskDoubtModal from './AskDoubtModal';
import { 
  validateTitle, 
  validateSubject, 
  validateDescription, 
  validateCategory, 
  validateImage,
  validateDoubtForm 
} from '../utils/doubtValidation';

const AskDoubt = ({ hideTrigger = false, externalOpenSignal = 0 }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [doubtCategory, setDoubtCategory] = useState('small');
  const [doubtDescription, setDoubtDescription] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSubjectMismatchPopup, setShowSubjectMismatchPopup] = useState(false);
  const [mismatchDetails, setMismatchDetails] = useState(null);
  const [showQuotaErrorPopup, setShowQuotaErrorPopup] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState('');
  const [quotaDetails, setQuotaDetails] = useState(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showScheduledPopup, setShowScheduledPopup] = useState(false);
  const [scheduledDoubtInfo, setScheduledDoubtInfo] = useState(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState(null);
  
  // Validation errors state
  const [errors, setErrors] = useState({
    title: '',
    subject: '',
    description: '',
    category: '',
    image: ''
  });

  useEffect(() => {
    if (externalOpenSignal > 0) {
      setIsFormOpen(true);
    }
  }, [externalOpenSignal]);

  const handleImageUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    
    // Validate image
    const imageValidation = validateImage(file);
    if (!imageValidation.valid) {
      setErrors(prev => ({ ...prev, image: imageValidation.error }));
      e.target.value = ''; // Clear the input
      return;
    }
    
    // Clear image error if valid
    setErrors(prev => ({ ...prev, image: '' }));
    setUploadedImage(file);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const clearForm = () => {
    setTitle('');
    setSubject('');
    setDoubtCategory('small');
    setDoubtDescription('');
    setUploadedImage(null);
    setIsScheduled(false);
    setScheduledDate('');
    setScheduledTime('');
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  // Real-time validation handlers
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    const validation = validateTitle(value);
    setErrors(prev => ({ ...prev, title: validation.error }));
  };

  const handleSubjectChange = (e) => {
    const value = e.target.value;
    setSubject(value);
    const validation = validateSubject(value);
    setErrors(prev => ({ ...prev, subject: validation.error }));
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDoubtDescription(value);
    const validation = validateDescription(value);
    setErrors(prev => ({ ...prev, description: validation.error }));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setDoubtCategory(value);
    const validation = validateCategory(value);
    setErrors(prev => ({ ...prev, category: validation.error }));
  };

  // Category details data
  const categoryDetails = {
    small: {
      title: 'Quick 20-Minute Session',
      duration: '20 minutes',
      description: 'Perfect for quick clarifications and specific question solving.',
      features: [
        'Ideal for single concept clarification',
        'Quick problem-solving sessions',
        'Specific question answers',
        'Fast-paced learning',
        'Best for revision and quick doubts'
      ],
      bestFor: 'Students who need quick answers to specific questions or concept clarifications.',
      pricing: 'Most affordable option'
    },
    medium: {
      title: 'Medium Topic — Unpacking Concepts in 30 Minutes',
      duration: '30 minutes',
      description: 'Comprehensive coverage of medium-sized topics with detailed explanations.',
      features: [
        'In-depth concept explanation',
        'Multiple related problems solved',
        'Step-by-step breakdown',
        'Interactive learning session',
        'Better understanding of topic fundamentals'
      ],
      bestFor: 'Students who want to understand a complete topic or concept thoroughly.',
      pricing: 'Moderate pricing with great value'
    },
    large: {
      title: 'Large Topic — Understand the Entire Chapter in 60 Minutes',
      duration: '60 minutes',
      description: 'Complete chapter coverage with comprehensive learning and practice.',
      features: [
        'Full chapter coverage',
        'Comprehensive topic explanation',
        'Multiple examples and problems',
        'Complete understanding of concepts',
        'Practice questions and solutions',
        'Chapter summary and key points'
      ],
      bestFor: 'Students preparing for exams or wanting complete mastery of a chapter.',
      pricing: 'Best value for comprehensive learning'
    }
  };

  const handleShowCategoryDetails = (category) => {
    setSelectedCategoryDetails(categoryDetails[category]);
    setShowCategoryDetails(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({
      title: '',
      subject: '',
      description: '',
      category: '',
      image: ''
    });
    
    // Validate all fields
    const formData = {
      title,
      subject,
      category: doubtCategory,
      description: doubtDescription,
      image: uploadedImage
    };
    
    const validation = validateDoubtForm(formData);
    
    if (!validation.valid) {
      // Set all validation errors
      setErrors(validation.errors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors).find(key => validation.errors[key]);
      if (firstErrorField) {
        const errorElement = document.getElementById(firstErrorField === 'description' ? 'description' : firstErrorField);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }
      
      return;
    }
    
    setUploading(true);

    try {
      const doubtData = {
        title: title.trim(),
        subject: subject.trim(),
        category: doubtCategory,
        description: doubtDescription.trim(),
        imagePath: null,
        tags: [],
        isScheduled: isScheduled,
        scheduledDate: isScheduled ? scheduledDate : undefined,
        scheduledTime: isScheduled ? scheduledTime : undefined
      };
      
      const result = await doubtService.createDoubt(doubtData);
      
      console.log('📋 Doubt creation result:', result);
      console.log('📅 isScheduled:', isScheduled);
      console.log('📅 scheduledDate:', scheduledDate);
      console.log('⏰ scheduledTime:', scheduledTime);
      
      // Check if backend returned errors
      if (!result.success) {
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
        } else if (result.error === 'SUBJECT_MISMATCH' || result.message) {
          // Show subject mismatch popup
          setMismatchDetails({
            message: result.message || 'Please ask subject-related doubts. Your doubt description does not match the selected subject.',
            reason: result.validationDetails?.reason || '',
            confidence: result.validationDetails?.confidence || 0,
          });
          setShowSubjectMismatchPopup(true);
        } else if (result.error && (result.error.toLowerCase().includes('quota') || result.error.toLowerCase().includes('completed') || result.error.toLowerCase().includes('limit'))) {
          // Show quota exceeded error popup
          setQuotaErrorMessage(result.error || 'You\'ve reached your daily doubt limit. Your quota will reset after 12 AM. Please try again tomorrow!');
          setQuotaDetails(result.quotaDetails || null);
          setShowQuotaErrorPopup(true);
        } else {
          alert(result.error || 'Failed to submit doubt. Please check your input and try again.');
        }
        setUploading(false);
        return;
      }
      
      // Handle scheduled vs immediate doubts
      const doubtId = result.doubtId || result._id || result.id;
      const isScheduledDoubt = result.is_scheduled || result.isScheduled || isScheduled;
      
      console.log('🆔 doubtId:', doubtId);
      console.log('📅 isScheduledDoubt:', isScheduledDoubt);
      console.log('📅 result.is_scheduled:', result.is_scheduled);
      console.log('📅 isScheduled (state):', isScheduled);
      console.log('📅 scheduledDate:', scheduledDate);
      console.log('⏰ scheduledTime:', scheduledTime);
      
      // Check if this is a scheduled doubt
      if (isScheduled && scheduledDate && scheduledTime) {
        // Format date and time properly
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const formattedDate = scheduledDateTime.toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const formattedTime = scheduledDateTime.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        console.log('✅ Showing scheduled popup');
        console.log('📅 formattedDate:', formattedDate);
        console.log('⏰ formattedTime:', formattedTime);
        
        // Show popup for scheduled doubts instead of redirecting
        setScheduledDoubtInfo({
          doubtId,
          subject: subject.trim(),
          scheduledDate,
          scheduledTime,
          formattedDate,
          formattedTime,
          fullDateTime: `${formattedDate} at ${formattedTime}`
        });
        setShowScheduledPopup(true);
        setIsFormOpen(false);
        clearForm();
        setUploading(false);
        return;
      }
      
      // If it's scheduled but condition didn't match, still show popup
      if (isScheduled && scheduledDate && scheduledTime) {
        console.log('⚠️ Scheduled doubt but condition check failed, showing popup anyway');
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const formattedDate = scheduledDateTime.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = scheduledDateTime.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
        setScheduledDoubtInfo({
          doubtId: doubtId || 'pending',
          subject: subject.trim(),
          scheduledDate,
          scheduledTime,
          formattedDate,
          formattedTime,
          fullDateTime: `${formattedDate} at ${formattedTime}`
        });
        setShowScheduledPopup(true);
        setIsFormOpen(false);
        clearForm();
        setUploading(false);
        return;
      }
      
      // Redirect to awaiting page for immediate doubts
      if (doubtId && !isScheduled) {
        window.location.href = `/dashboard/awaiting/${doubtId}`;
        return;
      }
      
      // Fallback
      if (!isScheduled) {
      window.location.href = `/dashboard/awaiting/temp-${Date.now()}`;
      }
      
    } catch (error) {
      console.error('Error submitting doubt:', error);
      
      // Check if error message contains quota/limit keywords
      const errorMessage = error.message || error.error || 'Failed to submit doubt. Please check your input and try again.';
      
      if (errorMessage.toLowerCase().includes('quota') || 
          errorMessage.toLowerCase().includes('completed') || 
          errorMessage.toLowerCase().includes('limit')) {
        // Show quota error popup instead of alert
        setQuotaErrorMessage(errorMessage);
        setQuotaDetails(error.quotaDetails || null);
        setShowQuotaErrorPopup(true);
      } else {
        // For other errors, show a user-friendly message
        alert(`Failed to submit doubt: ${errorMessage}`);
      }
    } finally {
      setUploading(false);
    }
  };

    return (
    <>
      {/* Scheduled Doubt Success Popup - Always render when needed */}
      {showScheduledPopup && scheduledDoubtInfo && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300 transition-colors">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-t-xl p-6 text-white transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 dark:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Doubt Scheduled!</h3>
                    <p className="text-purple-100 dark:text-purple-200 text-sm">Your doubt has been scheduled successfully</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowScheduledPopup(false);
                    setScheduledDoubtInfo(null);
                  }}
                  className="text-white/80 dark:text-white/90 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                  <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors">
                  Doubt Scheduled Successfully
                </h4>
                <p className="text-gray-600 dark:text-gray-400 transition-colors">
                  "{scheduledDoubtInfo.subject}" has been scheduled
                </p>
              </div>

              {/* Scheduled Details */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6 border-2 border-purple-200 dark:border-purple-800 transition-colors">
                <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 mb-4 transition-colors">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold text-base">Scheduled Date & Time</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Date</p>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">{scheduledDoubtInfo.formattedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Time</p>
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">{scheduledDoubtInfo.formattedTime}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                  <p className="text-xs text-purple-600 dark:text-purple-400 text-center">
                    <span className="font-semibold">Full Schedule:</span> {scheduledDoubtInfo.fullDateTime}
                  </p>
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 transition-colors">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-300 transition-colors">
                    <p className="font-semibold mb-1">What happens next?</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Available solvers will be notified about your scheduled doubt</li>
                      <li>A solver will accept your doubt for the scheduled time</li>
                      <li>You'll receive an email with the meeting link at the scheduled time</li>
                      <li>The meeting link will be active at the scheduled date and time</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setShowScheduledPopup(false);
                  setScheduledDoubtInfo(null);
                }}
                className="w-full bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Got it!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Details Modal */}
      {showCategoryDetails && selectedCategoryDetails && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-300 transition-colors">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedCategoryDetails.title}</h3>
                    <p className="text-blue-100 text-sm mt-1">Duration: {selectedCategoryDetails.duration}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCategoryDetails(false);
                    setSelectedCategoryDetails(null);
                  }}
                  className="text-white/80 dark:text-white/90 hover:text-white transition-colors p-1 hover:bg-white/20 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Description */}
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedCategoryDetails.description}
                </p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  Key Features
                </h4>
                <ul className="space-y-2">
                  {selectedCategoryDetails.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-blue-500 dark:text-blue-400 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best For */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Best For
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  {selectedCategoryDetails.bestFor}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              <button
                onClick={() => {
                  setShowCategoryDetails(false);
                  setSelectedCategoryDetails(null);
                }}
                className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Got it!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {!hideTrigger && !isFormOpen ? (
      <button
        onClick={() => setIsFormOpen(true)}
        className="flex items-center border bg-blue-500 border-blue-600 hover:bg-blue-600 transition-colors text-white rounded-md h-9 px-4 py-2 cursor-pointer"
      >
        Ask a Doubt
        <HelpCircle className="ml-2 w-5 h-5" />
      </button>
      ) : isFormOpen ? (
    <>
      {/* Subject Mismatch Popup */}
      {showSubjectMismatchPopup && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 transition-colors">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center transition-colors">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                  Subject Mismatch Detected
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4 transition-colors">
                  {mismatchDetails?.message || 'Please ask subject-related doubts. Your doubt description does not match the selected subject.'}
                </p>
                {mismatchDetails?.reason && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4 transition-colors">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800 dark:text-blue-300 transition-colors">
                        <span className="font-medium">Reason:</span> {mismatchDetails.reason}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowSubjectMismatchPopup(false);
                      setMismatchDetails(null);
                    }}
                    className="flex-1 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    I Understand
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSubjectMismatchPopup(false);
                  setMismatchDetails(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quota Exceeded Popup */}
      {showQuotaErrorPopup && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 transition-colors">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center transition-colors">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                  Alert
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4 transition-colors leading-relaxed">
                  {quotaErrorMessage || 'You\'ve reached your daily doubt limit. Your quota will reset after 12 AM. Please try again tomorrow!'}
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4 transition-colors">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800 dark:text-blue-300 transition-colors">
                      <p className="font-medium mb-2">📊 Your Daily Doubt Quota:</p>
                      <ul className="space-y-1.5">
                        <li className="flex items-center justify-between">
                          <span>Small doubts:</span>
                          <span className="font-semibold ml-2">2 per day</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Medium doubts:</span>
                          <span className="font-semibold ml-2">2 per day</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Large doubts:</span>
                          <span className="font-semibold ml-2">1 per day</span>
                        </li>
                        <li className="flex items-center justify-between pt-1 border-t border-blue-200 dark:border-blue-700 mt-1">
                          <span className="font-medium">Total limit:</span>
                          <span className="font-semibold ml-2">5 doubts per day</span>
                        </li>
                      </ul>
                      <p className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-700 text-xs">
                        💡 Your quota will automatically reset after <strong>12:00 AM</strong>. You can continue asking doubts tomorrow!
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowQuotaErrorPopup(false);
                      setQuotaErrorMessage('');
                      setQuotaDetails(null);
                      setUploading(false);
                    }}
                    className="flex-1 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    I Understand
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQuotaErrorPopup(false);
                  setQuotaErrorMessage('');
                  setQuotaDetails(null);
                  setUploading(false);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <AskDoubtModal
        setIsFormOpen={setIsFormOpen}
        handleSubmit={handleSubmit}
        title={title}
        handleTitleChange={handleTitleChange}
        errors={errors}
        subject={subject}
        handleSubjectChange={handleSubjectChange}
        doubtCategory={doubtCategory}
        handleCategoryChange={handleCategoryChange}
        handleShowCategoryDetails={handleShowCategoryDetails}
        doubtDescription={doubtDescription}
        handleDescriptionChange={handleDescriptionChange}
        isScheduled={isScheduled}
        setScheduledDate={setScheduledDate}
        scheduledDate={scheduledDate}
        setScheduledTime={setScheduledTime}
        scheduledTime={scheduledTime}
        handleImageUpload={handleImageUpload}
        imagePreview={imagePreview}
        uploadedImage={uploadedImage}
        setUploadedImage={setUploadedImage}
        setImagePreview={setImagePreview}
        setIsScheduled={setIsScheduled}
        uploading={uploading}
      />
        </>
      ) : null}
    </>
  );
};

export default AskDoubt;