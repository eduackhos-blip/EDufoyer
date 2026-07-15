import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, User, MessageSquare, MessageCircle } from 'lucide-react';
import EduMarketingHeader from './EduMarketingHeader';

const FIELD_CLASS =
  'w-full rounded-full border-[1.5px] border-[#073E36]/20 bg-white px-3.5 py-2.5 text-[13px] text-[#111827] shadow-[inset_0_1px_4px_rgba(7,62,54,0.06)] outline-none transition-[border-color,box-shadow] placeholder:text-[#9ca8a4] focus:border-[#073E36]/45 focus:shadow-[inset_0_1px_4px_rgba(7,62,54,0.08),0_0_0_3px_rgba(7,62,54,0.12)] dark:border-[#073E36]/35 dark:bg-[#142824] dark:text-[#E6EDD7] dark:placeholder:text-[#9ca8a4]/70';

const TEXTAREA_CLASS =
  'w-full rounded-2xl border-[1.5px] border-[#073E36]/20 bg-white px-3.5 py-3 text-[13px] text-[#111827] shadow-[inset_0_1px_4px_rgba(7,62,54,0.06)] outline-none transition-[border-color,box-shadow] placeholder:text-[#9ca8a4] focus:border-[#073E36]/45 focus:shadow-[inset_0_1px_4px_rgba(7,62,54,0.08),0_0_0_3px_rgba(7,62,54,0.12)] dark:border-[#073E36]/35 dark:bg-[#142824] dark:text-[#E6EDD7] dark:placeholder:text-[#9ca8a4]/70';

const CARD_CLASS =
  'rounded-[24px] border border-[#073E36]/18 bg-white p-6 shadow-[0_12px_40px_rgba(7,62,54,0.06),0_24px_64px_rgba(7,62,54,0.08)] transition-colors duration-300 dark:border-[#073E36]/25 dark:bg-[#142824]/95 dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] md:p-8';

type ContactRow = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  content: string;
  link: string | null;
};

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | null>(null);

  const contactInfo: ContactRow[] = [
    {
      icon: Mail,
      title: 'Email',
      content: 'edufoyer2025@gmail.com',
      link: 'mailto:edufoyer2025@gmail.com',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '9065343339',
      link: 'tel:+919065343339',
    },
    {
      icon: Phone,
      title: 'Phone',
      content: '9211249724',
      link: 'tel:+919211249724',
    },
    {
      icon: MapPin,
      title: 'Address',
      content: 'Jacobpura, Sector 52, Gurugram, Haryana, India- 122022',
      link: null,
    },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 1500);
  };

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
          <div className="mb-12 text-center md:mb-14">
            <h1
              className="font-display mb-5 text-4xl font-bold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-5xl lg:text-6xl"
              style={headingShadow}
            >
              Contact <span className="text-[#073E36] dark:text-[#E6EDD7]">Us</span>
            </h1>
            <p className="mx-auto max-w-3xl text-base font-medium leading-relaxed text-[#1a2e2c]/90 dark:text-[#E6EDD7]/80 md:text-lg">
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as
              possible.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
            <div className="space-y-5 lg:col-span-1">
              {contactInfo.map((info, index) => {
                const isAlternate = index % 2 === 1;
                return (
                <div
                  key={`${info.title}-${info.content}-${index}`}
                  className={
                    isAlternate
                      ? 'rounded-[24px] border border-white/20 bg-[rgb(7,62,54)] p-6 shadow-[0_12px_32px_rgba(7,62,54,0.35)] transition-colors md:p-8 dark:border-[#E6EDD7]/25 dark:bg-[rgb(7,62,54)]'
                      : CARD_CLASS
                  }
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={
                        isAlternate
                          ? 'shrink-0 rounded-2xl border border-white/25 bg-white/10 p-3'
                          : 'shrink-0 rounded-2xl border border-[#073E36]/12 bg-[#E6EDD7] p-3 dark:border-[#073E36]/30 dark:bg-[#073E36]/25'
                      }
                    >
                      <info.icon
                        className={
                          isAlternate
                            ? 'h-6 w-6 text-[#E6EDD7]'
                            : 'h-6 w-6 text-[#073E36] dark:text-[#E6EDD7]'
                        }
                        strokeWidth={2}
                      />
                    </div>
                    <div>
                      <h3
                        className={
                          isAlternate
                            ? 'mb-1.5 text-lg font-semibold tracking-tight text-[#E6EDD7] md:text-xl'
                            : 'mb-1.5 text-lg font-semibold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-xl'
                        }
                      >
                        {info.title}
                      </h3>
                      {info.link ? (
                        <a
                          href={info.link}
                          className={
                            isAlternate
                              ? 'text-sm leading-relaxed text-white/90 underline-offset-2 transition-colors hover:text-white hover:underline md:text-base'
                              : 'text-sm leading-relaxed text-[#1a2e2c] underline-offset-2 transition-colors hover:text-[#073E36] hover:underline dark:text-[#c5d4c8] dark:hover:text-[#E6EDD7] md:text-base'
                          }
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p
                          className={
                            isAlternate
                              ? 'text-sm leading-relaxed text-white/85 md:text-base'
                              : 'text-sm leading-relaxed text-[#1a2e2c]/90 dark:text-[#c5d4c8] md:text-base'
                          }
                        >
                          {info.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="lg:col-span-2">
              <div className={CARD_CLASS}>
                <h2 className="font-display mb-6 text-2xl font-bold tracking-tight text-[#073E36] dark:text-[#E6EDD7] md:text-3xl">
                  Send us a Message
                </h2>

                {submitStatus === 'success' && (
                  <div className="mb-6 rounded-lg border border-[#073E36]/30 bg-white/95 p-3 shadow-sm dark:border-[#073E36]/40 dark:bg-[#073E36]/20">
                    <p className="text-sm font-medium text-[#073E36] dark:text-[#E6EDD7]">
                      Thank you for your message! We&apos;ll get back to you soon.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-[#1a2e2c] dark:text-[#c5d4c8]"
                    >
                      <User className="h-4 w-4 shrink-0 text-[#073E36] dark:text-[#E6EDD7]" strokeWidth={2} />
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className={FIELD_CLASS}
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-[#1a2e2c] dark:text-[#c5d4c8]"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-[#073E36] dark:text-[#E6EDD7]" strokeWidth={2} />
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={FIELD_CLASS}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-[#1a2e2c] dark:text-[#c5d4c8]"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-[#073E36] dark:text-[#E6EDD7]" strokeWidth={2} />
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className={FIELD_CLASS}
                      placeholder="What is this regarding?"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-[#1a2e2c] dark:text-[#c5d4c8]"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0 text-[#073E36] dark:text-[#E6EDD7]" strokeWidth={2} />
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className={`${TEXTAREA_CLASS} resize-none leading-relaxed`}
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#073E36] py-3 text-center text-sm font-bold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(7,62,54,0.25)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45 md:text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" strokeWidth={2.25} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
