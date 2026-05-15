import React from 'react';
import { Users, Target, Award, Heart, Mail, Phone, MapPin } from 'lucide-react';
import EduMarketingHeader from './EduMarketingHeader';

type FeatureItem = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const CARD_CLASS =
  'rounded-[24px] border border-[#073E36]/18 bg-white p-8 shadow-[0_12px_40px_rgba(7,62,54,0.06),0_24px_64px_rgba(7,62,54,0.08)] transition-colors duration-300 dark:border-[#073E36]/25 dark:bg-[#142824]/95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] md:p-12';

const AboutUs = () => {
  const features: FeatureItem[] = [
    {
      icon: Users,
      title: 'Peer-to-Peer Learning',
      description: 'Connect with fellow students and learn together in a collaborative environment.',
    },
    {
      icon: Target,
      title: '24/7 Support',
      description: 'Get instant help with your doubts anytime, anywhere from expert solvers.',
    },
    {
      icon: Award,
      title: 'Earn While Learning',
      description: 'Help others solve doubts and earn coins while enhancing your knowledge.',
    },
    {
      icon: Heart,
      title: 'Community Driven',
      description: 'Join a vibrant community of learners and educators passionate about education.',
    },
  ];

  const headingShadow = {
    textShadow:
      '0 1px 0 rgba(255,255,255,0.32), 0 2px 8px rgba(7, 62, 54, 0.22), 0 4px 14px rgba(7, 62, 54, 0.14)',
  } as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-white transition-colors duration-300 dark:bg-[#0a1614]">
      <div className="edu-hero-bg-grid" aria-hidden />

      <div className="relative z-10">
        <div className="mx-auto w-[96%] sm:w-[92%]">
          <div className="edu-marketing-page-header">
            <EduMarketingHeader variant="inline" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 md:px-6 md:pb-20 md:pt-6">
        <div className="mb-14 text-center md:mb-16">
          <h1
            className="font-display mb-5 text-4xl font-bold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-5xl lg:text-6xl"
            style={headingShadow}
          >
            About <span className="text-[#073E36] dark:text-[#E6EDD7]">Us</span>
          </h1>
          <p className="mx-auto max-w-3xl text-base font-medium leading-relaxed text-[#1a2e2c]/90 dark:text-[#E6EDD7]/80 md:text-lg">
            Empowering students through peer-to-peer learning and real-time doubt solving.
          </p>
        </div>

        <div className={`${CARD_CLASS} mb-10 md:mb-12`}>
          <h2 className="font-display mb-6 text-3xl font-bold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-4xl">
            Our Mission
          </h2>
          <p className="mb-4 text-base font-normal leading-relaxed text-[#1a2e2c] dark:text-[#c5d4c8] md:text-lg">
            At EDUFOYER, we believe that learning is a collaborative journey. Our mission is to create a platform
            where students can learn together, help each other, and earn while doing so. We&apos;re building a
            community-driven educational ecosystem that breaks down barriers to learning.
          </p>
          <p className="text-base font-normal leading-relaxed text-[#1a2e2c] dark:text-[#c5d4c8] md:text-lg">
            We envision a world where every student has access to instant help, where knowledge is shared freely, and
            where helping others is rewarded. Our platform connects students with skilled peers who are experts in
            their respective domains, offering real-time support that makes learning more accessible and engaging.
          </p>
        </div>

        <div className="mb-10 grid gap-5 md:mb-12 md:grid-cols-2 md:gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${CARD_CLASS} p-6 transition-transform duration-300 hover:-translate-y-0.5 md:p-8`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-2xl border border-[#073E36]/12 bg-[#E6EDD7] p-3 dark:border-[#073E36]/30 dark:bg-[#073E36]/25">
                  <feature.icon className="h-6 w-6 text-[#073E36] dark:text-[#E6EDD7]" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-2xl">
                    {feature.title}
                  </h3>
                  <p className="text-base leading-relaxed text-[#1a2e2c]/90 dark:text-[#c5d4c8]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-10 overflow-hidden rounded-[24px] border border-[#073E36]/25 bg-[#073E36] p-8 text-white shadow-[0_12px_40px_rgba(7,62,54,0.2),0_28px_72px_rgba(7,62,54,0.25)] md:mb-12 md:p-12">
          <h2 className="font-display mb-10 text-center text-3xl font-bold tracking-tight md:text-4xl">
            Our Impact
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">5K+</div>
              <div className="text-sm font-medium text-[#E6EDD7]/90 md:text-base">Active Students</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">1K+</div>
              <div className="text-sm font-medium text-[#E6EDD7]/90 md:text-base">Expert Solvers</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">10K+</div>
              <div className="text-sm font-medium text-[#E6EDD7]/90 md:text-base">Doubts Solved</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">24/7</div>
              <div className="text-sm font-medium text-[#E6EDD7]/90 md:text-base">Support Available</div>
            </div>
          </div>
        </div>

        <div className={`${CARD_CLASS} mb-10 md:mb-12`}>
          <h2 className="font-display mb-8 text-3xl font-bold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-4xl">
            Our Values
          </h2>
          <div className="space-y-6">
            {[
              { title: 'Accessibility', body: 'We believe education should be accessible to everyone, regardless of time or location.' },
              { title: 'Collaboration', body: 'Learning together makes us stronger. We foster a collaborative learning environment.' },
              { title: 'Innovation', body: 'We continuously innovate to provide the best learning experience for our community.' },
              { title: 'Excellence', body: 'We strive for excellence in everything we do, ensuring quality education for all.' },
            ].map((v) => (
              <div key={v.title} className="flex items-start gap-4">
                <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#073E36] ring-2 ring-[#E6EDD7]/80 dark:bg-[#E6EDD7] dark:ring-[#073E36]/50" />
                <div>
                  <h3 className="mb-2 text-xl font-semibold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-2xl">
                    {v.title}
                  </h3>
                  <p className="text-base leading-relaxed text-[#1a2e2c]/90 dark:text-[#c5d4c8]">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={CARD_CLASS}>
          <h2 className="font-display mb-8 text-center text-3xl font-bold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-4xl">
            Contact Us
          </h2>
          <div className="grid gap-8 md:grid-cols-3 md:gap-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#073E36]/12 bg-[#E6EDD7] dark:border-[#073E36]/30 dark:bg-[#073E36]/25">
                <Mail className="h-8 w-8 text-[#073E36] dark:text-[#E6EDD7]" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#073E36] dark:text-[#E6EDD7]">Email</h3>
              <a
                href="mailto:edufoyer2025@gmail.com"
                className="text-base text-[#1a2e2c] underline-offset-2 transition-colors hover:text-[#073E36] hover:underline dark:text-[#c5d4c8] dark:hover:text-[#E6EDD7]"
              >
                edufoyer2025@gmail.com
              </a>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#073E36]/12 bg-[#E6EDD7] dark:border-[#073E36]/30 dark:bg-[#073E36]/25">
                <Phone className="h-8 w-8 text-[#073E36] dark:text-[#E6EDD7]" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#073E36] dark:text-[#E6EDD7]">Phone</h3>
              <a
                href="tel:+919065343339"
                className="text-base text-[#1a2e2c] underline-offset-2 transition-colors hover:text-[#073E36] hover:underline dark:text-[#c5d4c8] dark:hover:text-[#E6EDD7]"
              >
                9065343339
              </a>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#073E36]/12 bg-[#E6EDD7] dark:border-[#073E36]/30 dark:bg-[#073E36]/25">
                <MapPin className="h-8 w-8 text-[#073E36] dark:text-[#E6EDD7]" strokeWidth={2} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#073E36] dark:text-[#E6EDD7]">Address</h3>
              <p className="text-base text-[#1a2e2c]/90 dark:text-[#c5d4c8]">
                Jacobpura, Sector 52, Gurugram, Haryana, India- 122022
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
