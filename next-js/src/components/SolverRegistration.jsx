import React, { useState } from 'react';
import { UserPlus, Mail, BookOpen, CheckCircle, X } from 'lucide-react';
import solverService from '../services/solverService';

const SolverRegistration = ({ defaultOpen = false }) => {
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
      const result = await solverService.registerSolver(formData);
      
      if (result.success) {
        setMessage('Solver registration successful! You will now receive notifications for doubts in your subjects.');
        setFormData({
          name: '',
          email: '',
          subjects: [],
          experience: '',
          bio: ''
        });
        setTimeout(() => {
          setIsFormOpen(false);
          setMessage('');
        }, 3000);
      } else {
        setMessage(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Registration failed. Please try again.');
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

  if (!isFormOpen) {
    return (
      <button
        onClick={() => setIsFormOpen(true)}
        className="px-2 py-1.5 border border-green-500 text-green-500 rounded-md font-medium hover:bg-green-50 flex items-center gap-1 transition-colors whitespace-nowrap text-xs"
      >
        <UserPlus className="w-3 h-3" />
        Register as Solver
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white text-gray-800 border border-gray-200 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Register as Solver
              </h2>
              <p className="text-gray-600 mt-1">
                Help students by solving their doubts in your expertise areas.
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
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Enter your full name"
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
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Enter your email address"
              required
            />
          </div>

          {/* Subjects Selection */}
          <div className="space-y-2">
            <label className="block text-gray-700 text-sm font-medium">
              Select Your Expertise Areas *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableSubjects.map((subject) => (
                <label
                  key={subject}
                  className={`flex items-center space-x-2 p-3 border rounded-md cursor-pointer transition-colors ${
                    formData.subjects.includes(subject)
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="text-green-500 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium">{subject}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              You will receive notifications for doubts in these subjects.
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
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
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
              placeholder="Tell us about your background and expertise..."
              className="w-full min-h-[80px] bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-2 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-vertical"
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-md flex items-center space-x-2 ${
              message.includes('successful') 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.includes('successful') ? (
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
            className="bg-green-500 border border-green-600 hover:bg-green-600 hover:border-green-700 text-white rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Registering..." : "Register as Solver"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolverRegistration;

