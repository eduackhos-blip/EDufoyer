import React, { useState, useEffect } from 'react';
import { Mail, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RatingFeedbackForm from './RatingFeedbackForm';
import EduMarketingHeader from './EduMarketingHeader';

type PublicRating = {
  _id: string;
  user_name?: string;
  feedback?: string;
  createdAt?: string;
  createdAtLabel?: string;
};

type PublicRatingsResponse = {
  success?: boolean;
  data?: PublicRating[];
  stats?: {
    averageRating?: number;
  };
};

const LandingPage = () => {
  const router = useRouter();
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [, setPublicRatings] = useState<PublicRating[]>([]);
  const [, setAverageRating] = useState(0);

  useEffect(() => {
    void fetchPublicRatings();
  }, []);

  const fetchPublicRatings = async (): Promise<void> => {
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

      let data: PublicRatingsResponse;
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

  const handleButtonClick = (): void => {
    router.push('/auth');
  };

  const testimonialAvatarPhotos = [
    'https://i.pravatar.cc/120?img=12',
    'https://i.pravatar.cc/120?img=5',
    'https://i.pravatar.cc/120?img=12',
    'https://i.pravatar.cc/120?img=5',
  ];

  const screenshotTestimonials: PublicRating[] = [
    {
      _id: 'jacob-stanley-1',
      user_name: 'Jacob Stanley',
      feedback: 'EduFoyer transformed my learning experience. Getting help at 2 AM during exam prep was a lifesaver!',
      createdAtLabel: '1 day ago',
    },
    {
      _id: 'ashley-simone-1',
      user_name: 'Ashley Simone',
      feedback: "I've earned over $500 while helping students. It's rewarding both financially and personally.",
      createdAtLabel: '1 day ago',
    },
    {
      _id: 'jacob-stanley-2',
      user_name: 'Jacob Stanley',
      feedback: 'EduFoyer transformed my learning experience. Getting help at 2 AM during exam prep was a lifesaver!',
      createdAtLabel: '2 days ago',
    },
    {
      _id: 'ashley-simone-2',
      user_name: 'Ashley Simone',
      feedback: "I've earned over $500 while helping students. It's rewarding both financially and personally.",
      createdAtLabel: '2 days ago',
    },
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden transition-colors duration-300">
      <div className="edu-hero-bg-grid" aria-hidden />
      <div className="relative z-10">
        <div className="w-[96%] sm:w-[92%] mx-auto">
          <section className="edu-hero-section">
            <EduMarketingHeader variant="inline" />

            <div className="edu-hero-content landing-shrink-hero">
              <div className="edu-hero-left">
                <h1 className="edu-hero-title">
                  <span className="edu-hero-title-learn">
                    <img src="/aboveMarks.png" alt="" aria-hidden className="edu-hero-title-mark" />
                    LEARN
                  </span>{' '}
                  TOGETHER AND
                  <br />
                  EARN TOGETHER
                </h1>

                <div className="edu-hero-cta">
                  <button onClick={handleButtonClick} className="edu-btn-light" type="button">
                    ASK DOUBT
                  </button>
                  <button onClick={handleButtonClick} className="edu-btn-dark" type="button">
                    SOLVE DOUBT
                  </button>
                </div>

              </div>

              <div className="edu-hero-right">
                <div className="edu-hero-main-image">
                  <img src="/centralimage.jpg" alt="Classroom" />
                </div>

                <div className="edu-top-note">
                  <div className="edu-note-overlay" />
                  <img src="/topleft.jpg" alt="Community note" />
                  <p>
                    Be part of a vibrant learning community where students and educators come together to share
                    knowledge, grow skills, and earn rewards for guiding others.
                  </p>
                </div>

                <div className="edu-bottom-note">
                  <div className="edu-note-overlay" />
                  <img src="/bottomright.jpg" alt="Peer learning note" />
                  <p>
                    A 24/7 peer to peer learning platform where anyone can instantly connect with knowledgeable guides.
                  </p>
                </div>

                <div className="edu-main-curve" aria-hidden>
                  <img src="/arrowMain.png" alt="" aria-hidden className="edu-main-curve-img" />
                </div>

                <img src="/star.png" alt="" aria-hidden className="edu-star-img-top" />
                <img src="/bottomStar.png" alt="" aria-hidden className="edu-star-img-top-below" />
                <img src="/fill%20star.png" alt="" aria-hidden className="edu-star-img-bottom-left" />
                <img src="/fillStarBottom.png" alt="" aria-hidden className="edu-star-img-bottom-left-right" />
              </div>
            </div>
          </section>

          {/* Main Content */}
          <div className="w-[96%] sm:w-[90%] mx-auto px-4 sm:px-6 py-8 md:py-12 pt-8 landing-shrink-body">

          {/* What Our Users Say Section (second half of landing) */}
          <section className="edu-reviews-section">
            <div className="edu-flow-row">
              <div className="edu-flow-pill edu-flow-pill-solid">POST QUERY</div>
              <svg className="edu-flow-connector" viewBox="0 0 130 42" aria-hidden>
                <defs>
                  <marker id="flowArrowHeadA" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 Z" className="edu-flow-arrow-head" />
                  </marker>
                </defs>
                <path className="edu-flow-arrow-line" d="M8 28 C45 4, 90 6, 120 19" markerEnd="url(#flowArrowHeadA)" />
              </svg>
              <div className="edu-flow-pill edu-flow-pill-light">LIVE INTERACTION</div>
              <svg className="edu-flow-connector edu-flow-connector-low" viewBox="0 0 130 42" aria-hidden>
                <defs>
                  <marker id="flowArrowHeadB" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 Z" className="edu-flow-arrow-head" />
                  </marker>
                </defs>
                <path className="edu-flow-arrow-line" d="M8 15 C45 40, 90 37, 120 23" markerEnd="url(#flowArrowHeadB)" />
              </svg>
              <div className="edu-flow-pill edu-flow-pill-solid">INSTANT PEER HELP</div>
              <svg className="edu-flow-connector" viewBox="0 0 130 42" aria-hidden>
                <defs>
                  <marker id="flowArrowHeadC" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 Z" className="edu-flow-arrow-head" />
                  </marker>
                </defs>
                <path className="edu-flow-arrow-line" d="M8 28 C45 4, 90 6, 120 19" markerEnd="url(#flowArrowHeadC)" />
              </svg>
              <div className="edu-flow-pill edu-flow-pill-light">EARN INCENTIVES</div>
            </div>

            <div className="edu-reviews-heading-row">
              <h2 className="edu-reviews-heading">
                <img src="/aboveMarks.png" alt="" aria-hidden className="edu-reviews-heading-mark" />
                <span className="edu-reviews-heading-text">What Our Users Say</span>
              </h2>
              <button
                onClick={() => setShowRatingForm(true)}
                className="edu-reviews-feedback-btn"
                type="button"
              >
                ↖ Share your feedback
              </button>
            </div>

            <div className="edu-reviews-cards-row">
              {screenshotTestimonials.slice(0, 4).map((rating, idx) => {
                const avatarPhoto = testimonialAvatarPhotos[idx % testimonialAvatarPhotos.length];
                return (
                  <article key={rating._id} className="edu-review-card">
                    <div className="edu-review-card-head">
                      <img src={avatarPhoto} alt="" aria-hidden className="edu-review-avatar" />
                      <p className="edu-review-name">{rating.user_name || 'Edufoyer User'}</p>
                    </div>
                    <p className="edu-review-quote">&quot;{rating.feedback}&quot;</p>
                    <div className="edu-review-divider" />
                    <p className="edu-review-stars" aria-label="4 out of 5 stars">
                      ★★★★☆
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="edu-reviews-stars" aria-hidden>
              <img src="/fill%20star.png" alt="" className="edu-reviews-star-large" />
              <img src="/fillStarBottom.png" alt="" className="edu-reviews-star-small" />
            </div>
          </section>
        </div>
      </div>
      </div>

      <footer className="edu-footer landing-shrink-body">
        <div className="edu-footer-inner">
          <div className="edu-footer-top">
            <div className="edu-footer-brand">
              <Link href="/" className="edu-footer-logo" aria-label="Edufoyer home">
                <span className="edu-footer-logo-text">EDU</span>
                <span className="edu-footer-logo-f">F</span>
                <span className="edu-footer-logo-text">OYER</span>
              </Link>
              <p className="edu-footer-tagline">
                Empowering learners through peer to peer collaboration and real time academic support.
              </p>
            </div>

            <div className="edu-footer-links">
              <h3>Quick Links</h3>
              <Link href="/about">About&nbsp; Us</Link>
              <Link href="/contact">Contact Us</Link>
              <a href="mailto:edufoyer2025@gmail.com">Support</a>
            </div>

            <div className="edu-footer-contact">
              <h3>Get in Touch</h3>
              <a href="mailto:edufoyer2025@gmail.com" className="edu-footer-contact-item">
                <Mail size={16} strokeWidth={2.2} />
                <span>edufoyer2025@gmail.com</span>
              </a>
              <p className="edu-footer-contact-item">
                <MapPin size={16} strokeWidth={2.2} />
                <span>Jacobpura, Sector 52, Gurugram, Haryana, India- 122022</span>
              </p>
            </div>
          </div>

          <div className="edu-footer-divider" />

          <p className="edu-footer-bottom">© {new Date().getFullYear()} Eduackhos Pvt Ltd. All rights reserved.</p>
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
