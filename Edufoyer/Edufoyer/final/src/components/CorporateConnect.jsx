import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Users, Briefcase, TrendingUp, Clock, Star, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CorporateConnect = () => {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Company Partnerships",
      description: "Connect with top companies for internships and job opportunities"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Professional Networking",
      description: "Build meaningful connections with industry professionals"
    },
    {
      icon: <Briefcase className="w-8 h-8" />,
      title: "Career Guidance",
      description: "Get mentorship from experienced professionals in your field"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Industry Insights",
      description: "Stay updated with latest trends and opportunities"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Online Live Referral System",
      description: "Get real-time referrals from professionals and alumni network"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Corporate Connect</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Coming Soon Badge */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 to-indigo-100 border-4 border-blue-500 px-8 py-4 rounded-2xl shadow-2xl">
            <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
            <span className="text-3xl font-bold text-blue-800">Coming Soon</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Bridge the Gap Between
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Students & Industry
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with top companies, build professional networks, and unlock career opportunities 
            through our comprehensive corporate partnership platform.
          </p>

          {/* Animated Feature Showcase */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white">
                {features[currentFeature].icon}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {features[currentFeature].title}
            </h3>
            <p className="text-gray-600 text-lg">
              {features[currentFeature].description}
            </p>
            
            {/* Feature Indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentFeature 
                      ? 'bg-blue-500 scale-125' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                index === currentFeature ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="text-blue-500 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What You'll Get
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Direct Company Access
              </h3>
              <p className="text-gray-600">
                Connect directly with HR teams and hiring managers from top companies
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Mentorship Programs
              </h3>
              <p className="text-gray-600">
                Get guidance from industry experts and successful professionals
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Career Growth
              </h3>
              <p className="text-gray-600">
                Access exclusive opportunities and accelerate your career path
              </p>
            </div>
          </div>
        </div>


        {/* Development Progress Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Development Progress
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Platform Architecture</h3>
                  <p className="text-sm text-gray-600">Core infrastructure and user management</p>
                </div>
              </div>
              <span className="text-green-600 font-semibold">100%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Company Partnerships</h3>
                  <p className="text-sm text-gray-600">Initial partnerships with top companies</p>
                </div>
              </div>
              <span className="text-green-600 font-semibold">85%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Live Referral System</h3>
                  <p className="text-sm text-gray-600">Real-time referral matching and notifications</p>
                </div>
              </div>
              <span className="text-orange-600 font-semibold">65%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI-Powered Matching</h3>
                  <p className="text-sm text-gray-600">Advanced algorithms for opportunity matching</p>
                </div>
              </div>
              <span className="text-blue-600 font-semibold">30%</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Be the first to know when Corporate Connect launches
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
                Notify Me
              </button>
            </div>
            
            <p className="text-sm mt-4 opacity-75">
              We'll notify you as soon as Corporate Connect is available
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p>© 2024 Educational Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default CorporateConnect;
