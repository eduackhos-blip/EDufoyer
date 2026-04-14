import React, { useState, useEffect } from 'react';
import { HelpCircle, BookOpen, ArrowRight, Users, Video, MessageCircle, Clock, Star, CheckCircle, Zap, MessageSquare, Mail, Gift, Phone, MapPin, UserCircle, Headphones, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RatingFeedbackForm from './RatingFeedbackForm';
import DarkModeToggle from './DarkModeToggle';

const LandingPage = () => {
  const router = useRouter();
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [publicRatings, setPublicRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchPublicRatings();
  }, []);

  const fetchPublicRatings = async () => {
    try {
      const response = await fetch('/api/rating/public?limit=3');
      
      if (!response.ok) {
        console.warn('Failed to fetch ratings:', response.status, response.statusText);
        setPublicRatings([]);
        setAverageRating(0);
        return;
      }

      const text = await response.text();
      if (!text) {
        console.warn('Empty response from ratings API');
        setPublicRatings([]);
        setAverageRating(0);
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse ratings response:', parseError);
        setPublicRatings([]);
        setAverageRating(0);
        return;
      }

      if (data.success) {
        setPublicRatings(data.data || []);
        setAverageRating(data.stats?.averageRating || 0);
      } else {
        setPublicRatings([]);
        setAverageRating(0);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setPublicRatings([]);
      setAverageRating(0);
    }
  };

  const handleButtonClick = () => {
    router.push('/auth');
  };

  const formatTimeAgo = (createdAt) => {
    try {
      if (!createdAt) return '';
      const date = new Date(createdAt);
      const diffMs = Date.now() - date.getTime();
      if (Number.isNaN(diffMs) || diffMs < 0) return '';

      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return `${seconds} seconds ago`;
      if (minutes < 60) return `${minutes} minutes ago`;
      if (hours < 24) return `${hours} hours ago`;
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } catch {
      return '';
    }
  };

  const avatarColorsByIndex = ['bg-purple-500', 'bg-green-500', 'bg-pink-500'];

  // Subject chips below each testimonial (UI-only mapping based on card index)
  const subjectPillsByIndex = [
    [
      { label: 'Programming', bg: 'bg-blue-50', text: 'text-blue-600' },
      { label: 'Algorithms', bg: 'bg-purple-50', text: 'text-purple-600' },
    ],
    [
      { label: 'Mathematics', bg: 'bg-purple-50', text: 'text-purple-600' },
      { label: 'Study Group', bg: 'bg-green-50', text: 'text-green-600' },
    ],
    [
      { label: 'Physics', bg: 'bg-blue-50', text: 'text-blue-600' },
      { label: 'Resources', bg: 'bg-orange-50', text: 'text-orange-600' },
    ],
  ];

  const screenshotTestimonials = [
    {
      _id: 'sarah-khan',
      user_name: 'Sarah Khan',
      feedback: 'Great platform!',
      createdAtLabel: '2 hours ago',
    },
    {
      _id: 'manash-rito',
      user_name: 'Manash Rito',
      feedback: 'Best application for study partners for calculus final exam prep!',
      createdAtLabel: '5 hours ago',
    },
    {
      _id: 'emili-thakur',
      user_name: 'Emili Thakur',
      feedback: 'Best online doubt solver for learning quantum mechanics!',
      createdAtLabel: '1 day ago',
    },
    {
      _id: 'ria-singh',
      user_name: 'Ria Singh',
      feedback: 'Clear explanations and quick solutions. It helped me understand DBMS indexing in one day.',
      createdAtLabel: '2 days ago',
    },
    {
      _id: 'arjun-menon',
      user_name: 'Arjun Menon',
      feedback: 'The OS scheduling discussions were super useful during my operating systems revision.',
      createdAtLabel: '3 days ago',
    },
    {
      _id: 'kavya-nair',
      user_name: 'Kavya Nair',
      feedback: 'Loved the peer feedback. I finally found reliable resources for Data Structures practice.',
      createdAtLabel: '5 days ago',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B1220] relative overflow-hidden transition-colors duration-300">
      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(20px); }
          50% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInOutDelayed {
          0%, 20% { opacity: 0; transform: translateY(20px); }
          40%, 80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        
        @keyframes fadeInOutDelayed2 {
          0%, 40% { opacity: 0; transform: translateY(20px); }
          60%, 90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        
        .animate-fade-in-out {
          animation: fadeInOut 3s ease-in-out infinite;
        }
        
        .animate-fade-in-out-delayed {
          animation: fadeInOutDelayed 4s ease-in-out infinite;
        }
        
        .animate-fade-in-out-delayed-2 {
          animation: fadeInOutDelayed2 5s ease-in-out infinite;
        }
      `}</style>
      {/* Notebook background overlay (ruled paper) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(31,41,55,0.06) 0px, rgba(31,41,55,0.06) 1px, transparent 1px, transparent 28px), linear-gradient(to right, rgba(31,41,55,0.10) 0px, rgba(31,41,55,0.10) 3px, transparent 3px)',
          backgroundSize: '100% 100%',
        }}
      />

      <div className="relative z-10">
        {/* Header with Logo and Navigation - Fixed/Sticky */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between p-4 md:p-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-300 italic transition-colors duration-300 hover:opacity-80">
                  EDU
                  <span className="relative inline-block mx-1">
                    <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg transform rotate-3"></span>
                    <span className="relative bg-gradient-to-r from-red-400 to-orange-400 rounded-lg px-1 py-0.5 text-white font-bold text-xl md:text-2xl">
                      F
                    </span>
                  </span>
                  OYER
                </h1>
              </Link>
            </div>
            <div className="flex items-center gap-4 md:gap-6">
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/about"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-300"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-300"
                >
                  Contact Us
                </Link>
              </nav>
              {/* Mobile Navigation */}
              <div className="md:hidden flex items-center gap-2">
                <Link
                  href="/about"
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-300 px-2"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-300 px-2"
                >
                  Contact
                </Link>
              </div>
              {/* Dark Mode Toggle Button */}
              <DarkModeToggle className="p-2 md:p-3" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-[96%] sm:w-[90%] mx-auto px-4 sm:px-6 py-8 md:py-12 pt-20 md:pt-24">
          {/* Hero Section (top half) */}
          <section className="flex flex-col items-center text-center">
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-50 leading-tight tracking-tight">
                Learn Together
              </h2>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-500 dark:text-gray-200 leading-tight tracking-tight">
                Earn Together
              </h2>
              <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                A collaborative space where students ask questions, share knowledge, and explore ideas across subjects.
              </p>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                Join a community of curious learners. Post questions, discover trending discussions, and get insights from
                peers and mentors.
              </p>
            </div>

            {/* Primary buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleButtonClick}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-sm md:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
              >
                Start Asking Questions
              </button>
              <button
                onClick={handleButtonClick}
                className="inline-flex items-center justify-center rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-100 px-8 py-3 text-sm md:text-base font-semibold shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto"
              >
                Solve Doubts
              </button>
            </div>

            {/* Cards cluster */}
            <div className="relative mt-12 md:mt-16 w-full px-1 md:px-2">

              {/* Pinned note - Yellow (single sticky note, tilted counter-clockwise) */}
              <div
                className="absolute left-0 sm:left-2 top-4 sm:top-5 md:top-6 z-30 rotate-[-6deg] bg-[#FFF7CC] rounded-[18px] px-4 sm:px-5 py-3 sm:py-4 max-w-[220px] sm:max-w-[260px] border border-[#F3E29A] text-left note-hover"
                style={{ boxShadow: '0 18px 45px rgba(15,23,42,0.1), 0 8px 24px rgba(255,247,204,0.6)', ['--note-rot']: '-6deg' }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#E85D4C] shadow-md" />
                <p className="text-xs md:text-sm font-semibold text-gray-800">
                  Got a tough concept? Ask the community and get answers instantly!
                </p>
              </div>

              {/* Additional pinned notes around the hero to spread across the wall */}
              {/* Top-right light purple note */}
              <div
                className="absolute right-0 sm:right-2 top-2 sm:top-4 md:top-6 z-30 rotate-[4deg] bg-[#F8E9FF] rounded-[18px] px-3 sm:px-4 py-2.5 sm:py-3 max-w-[200px] sm:max-w-[230px] border border-[#E1C0FF] text-left note-hover"
                style={{ boxShadow: '0 18px 45px rgba(15,23,42,0.08), 0 8px 22px rgba(248,233,255,0.8)', ['--note-rot']: '4deg' }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#F472B6] shadow-md" />
                <p className="text-xs md:text-sm font-semibold text-gray-800">
                  Discrete Math fact: every social network can be modeled as a graph of friends.
                </p>
              </div>

              {/* Mid-left teal note */}
              <div
                className="absolute z-30 rotate-[3deg] bg-[#E0F9FF] rounded-[18px] px-3 sm:px-4 py-2.5 sm:py-3 max-w-[210px] sm:max-w-[240px] border border-[#B9E6F2] text-left note-hover"
                style={{
                  boxShadow:
                    'rgba(15, 23, 42, 0.08) 0px 18px 45px, rgba(224, 249, 255, 0.85) 0px 8px 22px',
                  ['--note-rot']: '3deg',
                  top: '-2rem',
                  left: '32rem',
                }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#38BDF8] shadow-md" />
                <p className="text-xs md:text-sm font-semibold text-gray-800">
                  OS, DBMS and Networks are the trio every CS student revises before exams.
                </p>
              </div>

              {/* Mid-right pink note */}
              <div
                className="absolute z-30 rotate-[-4deg] bg-[#FFE5F2] rounded-[18px] px-3 sm:px-4 py-2.5 sm:py-3 max-w-[210px] sm:max-w-[240px] border border-[#FFC4E0] text-left note-hover"
                style={{
                  boxShadow:
                    'rgba(15, 23, 42, 0.08) 0px 18px 45px, rgba(255, 229, 242, 0.85) 0px 8px 22px',
                  ['--note-rot']: '-4deg',
                  top: '7rem',
                  right: '1.5rem',
                }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FB7185] shadow-md" />
                <p className="text-xs md:text-sm font-semibold text-gray-800">
                  In DBMS, indexes work like a book index—jump straight to the exact record.
                </p>
              </div>

              {/* Center cards - scattered layout with different tilts */}
              <div className="relative z-20 pt-10 space-y-6 md:space-y-8">
                {/* User Question card (match reference styling) */}
                <div
                  className="w-full transform rotate-[2deg] bg-white rounded-2xl px-6 py-5 md:px-8 md:py-6 flex items-start gap-4 card-hover"
                  style={{
                    boxShadow:
                      '0 18px 55px rgba(15,23,42,0.14), 0 1px 0 rgba(255,255,255,0.9) inset',
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-semibold text-[#64748B] mb-1">User Question</p>

                    <div className="mt-2 space-y-3">
                      {/* Q1 */}
                      <div>
                        <p className="text-sm md:text-base font-bold text-[#111827] leading-snug">
                          &quot;How do you use the pumping lemma for CFLs to prove {'{a^n b^n c^n | n≥0}'} is not context-free?&quot;
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: '#EAF3FF',
                              color: '#2563EB',
                              border: '1px solid rgba(37,99,235,0.25)',
                            }}
                          >
                            AFL
                          </span>
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: '#E7F7EE',
                              color: '#059669',
                              border: '1px solid rgba(5,150,105,0.10)',
                            }}
                          >
                            Theory of Computation
                          </span>
                        </div>
                      </div>

                      {/* Q2 */}
                      <div>
                        <p className="text-sm md:text-base font-bold text-[#111827] leading-snug">
                          &quot;Explain priority inversion in real-time systems. How does the priority inheritance protocol resolve it?&quot;
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: '#F3E8FF',
                              color: '#7C3AED',
                              border: '1px solid rgba(124,58,237,0.18)',
                            }}
                          >
                            Operating Systems
                          </span>
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: '#FFF3E8',
                              color: '#C2410C',
                              border: '1px solid rgba(194,65,12,0.15)',
                            }}
                          >
                            Process Scheduling
                          </span>
                        </div>
                      </div>

                      {/* Q3 */}
                      <div>
                        <p className="text-sm md:text-base font-bold text-[#111827] leading-snug">
                          &quot;Compare strict 2PL and rigorous 2PL for concurrency control. When does cascading rollback occur?&quot;
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: '#E0F2FE',
                              color: '#0369A1',
                              border: '1px solid rgba(3,105,161,0.18)',
                            }}
                          >
                            DBMS
                          </span>
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: '#ECFDF5',
                              color: '#047857',
                              border: '1px solid rgba(4,120,87,0.14)',
                            }}
                          >
                            Transaction Management
                          </span>
                        </div>
                      </div>

                      {/* Q4 */}
                      <div>
                        <p className="text-sm md:text-base font-bold text-[#111827] leading-snug">
                          &quot;Why does the count-to-infinity problem occur in distance vector routing? How does split horizon mitigate it?&quot;
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: '#FCE7F3',
                              color: '#BE185D',
                              border: '1px solid rgba(190,24,93,0.2)',
                            }}
                          >
                            Computer Networks
                          </span>
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#B45309',
                              border: '1px solid rgba(180,83,9,0.2)',
                            }}
                          >
                            Routing Algorithms
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom row - 10,000+, Trending + Popular Topics */}
                <div className="relative flex flex-col md:flex-row gap-6 md:gap-8 items-stretch md:items-start pt-4">
                  {/* Stats card - doubts solved across core CS subjects */}
                  <div className="transform rotate-[2deg] bg-white rounded-2xl px-5 py-4 flex flex-col justify-between md:flex-1 lg:flex-[0.72] min-h-[155px] md:min-h-[170px] card-hover" style={{ boxShadow: '0 18px 55px rgba(15,23,42,0.14), 0 1px 0 rgba(255,255,255,0.9) inset' }}>
                    <div>
                      <p className="text-2xl md:text-3xl font-semibold text-blue-600">10,000+</p>
                      <p className="mt-1 text-sm text-gray-500">doubts cleared this semester</p>
                      <p className="mt-0.5 text-xs text-gray-400">OS · DBMS · CN · AFL · DSA</p>
                    </div>
                    <div className="mt-4 flex gap-1.5" title="OS · DBMS · CN · AFL">
                      <span className="h-3 w-3 rounded-full bg-purple-500" title="AFL" />
                      <span className="h-3 w-3 rounded-full bg-pink-500" title="OS" />
                      <span className="h-3 w-3 rounded-full bg-blue-500" title="DBMS" />
                      <span className="h-3 w-3 rounded-full bg-green-500" title="CN" />
                    </div>
                  </div>

                  {/* Trending + Popular Topics (same line on large screens) */}
                  <div className="relative md:flex-1 lg:flex-[1.28] lg:flex lg:items-start lg:gap-6">
                    {/* Trending card */}
                    <div data-debug="trendingCard" className="transform -rotate-[1.5deg] bg-white rounded-2xl px-5 py-5 flex flex-col justify-between h-auto w-full lg:w-auto lg:flex-1 card-hover" style={{ boxShadow: '0 18px 55px rgba(15,23,42,0.14), 0 1px 0 rgba(255,255,255,0.9) inset' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 text-xs font-semibold">
                          <span>Trending</span>
                          <span aria-hidden="true">🔥</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">
                          DBMS
                        </span>
                      </div>
                      <p className="text-sm md:text-base font-semibold text-gray-800 mb-1">
                        Two-phase locking vs timestamp ordering: which prevents cascading rollback?
                      </p>
                      <p className="text-xs text-gray-500">89 responses · 1.8k views · 12 solved</p>
                    </div>

                    {/* Popular Topics card - core CS subjects */}
                    <div
                      data-debug="popularTopicsCard"
                      className="relative mt-4 lg:mt-0 w-full sm:w-[80%] md:w-full lg:w-64 lg:flex-none transform -rotate-[4deg] z-10 bg-white rounded-2xl px-6 py-5 card-hover"
                      style={{
                        boxShadow:
                          '0 18px 55px rgba(15,23,42,0.14), 0 1px 0 rgba(255,255,255,0.9) inset',
                      }}
                    >
                      <p className="text-[11px] font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                        Core subjects · Ask & earn
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex px-3 py-1 rounded-full bg-violet-500 text-white text-xs font-semibold">
                          AFL
                        </span>
                        <span className="inline-flex px-3 py-1 rounded-full bg-cyan-500 text-white text-xs font-semibold">
                          OS
                        </span>
                        <span className="inline-flex px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                          DBMS
                        </span>
                        <span className="inline-flex px-3 py-1 rounded-full bg-pink-500 text-white text-xs font-semibold">
                          CN
                        </span>
                        <span className="inline-flex px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-semibold">
                          DSA
                        </span>
                        <span className="inline-flex px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold">
                          Programming
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* What Our Users Say Section (second half of landing) */}
          <section>
            {/* Feature row: Ask / Join / Learn */}
            <div
            className="grid gap-6 md:grid-cols-3 mb-10 md:mb-16 lg:hidden"
              style={{ position: 'relative', top: '-10rem' }}
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-glossy px-6 py-6 flex flex-col items-start card-hover">
                <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center mb-4">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask Questions</h3>
                <p className="text-sm text-gray-500 text-left">
                  Post academic questions and receive helpful answers from the community.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-glossy px-6 py-6 flex flex-col items-start card-hover relative z-20 transform translate-y-0 md:-translate-y-8">
                <div className="w-10 h-10 rounded-2xl bg-purple-500 flex items-center justify-center mb-4">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Join Discussions</h3>
                <p className="text-sm text-gray-500 text-left">
                  Participate in trending conversations across different subjects.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-glossy px-6 py-6 flex flex-col items-start card-hover">
                <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn Together</h3>
                <p className="text-sm text-gray-500 text-left">
                  Discover insights, resources, and perspectives shared by students.
                </p>
              </div>
            </div>

            {/* Heading + CTA */}
            <div className="text-center mb-4 relative pt-16">
              {/* Study & learn pin notes - trapezium-style tilt, tilt more on hover */}
              <div
                aria-hidden
                className="flex flex-wrap justify-center items-center gap-10 md:gap-20 mb-6 z-0"
              >
                <div
                  className="relative top-8 -rotate-[22deg] bg-[#FFF7CC] rounded-[18px] px-5 py-3.5 border border-[#F3E29A] text-left note-hover max-w-[280px] transition-transform duration-200"
                  style={{
                    boxShadow: 'rgba(15, 23, 42, 0.08) 0px 18px 45px, rgba(255, 247, 204, 0.6) 0px 8px 24px',
                    ['--note-rot']: '-25deg',
                  }}
                >
                  <p className="text-sm font-semibold text-gray-800 leading-tight">
                    Review what you learned today
                  </p>
                </div>
                <div
                  className="relative -top-4 rotate-0 bg-[#E0F9FF] rounded-[18px] px-5 py-3.5 border border-[#B9E6F2] text-center note-hover max-w-[300px] transition-transform duration-200"
                  style={{
                    boxShadow: 'rgba(15, 23, 42, 0.08) 0px 18px 45px, rgba(224, 249, 255, 0.6) 0px 8px 24px',
                    ['--note-rot']: '3deg',
                  }}
                >
                  <p className="text-sm font-semibold text-gray-800 leading-tight">
                    Discuss doubts with peers for faster clarity
                  </p>
                </div>
                <div
                  className="relative top-8 rotate-[22deg] bg-[#F8E9FF] rounded-[18px] px-5 py-3.5 border border-[#E1C0FF] text-right note-hover max-w-[280px] transition-transform duration-200"
                  style={{
                    boxShadow: 'rgba(15, 23, 42, 0.08) 0px 18px 45px, rgba(248, 233, 255, 0.6) 0px 8px 24px',
                    ['--note-rot']: '25deg',
                  }}
                >
                  <p className="text-sm font-semibold text-gray-800 leading-tight">
                    Practice problems beats rereading
                  </p>
                </div>
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                  What Our User Say
                </h2>
                <p className="text-sm md:text-base text-gray-500 mb-6">
                  EduFoyer brings students together in one space to collaborate, ask questions,
                  earn and explore new topics.
                </p>
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-2.5 text-sm font-semibold shadow-md"
                >
                  Share Your Feedback
                </button>
              </div>
            </div>

            {/* Ratings row styled as testimonial cards (screenshot data) */}
            <div className="relative z-10 mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
              {screenshotTestimonials.map((rating, idx) => {
                const avatarBg = avatarColorsByIndex[idx % avatarColorsByIndex.length];
                const subjectPills = subjectPillsByIndex[idx % subjectPillsByIndex.length];

                return (
                  <div
                    key={rating._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-glossy px-8 py-7 flex flex-col w-full"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-semibold text-white ${avatarBg}`}
                      >
                        {rating.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex flex-col items-start">
                        <p className="text-[16px] font-semibold text-gray-900 leading-tight">
                          {rating.user_name || 'Edufoyer User'}
                        </p>
                        <p className="text-[13px] text-gray-500">
                          {rating.createdAtLabel ?? formatTimeAgo(rating.createdAt)}
                        </p>
                      </div>
                    </div>

                    <p className="text-[15px] text-gray-700 mb-6 line-clamp-3 text-left">
                      {rating.feedback}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2">
                      {subjectPills.map((pill) => (
                        <span
                          key={pill.label}
                          className={`inline-flex items-center px-3 py-1 rounded-full ${pill.bg} ${pill.text} text-[13px] font-medium leading-none`}
                        >
                          {pill.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats row */}
            <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-blue-600 leading-none">10K+</p>
                <p className="text-xs md:text-sm text-gray-500 mt-2">Active Students</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-purple-600 leading-none">50K+</p>
                <p className="text-xs md:text-sm text-gray-500 mt-2">Questions Asked</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-green-600 leading-none">100K+</p>
                <p className="text-xs md:text-sm text-gray-500 mt-2">Answers Solved</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-extrabold text-orange-500 leading-none">25+</p>
                <p className="text-xs md:text-sm text-gray-500 mt-2">Subject Areas</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer - matches landing theme with gradients, card styling, and icons */}
      <footer className="relative z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300 mt-20 overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20 pointer-events-none" />
        <div className="w-[96%] sm:w-[90%] mx-auto px-4 sm:px-6 py-12 md:py-16 relative">
          {/* Footer Content */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-8">
            {/* Brand Section - slight tilt like pinned notes */}
            <div className="space-y-4 transform md:-rotate-1">
              <div className="flex items-center">
                <h2 className="font-display text-2xl font-bold italic">
                  <span className="hero-heading-gradient">EDU</span>
                  <span className="relative inline-block mx-1">
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg transform rotate-3" />
                    <span className="relative bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg px-1 py-0.5 text-white font-bold text-xl">F</span>
                  </span>
                  <span className="hero-heading-gradient">OYER</span>
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Empowering students through peer-to-peer learning and real-time doubt solving.
              </p>
            </div>

            {/* Quick Links - card-style with icons */}
            <div className="space-y-4">
              <h3 className="hero-heading-gradient text-lg font-semibold mb-4">Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Link
                  href="/about"
                  className="group flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 w-fit py-2 px-3 -mx-3 rounded-lg hover:bg-blue-50/80 dark:hover:bg-blue-900/20"
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 group-hover:from-blue-200 group-hover:to-indigo-200 dark:group-hover:from-blue-800/50 dark:group-hover:to-indigo-800/50 transition-colors shadow-sm">
                    <UserCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">About Us</span>
                  <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link
                  href="/contact"
                  className="group flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 w-fit py-2 px-3 -mx-3 rounded-lg hover:bg-blue-50/80 dark:hover:bg-blue-900/20"
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 group-hover:from-purple-200 group-hover:to-pink-200 dark:group-hover:from-purple-800/50 dark:group-hover:to-pink-800/50 transition-colors shadow-sm">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium">Contact Us</span>
                  <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 transition-opacity" />
                </Link>
                <a
                  href="mailto:edufoyer2025@gmail.com"
                  className="group flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 w-fit py-2 px-3 -mx-3 rounded-lg hover:bg-blue-50/80 dark:hover:bg-blue-900/20"
                >
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 group-hover:from-amber-200 group-hover:to-orange-200 dark:group-hover:from-amber-800/50 dark:group-hover:to-orange-800/50 transition-colors shadow-sm">
                    <Headphones className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-medium">Support</span>
                  <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>

            {/* Contact Information - glossy icon cards */}
            <div className="space-y-4">
              <h3 className="hero-heading-gradient text-lg font-semibold mb-4">Get in Touch</h3>
              <div className="space-y-3">
                <a
                  href="mailto:edufoyer2025@gmail.com"
                  className="group flex items-center gap-3 text-sm md:text-base text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 py-2 px-3 -mx-3 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/50 card-hover"
                >
                  <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800/80 shadow-glossy border border-gray-100 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors shrink-0">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium break-all">edufoyer2025@gmail.com</span>
                </a>
                <a
                  href="tel:+919065343339"
                  className="group flex items-center gap-3 text-sm md:text-base text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 py-2 px-3 -mx-3 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/50 card-hover"
                >
                  <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800/80 shadow-glossy border border-gray-100 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors shrink-0">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">+91 90653 43339</span>
                </a>
                <a
                  href="tel:+919211249724"
                  className="group flex items-center gap-3 text-sm md:text-base text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 py-2 px-3 -mx-3 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/50 card-hover"
                >
                  <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800/80 shadow-glossy border border-gray-100 dark:border-gray-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors shrink-0">
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">+91 92112 49724</span>
                </a>
                <div className="flex items-start gap-3 text-sm md:text-base text-gray-700 dark:text-gray-300 py-2 px-3 -mx-3 rounded-xl">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800/80 shadow-glossy border border-gray-100 dark:border-gray-700 shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium pt-0.5">Jacobpura, Sector 52, Gurugram, Haryana, India-122022</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-8" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300 text-center md:text-left">
              © {new Date().getFullYear()} <span className="font-semibold text-gray-800 dark:text-gray-200">Eduackhos Pvt Ltd.</span> All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-xs md:text-sm text-gray-500 dark:text-gray-500">
              <span className="flex items-center gap-1.5">
                Made with <span className="text-red-500">❤</span> for students
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Rating Feedback Form Modal */}
      <RatingFeedbackForm 
        isOpen={showRatingForm}
        onClose={() => {
          setShowRatingForm(false);
          fetchPublicRatings(); // Refresh ratings after submission
        }}
      />
    </div>
  );
};

export default LandingPage;
