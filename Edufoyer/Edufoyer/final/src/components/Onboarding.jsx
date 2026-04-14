import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import profileService from '../services/profileService';

const Onboarding = () => {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    strongSubject: '',
    universityName: '',
    course: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const strongSubjects = [
    'Operating Systems',
    'Artificial Intelligence',
    'Database Management Systems',
    'Data Structures and Algorithms',
    'Java',
    'MERN'
  ];

  const universities = ['Kalinga Institute of Industrial Technology'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      await profileService.createProfile(formData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Profile creation error:', error);
      setErrors({ form: error.message || 'Failed to create profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#171717] dark:bg-gray-900 text-gray-200 dark:text-gray-100 transition-colors duration-300">
      {/* Vertical Dotted Lines */}
      <div className="absolute top-0 bottom-0 left-[calc(50%-220px)] border-t-3 border-l-3 border-dotted border-[#2b2b2b]" />
      <div className="absolute top-0 bottom-0 right-[calc(50%-220px)] border-t-3 border-l-3 border-dotted border-[#2b2b2b]" />

      {/* Horizontal Dotted Lines */}
      <div className="absolute left-0 right-0 top-[15%] border-t-3 border-l-3 border-dotted border-[#2b2b2b]" />
      <div className="absolute left-0 right-0 bottom-[15%] border-t-3 border-l-3 border-dotted border-[#2b2b2b]" />

      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-transparent p-8 rounded-lg relative z-10">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-200">Welcome!</h1>
            <p className="mt-2 text-gray-300">We would love to know more about you</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-200">
                  What is your mobile number?
                </label>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  required
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-[#343434] rounded-md shadow-sm focus:outline-none focus:ring-gray-300 focus:border-gray-300"
                />
                {errors.mobileNumber && (
                  <p className="text-sm text-red-400">{errors.mobileNumber}</p>
                )}
              </div>

              <div>
                <label htmlFor="strongSubject" className="block text-sm font-medium text-gray-200">
                  What is your strong subject?
                </label>
                <select
                  id="strongSubject"
                  name="strongSubject"
                  required
                  value={formData.strongSubject}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border bg-[#1d1d1d] border-[#343434] text-gray-200 rounded-md shadow-sm">
                  <option value="">Select a subject</option>
                  {strongSubjects.map((subject) => (
                    <option
                      className="bg-[#1d1d1d] border-[#343434] text-gray-200"
                      key={subject}
                      value={subject.toLowerCase()}>
                      {subject}
                    </option>
                  ))}
                </select>
                {errors.strongSubject && (
                  <p className="text-sm text-red-400">{errors.strongSubject}</p>
                )}
              </div>

              <div>
                <label htmlFor="universityName" className="block text-sm font-medium text-gray-200">
                  What is your university name?
                </label>
                <select
                  id="universityName"
                  name="universityName"
                  required
                  value={formData.universityName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm bg-[#1d1d1d] border-[#343434] text-gray-200">
                  <option value="">Select a university</option>
                  {universities.map((university) => (
                    <option
                      className="bg-[#1d1d1d] border-[#343434] text-gray-200"
                      key={university}
                      value={university.toLowerCase()}>
                      {university}
                    </option>
                  ))}
                </select>
                {errors.universityName && (
                  <p className="text-sm text-red-400">{errors.universityName}</p>
                )}
              </div>

              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-200">
                  What is your course?
                </label>
                <input
                  id="course"
                  name="course"
                  type="text"
                  required
                  value={formData.course}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-[#343434] rounded-md shadow-sm focus:outline-none focus:ring-gray-300 focus:border-gray-300"
                />
                {errors.course && (
                  <p className="text-sm text-red-400">{errors.course}</p>
                )}
              </div>
            </div>

            {errors.form && (
              <div className="bg-red-50 p-4 rounded-md">
                <p className="text-sm text-red-700">{errors.form}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#2b2b2b] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:ring-2 hover:ring-gray-300 transition-all cursor-pointer disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
