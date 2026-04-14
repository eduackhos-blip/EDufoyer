import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
// import DoubtsPackBuilder from './DoubtsPackBuilder'; // Commented out - component not available

const AdminPanel = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    specialities: [''],
    experience: 'beginner',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/auth');
          return;
        }

        const userProfile = await authService.getProfile();
        setUser(userProfile);

        if (userProfile.role !== 'admin') {
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Admin access check failed:', error);
        navigate('/auth');
      } finally {
        setAccessLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges to access this page.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecialityChange = (index, value) => {
    const newSpecialities = [...formData.specialities];
    newSpecialities[index] = value;
    setFormData(prev => ({
      ...prev,
      specialities: newSpecialities
    }));
  };

  const addSpeciality = () => {
    setFormData(prev => ({
      ...prev,
      specialities: [...prev.specialities, '']
    }));
  };

  const removeSpeciality = (index) => {
    if (formData.specialities.length > 1) {
      const newSpecialities = formData.specialities.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        specialities: newSpecialities
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Filter out empty specialities
      const validSpecialities = formData.specialities.filter(s => s.trim() !== '');
      
      if (validSpecialities.length === 0) {
        setError('At least one speciality is required');
        setLoading(false);
        return;
      }

      const data = await authService.onboardSolver({
        ...formData,
        specialities: validSpecialities
      });

      if (data.success) {
        setMessage(`Solver onboarded successfully! ${data.data.emailSent ? 'Onboarding email sent.' : 'Email sending failed.'}`);
        setFormData({
          email: '',
          name: '',
          specialities: [''],
          experience: 'beginner',
          bio: ''
        });
      } else {
        setError(data.message || 'Failed to onboard solver');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel - Solver Onboarding</h1>
            <p className="text-gray-600 mt-1">Onboard new solvers by email with their subject specialities</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="solver@example.com"
              />
            </div>

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>

            {/* Specialities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Specialities *
              </label>
              {formData.specialities.map((speciality, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={speciality}
                    onChange={(e) => handleSpecialityChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                    required
                  />
                  {formData.specialities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpeciality(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSpeciality}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Speciality
              </button>
            </div>

            {/* Experience Level */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <select
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of expertise and background..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Onboarding...' : 'Onboard Solver'}
              </button>
            </div>

            {/* Messages */}
            {message && (
              <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {message}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </form>

          {/* DoubtsPackBuilder component commented out - not available */}
          {/* <DoubtsPackBuilder className="border-t border-gray-200" /> */}

          {/* Information Section */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">How it works:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• The solver will receive an onboarding email with temporary login credentials</li>
              <li>• They can immediately start helping students with doubts in their speciality subjects</li>
              <li>• The solver should change their password after first login for security</li>
              <li>• Admin can manage solver access and specialities from this panel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
