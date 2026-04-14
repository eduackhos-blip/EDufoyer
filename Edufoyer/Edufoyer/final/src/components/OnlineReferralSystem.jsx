import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, UserCheck, Network, Clock, Star, CheckCircle, TrendingUp, MessageCircle, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OnlineReferralSystem = () => {
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);
  
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Real-time Referrals",
      description: "Get instant referrals from professionals in your network"
    },
    {
      icon: <UserCheck className="w-8 h-8" />,
      title: "Verified Professionals",
      description: "Connect with verified industry experts and alumni"
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Smart Matching",
      description: "AI-powered matching with relevant professionals"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Direct Communication",
      description: "Chat directly with referrers and get personalized guidance"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
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
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">Online Referral System</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Coming Soon Badge */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-pink-100 border-4 border-purple-500 px-8 py-4 rounded-2xl shadow-2xl">
            <Clock className="w-8 h-8 text-purple-600 animate-pulse" />
            <span className="text-3xl font-bold text-purple-800">Coming Soon</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Revolutionize Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {" "}Career with Referrals
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connect with professionals, get real-time referrals, and unlock exclusive career opportunities 
            through our advanced referral matching system.
          </p>

          {/* Animated Feature Showcase */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white">
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
                      ? 'bg-purple-500 scale-125' 
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
                index === currentFeature ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              <div className="text-purple-500 mb-4">
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
            Why Our Referral System?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Instant Connections
              </h3>
              <p className="text-gray-600">
                Get connected with professionals who can refer you to opportunities instantly
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verified Network
              </h3>
              <p className="text-gray-600">
                All referrers are verified professionals with proven track records
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Higher Success Rate
              </h3>
              <p className="text-gray-600">
                Referrals have 5x higher success rate than traditional applications
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
                  <h3 className="font-semibold text-gray-900">User Authentication</h3>
                  <p className="text-sm text-gray-600">Secure login and profile management</p>
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
                  <h3 className="font-semibold text-gray-900">Professional Verification</h3>
                  <p className="text-sm text-gray-600">Background verification system</p>
                </div>
              </div>
              <span className="text-green-600 font-semibold">90%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Real-time Matching</h3>
                  <p className="text-sm text-gray-600">AI-powered referral matching algorithm</p>
                </div>
              </div>
              <span className="text-orange-600 font-semibold">70%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Communication Platform</h3>
                  <p className="text-sm text-gray-600">In-app messaging and video calls</p>
                </div>
              </div>
              <span className="text-blue-600 font-semibold">45%</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Referred?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Be the first to access our revolutionary referral system
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap">
                Get Early Access
              </button>
            </div>
            
            <p className="text-sm mt-4 opacity-75">
              We'll notify you as soon as the referral system is available
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

export default OnlineReferralSystem;
