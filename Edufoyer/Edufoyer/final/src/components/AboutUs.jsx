import React from 'react';
import { Users, Target, Award, Heart, ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';

const AboutUs = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Peer-to-Peer Learning',
      description: 'Connect with fellow students and learn together in a collaborative environment.'
    },
    {
      icon: Target,
      title: '24/7 Support',
      description: 'Get instant help with your doubts anytime, anywhere from expert solvers.'
    },
    {
      icon: Award,
      title: 'Earn While Learning',
      description: 'Help others solve doubts and earn coins while enhancing your knowledge.'
    },
    {
      icon: Heart,
      title: 'Community Driven',
      description: 'Join a vibrant community of learners and educators passionate about education.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between p-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>
          <DarkModeToggle className="p-3" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300 tracking-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Us</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto transition-colors duration-300 leading-relaxed font-medium">
            Empowering students through peer-to-peer learning and real-time doubt solving
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg mb-12 transition-colors duration-300">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6 transition-colors duration-300 tracking-tight">Our Mission</h2>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-4 transition-colors duration-300 font-normal">
            At EDUFOYER, we believe that learning is a collaborative journey. Our mission is to create a platform where students can learn together, help each other, and earn while doing so. We're building a community-driven educational ecosystem that breaks down barriers to learning.
          </p>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300 font-normal">
            We envision a world where every student has access to instant help, where knowledge is shared freely, and where helping others is rewarded. Our platform connects students with skilled peers who are experts in their respective domains, offering real-time support that makes learning more accessible and engaging.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-3 transition-colors duration-300 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400 transition-colors duration-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-2xl p-8 md:p-12 text-white mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center tracking-tight">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">5K+</div>
              <div className="text-blue-100 text-sm md:text-base font-medium">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">1K+</div>
              <div className="text-blue-100 text-sm md:text-base font-medium">Expert Solvers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">10K+</div>
              <div className="text-blue-100 text-sm md:text-base font-medium">Doubts Solved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">24/7</div>
              <div className="text-blue-100 text-sm md:text-base font-medium">Support Available</div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg transition-colors duration-300">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 transition-colors duration-300 tracking-tight">Our Values</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300 tracking-tight">Accessibility</h3>
                <p className="text-base text-gray-600 dark:text-gray-400 transition-colors duration-300 leading-relaxed">
                  We believe education should be accessible to everyone, regardless of time or location.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2.5 h-2.5 bg-purple-600 dark:bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300 tracking-tight">Collaboration</h3>
                <p className="text-base text-gray-600 dark:text-gray-400 transition-colors duration-300 leading-relaxed">
                  Learning together makes us stronger. We foster a collaborative learning environment.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2.5 h-2.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300 tracking-tight">Innovation</h3>
                <p className="text-base text-gray-600 dark:text-gray-400 transition-colors duration-300 leading-relaxed">
                  We continuously innovate to provide the best learning experience for our community.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2.5 h-2.5 bg-orange-600 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300 tracking-tight">Excellence</h3>
                <p className="text-base text-gray-600 dark:text-gray-400 transition-colors duration-300 leading-relaxed">
                  We strive for excellence in everything we do, ensuring quality education for all.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg transition-colors duration-300">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8 transition-colors duration-300 tracking-tight text-center">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">Email</h3>
              <a
                href="mailto:edufoyer2025@gmail.com"
                className="text-base text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                edufoyer2025@gmail.com
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">Phone</h3>
              <a
                href="tel:+919065343339"
                className="text-base text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                9065343339
              </a>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 transition-colors duration-300">Address</h3>
              <p className="text-base text-gray-600 dark:text-gray-400 transition-colors duration-300">
                Jacobpura, Sector 52, Gurugram, Haryana, India- 122022
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;





