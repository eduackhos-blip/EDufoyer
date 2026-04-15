import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, BookOpen, CheckCircle, X, Phone, FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

const SolverRequestForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    subjects: []
  });
  const [resume, setResume] = useState(null);
  const [marksheet, setMarksheet] = useState(null);
  const [aadhar, setAadhar] = useState(null);
  const [pancard, setPancard] = useState(null);
  const [resumePreview, setResumePreview] = useState(null);
  const [marksheetPreview, setMarksheetPreview] = useState(null);
  const [aadharPreview, setAadharPreview] = useState(null);
  const [pancardPreview, setPancardPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    if (isOpen) {
      // Auto-fill user data
      const loadUserData = async () => {
        try {
          const userData = await authService.getProfile();
          setFormData(prev => ({
            ...prev,
            name: userData?.name || '',
            email: userData?.email || ''
          }));
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };
      loadUserData();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, [type]: 'File size must be less than 5MB' }));
      e.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [type]: 'Only PDF, JPG, and PNG files are allowed' }));
      e.target.value = '';
      return;
    }

    // Clear error
    setErrors(prev => ({ ...prev, [type]: '' }));

    if (type === 'resume') {
      setResume(file);
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setResumePreview(objectUrl);
      } else {
        setResumePreview(null);
      }
    } else if (type === 'marksheet') {
      setMarksheet(file);
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setMarksheetPreview(objectUrl);
      } else {
        setMarksheetPreview(null);
      }
    } else if (type === 'aadhar') {
      setAadhar(file);
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setAadharPreview(objectUrl);
      } else {
        setAadharPreview(null);
      }
    } else if (type === 'pancard') {
      setPancard(file);
      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        setPancardPreview(objectUrl);
      } else {
        setPancardPreview(null);
      }
    }
  };

  const removeFile = (type) => {
    if (type === 'resume') {
      setResume(null);
      if (resumePreview) {
        URL.revokeObjectURL(resumePreview);
        setResumePreview(null);
      }
    } else if (type === 'marksheet') {
      setMarksheet(null);
      if (marksheetPreview) {
        URL.revokeObjectURL(marksheetPreview);
        setMarksheetPreview(null);
      }
    } else if (type === 'aadhar') {
      setAadhar(null);
      if (aadharPreview) {
        URL.revokeObjectURL(aadharPreview);
        setAadharPreview(null);
      }
    } else if (type === 'pancard') {
      setPancard(null);
      if (pancardPreview) {
        URL.revokeObjectURL(pancardPreview);
        setPancardPreview(null);
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      newErrors.phoneNumber = 'Invalid phone number (10 digits required)';
    }
    if (formData.subjects.length === 0) {
      newErrors.subjects = 'Please select at least one subject';
    }
    if (!resume) {
      newErrors.resume = 'Resume is required';
    }
    if (!marksheet) {
      newErrors.marksheet = 'Marksheet is required';
    }
    if (!aadhar) {
      newErrors.aadhar = 'Aadhar card is required';
    }
    if (!pancard) {
      newErrors.pancard = 'Pancard is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('email', formData.email.trim().toLowerCase());
      formDataToSend.append('phoneNumber', formData.phoneNumber.trim());
      formDataToSend.append('subjects', JSON.stringify(formData.subjects));
      formDataToSend.append('resume', resume);
      formDataToSend.append('marksheet', marksheet);
      formDataToSend.append('aadhar', aadhar);
      formDataToSend.append('pancard', pancard);

      const response = await fetch('/api/solver/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit solver request');
      }

      setMessage('Solver request submitted successfully! Admin will review your request and get back to you soon.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
        subjects: []
      });
      setResume(null);
      setMarksheet(null);
      setAadhar(null);
      setPancard(null);
      if (resumePreview) {
        URL.revokeObjectURL(resumePreview);
        setResumePreview(null);
      }
      if (marksheetPreview) {
        URL.revokeObjectURL(marksheetPreview);
        setMarksheetPreview(null);
      }
      if (aadharPreview) {
        URL.revokeObjectURL(aadharPreview);
        setAadharPreview(null);
      }
      if (pancardPreview) {
        URL.revokeObjectURL(pancardPreview);
        setPancardPreview(null);
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          if (onClose) onClose();
        }, 2000);
      } else if (onClose) {
        setTimeout(() => onClose(), 2000);
      }
    } catch (error) {
      console.error('Solver request error:', error);
      setMessage(error.message || 'Failed to submit solver request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-white/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-lg flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Solver Request Form
                </h2>
                <p className="text-indigo-100 mt-1 text-sm">
                  Submit your request to become a solver
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-gray-700 text-sm font-semibold">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 ${
                errors.name ? 'border-red-500' : 'border-gray-200'
              } text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all`}
              placeholder="Enter your full name"
              required
            />
            {errors.name && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              } text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all`}
              placeholder="Enter your email address"
              required
            />
            {errors.email && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Phone Number Field */}
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-semibold">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`w-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-200'
                } text-gray-900 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all`}
                placeholder="Enter your 10-digit phone number"
                maxLength={10}
                required
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.phoneNumber}
              </p>
            )}
          </div>

          {/* Subjects Selection */}
          <div className="space-y-2">
            <label className="block text-gray-700 text-sm font-semibold">
              Select Your Expertise Areas *
            </label>
            {errors.subjects && (
              <p className="text-red-600 text-xs flex items-center gap-1 mb-2">
                <AlertCircle className="w-3 h-3" />
                {errors.subjects}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {availableSubjects.map((subject) => (
                <label
                  key={subject}
                  className={`flex items-center space-x-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.subjects.includes(subject)
                      ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-500 text-indigo-700 shadow-md'
                      : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="text-indigo-600 focus:ring-indigo-500 rounded"
                  />
                  <span className="text-sm font-medium">{subject}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              You will receive notifications for doubts in these subjects.
            </p>
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <label className="block text-gray-700 text-sm font-semibold">
              Upload Resume * (PDF, JPG, or PNG - Max 5MB)
            </label>
            {errors.resume && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.resume}
              </p>
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:border-purple-400 transition-colors">
              <input
                type="file"
                id="resume-upload"
                accept="application/pdf,image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'resume')}
              />
              {resume ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resume.name}</p>
                      <p className="text-xs text-gray-500">{(resume.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('resume')}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="resume-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload resume</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                </label>
              )}
            </div>
            {resumePreview && (
              <div className="mt-2">
                <img src={resumePreview} alt="Resume preview" className="max-h-32 rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          {/* Marksheet Upload */}
          <div className="space-y-2">
            <label className="block text-gray-700 text-sm font-semibold">
              Upload Marksheet * (PDF, JPG, or PNG - Max 5MB)
            </label>
            {errors.marksheet && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.marksheet}
              </p>
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:border-purple-400 transition-colors">
              <input
                type="file"
                id="marksheet-upload"
                accept="application/pdf,image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'marksheet')}
              />
              {marksheet ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{marksheet.name}</p>
                      <p className="text-xs text-gray-500">{(marksheet.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('marksheet')}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="marksheet-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload marksheet</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                </label>
              )}
            </div>
            {marksheetPreview && (
              <div className="mt-2">
                <img src={marksheetPreview} alt="Marksheet preview" className="max-h-32 rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          {/* Aadhar Upload */}
          <div className="space-y-2">
            <label className="block text-gray-700 text-sm font-semibold">
              Upload Aadhar Card * (PDF, JPG, or PNG - Max 5MB)
            </label>
            {errors.aadhar && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.aadhar}
              </p>
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:border-purple-400 transition-colors">
              <input
                type="file"
                id="aadhar-upload"
                accept="application/pdf,image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'aadhar')}
              />
              {aadhar ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{aadhar.name}</p>
                      <p className="text-xs text-gray-500">{(aadhar.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('aadhar')}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="aadhar-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload Aadhar card</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                </label>
              )}
            </div>
            {aadharPreview && (
              <div className="mt-2">
                <img src={aadharPreview} alt="Aadhar preview" className="max-h-32 rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          {/* Pancard Upload */}
          <div className="space-y-2">
            <label className="block text-gray-700 text-sm font-semibold">
              Upload Pancard * (PDF, JPG, or PNG - Max 5MB)
            </label>
            {errors.pancard && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.pancard}
              </p>
            )}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:border-purple-400 transition-colors">
              <input
                type="file"
                id="pancard-upload"
                accept="application/pdf,image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'pancard')}
              />
              {pancard ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pancard.name}</p>
                      <p className="text-xs text-gray-500">{(pancard.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('pancard')}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="pancard-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload Pancard</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, or PNG (Max 5MB)</p>
                </label>
              )}
            </div>
            {pancardPreview && (
              <div className="mt-2">
                <img src={pancardPreview} alt="Pancard preview" className="max-h-32 rounded-lg border border-gray-200" />
              </div>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-xl flex items-center space-x-3 ${
              message.includes('successfully')
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-2 border-emerald-200'
                : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-2 border-red-200'
            }`}>
              {message.includes('successfully') ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400 bg-white rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] disabled:transform-none flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Submitting...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolverRequestForm;











