import React, { useState } from 'react';
import { UserPlus, Mail, BookOpen, CheckCircle, X, Shield, Loader2 } from 'lucide-react';
import adminService from '../services/adminService';

const AdminSolverRegistration = ({ defaultOpen = false, inline = false, onSolverRegistered }) => {
  const [isFormOpen, setIsFormOpen] = useState(defaultOpen);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subjects: [],
    experience: '',
    bio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const availableSubjects = [
    'Operating Systems',
    'Artificial Intelligence', 
    'Database Management Systems',
    'Data Structures and Algorithms',
    'Java',
    'MERN',
    'Python',
    'Machine Learning',
    'Web Development',
    'Mobile Development'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || formData.subjects.length === 0) {
      setMessage('Please fill all required fields and select at least one subject.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await adminService.registerUserAsSolver(formData);
      
      if (result.success) {
        setMessage(`Successfully registered ${formData.email} as a solver! They will now receive notifications for doubts in their subjects.`);
        setFormData({
          name: '',
          email: '',
          subjects: [],
          experience: '',
          bio: ''
        });
        setTimeout(() => {
          setMessage('');
        }, 5000);
        // Call callback if provided
        if (onSolverRegistered) {
          onSolverRegistered();
        }
      } else {
        setMessage(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: '',
      email: '',
      subjects: [],
      experience: '',
      bio: ''
    });
    setMessage('');
  };

  if (!isFormOpen && !inline) {
    return (
      <button
        onClick={() => setIsFormOpen(true)}
        className="px-4 py-2 bg-purple-500 border border-purple-600 text-white rounded-md font-medium hover:bg-purple-600 flex items-center gap-2 transition-colors text-sm"
      >
        <Shield className="w-4 h-4" />
        Register User as Solver
      </button>
    );
  }

  // Inline mode - render without modal overlay
  if (inline) {
    return (
      <div className="w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Enter the user's full name"
              required
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              placeholder="Enter the user's email address"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The user will receive notifications at this email address.
            </p>
          </div>

          {/* Subjects Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Select Expertise Areas * <span className="text-xs font-normal text-gray-500">({formData.subjects.length} selected)</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSubjects.map((subject) => (
                <label
                  key={subject}
                  className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.subjects.includes(subject)
                      ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-500 text-purple-700 shadow-md'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <span className="text-sm font-medium flex-1">{subject}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              The user will receive notifications for doubts in these subjects.
            </p>
          </div>

          {/* Experience Field */}
          <div className="space-y-2">
            <label htmlFor="experience" className="block text-sm font-semibold text-gray-700">
              Experience Level
            </label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
            >
              <option value="">Select experience level</option>
              <option value="beginner">Beginner (0-1 years)</option>
              <option value="intermediate">Intermediate (1-3 years)</option>
              <option value="advanced">Advanced (3-5 years)</option>
              <option value="expert">Expert (5+ years)</option>
            </select>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-sm font-semibold text-gray-700">
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about the user's background and expertise..."
              className="w-full min-h-[100px] bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 text-gray-900 rounded-xl px-4 py-3 placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-vertical transition-all"
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              message.includes('Successfully') 
                ? 'bg-green-50 text-green-700 border-2 border-green-200'
                : 'bg-red-50 text-red-700 border-2 border-red-200'
            }`}>
              {message.includes('Successfully') ? (
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-sm flex-1">{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={clearForm}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register as Solver
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Modal mode - original implementation
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-gray-800 border border-gray-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Admin: Register User as Solver
              </h2>
              <p className="text-gray-600 mt-1">
                Register any user as a solver by entering their email address and expertise areas.
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-gray-700 text-sm font-medium">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              placeholder="Enter the user's full name"
              required
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              placeholder="Enter the user's email address"
              required
            />
            <p className="text-xs text-gray-500">
              The user will receive notifications at this email address.
            </p>
          </div>

          {/* Subjects Selection */}
          <div className="space-y-2">
            <label className="block text-gray-700 text-sm font-medium">
              Select Expertise Areas *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableSubjects.map((subject) => (
                <label
                  key={subject}
                  className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-colors ${
                    formData.subjects.includes(subject)
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium">{subject}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              The user will receive notifications for doubts in these subjects.
            </p>
          </div>

          {/* Experience Field */}
          <div className="space-y-2">
            <label htmlFor="experience" className="block text-gray-700 text-sm font-medium">
              Experience Level
            </label>
            <select
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="">Select experience level</option>
              <option value="beginner">Beginner (0-1 years)</option>
              <option value="intermediate">Intermediate (1-3 years)</option>
              <option value="advanced">Advanced (3-5 years)</option>
              <option value="expert">Expert (5+ years)</option>
            </select>
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-gray-700 text-sm font-medium">
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about the user's background and expertise..."
              className="w-full min-h-[80px] bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-vertical"
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-md flex items-center space-x-2 ${
              message.includes('Successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.includes('Successfully') ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => {
              setIsFormOpen(false);
              clearForm();
            }}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 bg-white rounded-md px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-purple-500 border border-purple-600 hover:bg-purple-600 hover:border-purple-700 text-white rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Registering..." : "Register as Solver"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSolverRegistration;
