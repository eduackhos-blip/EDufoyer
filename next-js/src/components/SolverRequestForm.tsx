import React, { useState, useEffect } from 'react';
import { UserPlus, CheckCircle, X, Phone, FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

const FOREST = '#073E36';

const labelClass = 'block text-sm font-semibold text-[var(--dash-forest)]';
const inputBaseClass =
  'w-full rounded-xl border-2 bg-white px-4 py-3 text-[var(--dash-text-body)] outline-none transition-all placeholder:text-[var(--dash-text-muted)] focus:border-[var(--dash-forest)] focus:ring-2 focus:ring-[var(--dash-forest)]/20';
const inputErrorClass = 'border-red-400 focus:border-red-400 focus:ring-red-400/20';
const inputOkClass = 'border-[var(--dash-panel-border)]';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="solver-request-title"
    >
      <div className="relative flex w-full max-w-3xl max-h-[90vh] flex-col overflow-hidden rounded-[22px] border border-[var(--dash-panel-border)] bg-white shadow-[var(--dash-panel-shadow)]">
        <img
          src="/fillStarBottom.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-4 top-4 z-10 h-4 w-auto object-contain"
          decoding="async"
        />
        <img
          src="/fillStarBottom.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-4 top-4 z-10 h-4 w-auto object-contain"
          decoding="async"
        />
        {/* Header */}
        <div className="px-5 py-4 md:px-6 md:py-5" style={{ backgroundColor: FOREST }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <UserPlus className="h-5 w-5 text-white" strokeWidth={2.2} aria-hidden />
              </div>
              <div>
                <h2 id="solver-request-title" className="text-xl font-bold text-white md:text-2xl">
                  Solver Request Form
                </h2>
                <p className="mt-1 text-sm text-white/75">Submit your request to become a solver</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit}
          className="max-h-[60vh] space-y-6 overflow-y-auto bg-[var(--dash-content-canvas)] p-5 md:p-6"
        >
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className={labelClass}>
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${inputBaseClass} ${errors.name ? inputErrorClass : inputOkClass}`}
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
            <label htmlFor="email" className={labelClass}>
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`${inputBaseClass} ${errors.email ? inputErrorClass : inputOkClass}`}
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
            <label htmlFor="phoneNumber" className={labelClass}>
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--dash-text-muted)]" />
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`${inputBaseClass} pl-12 ${errors.phoneNumber ? inputErrorClass : inputOkClass}`}
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
            <label className={labelClass}>
              Select Your Expertise Areas *
            </label>
            {errors.subjects && (
              <p className="text-red-600 text-xs flex items-center gap-1 mb-2">
                <AlertCircle className="w-3 h-3" />
                {errors.subjects}
              </p>
            )}
            <div className="rounded-2xl border border-[var(--dash-panel-border)] bg-white p-3 md:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {availableSubjects.map((subject) => (
                <label
                  key={subject}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 transition-all ${
                    formData.subjects.includes(subject)
                      ? 'border-[var(--dash-forest)] bg-[var(--dash-card-mint)] shadow-[var(--dash-inner-shadow)]'
                      : 'border-[var(--dash-panel-border)] bg-[var(--dash-content-canvas)] hover:border-[var(--dash-forest)]/35'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.subjects.includes(subject)}
                    onChange={() => handleSubjectToggle(subject)}
                    className="rounded border-[var(--dash-panel-border)] text-[var(--dash-forest)] focus:ring-[var(--dash-forest)]/30"
                  />
                  <span className="text-sm font-medium text-[var(--dash-text-body)]">{subject}</span>
                </label>
              ))}
            </div>
            </div>
            <p className="text-xs text-[var(--dash-text-muted)]">
              You will receive notifications for doubts in these subjects.
            </p>
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <label className={labelClass}>
              Upload Resume * (PDF, JPG, or PNG - Max 5MB)
            </label>
            {errors.resume && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.resume}
              </p>
            )}
            <div className="rounded-xl border-2 border-dashed border-[var(--dash-panel-border)] bg-white p-4 transition-colors hover:border-[var(--dash-forest)]/40">
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
                    <FileText className="h-8 w-8 text-[var(--dash-forest)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--dash-text-body)]">{resume.name}</p>
                      <p className="text-xs text-[var(--dash-text-muted)]">{(resume.size / 1024 / 1024).toFixed(2)} MB</p>
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
                  <Upload className="mb-2 h-10 w-10 text-[var(--dash-forest)]/50" />
                  <p className="text-sm text-[var(--dash-text-body)]">Click to upload resume</p>
                  <p className="mt-1 text-xs text-[var(--dash-text-muted)]">PDF, JPG, or PNG (Max 5MB)</p>
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
            <label className={labelClass}>
              Upload Marksheet * (PDF, JPG, or PNG - Max 5MB)
            </label>
            {errors.marksheet && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.marksheet}
              </p>
            )}
            <div className="rounded-xl border-2 border-dashed border-[var(--dash-panel-border)] bg-white p-4 transition-colors hover:border-[var(--dash-forest)]/40">
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
                    <FileText className="h-8 w-8 text-[var(--dash-forest)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--dash-text-body)]">{marksheet.name}</p>
                      <p className="text-xs text-[var(--dash-text-muted)]">{(marksheet.size / 1024 / 1024).toFixed(2)} MB</p>
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
                  <Upload className="mb-2 h-10 w-10 text-[var(--dash-forest)]/50" />
                  <p className="text-sm text-[var(--dash-text-body)]">Click to upload marksheet</p>
                  <p className="mt-1 text-xs text-[var(--dash-text-muted)]">PDF, JPG, or PNG (Max 5MB)</p>
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
            <label className={labelClass}>
              Upload Aadhar Card * (PDF, JPG, or PNG - Max 5MB)
            </label>
            {errors.aadhar && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.aadhar}
              </p>
            )}
            <div className="rounded-xl border-2 border-dashed border-[var(--dash-panel-border)] bg-white p-4 transition-colors hover:border-[var(--dash-forest)]/40">
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
                    <FileText className="h-8 w-8 text-[var(--dash-forest)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--dash-text-body)]">{aadhar.name}</p>
                      <p className="text-xs text-[var(--dash-text-muted)]">{(aadhar.size / 1024 / 1024).toFixed(2)} MB</p>
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
                  <Upload className="mb-2 h-10 w-10 text-[var(--dash-forest)]/50" />
                  <p className="text-sm text-[var(--dash-text-body)]">Click to upload Aadhar card</p>
                  <p className="mt-1 text-xs text-[var(--dash-text-muted)]">PDF, JPG, or PNG (Max 5MB)</p>
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
            <label className={labelClass}>
              Upload Pancard * (PDF, JPG, or PNG - Max 5MB)
            </label>
            {errors.pancard && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.pancard}
              </p>
            )}
            <div className="rounded-xl border-2 border-dashed border-[var(--dash-panel-border)] bg-white p-4 transition-colors hover:border-[var(--dash-forest)]/40">
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
                    <FileText className="h-8 w-8 text-[var(--dash-forest)]" />
                    <div>
                      <p className="text-sm font-medium text-[var(--dash-text-body)]">{pancard.name}</p>
                      <p className="text-xs text-[var(--dash-text-muted)]">{(pancard.size / 1024 / 1024).toFixed(2)} MB</p>
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
                  <Upload className="mb-2 h-10 w-10 text-[var(--dash-forest)]/50" />
                  <p className="text-sm text-[var(--dash-text-body)]">Click to upload Pancard</p>
                  <p className="mt-1 text-xs text-[var(--dash-text-muted)]">PDF, JPG, or PNG (Max 5MB)</p>
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
            <div
              className={`flex items-center gap-3 rounded-xl border-2 p-4 ${
                message.includes('successfully')
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              }`}
            >
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
        <div className="flex justify-end gap-3 border-t border-[var(--dash-panel-border)] bg-white p-5 md:p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--dash-panel-border)] bg-white px-6 py-2.5 text-sm font-semibold text-[var(--dash-forest)] transition-colors hover:bg-[var(--dash-card-mint)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--dash-inner-shadow)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: FOREST }}
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











