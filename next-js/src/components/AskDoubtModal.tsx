import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, ChevronRight, Info, Search } from 'lucide-react';

const PALE_BG = '#CDDCAF';

const SUBJECTS = [
  { label: 'Operating Systems', value: 'operating systems' },
  { label: 'Artificial Intelligence', value: 'artificial intelligence' },
  { label: 'Database Management Systems', value: 'database management systems' },
  { label: 'Data Structures and Algorithms', value: 'data structures and algorithms' },
  { label: 'Java', value: 'java' },
  { label: 'MERN', value: 'mern' }
];

const DOUBT_CATEGORIES = [
  { id: 'small', label: 'Quick 20 minute session' },
  { id: 'medium', label: 'Medium topic - Unpacking concepts in 30 minutes' },
  { id: 'large', label: 'Large topic - Understand the entire chapter in 60 minutes' }
];

function LabelWithTicks({
  htmlFor,
  children,
  className = ''
}: {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const labelText = (
    <span className="relative inline-block pt-[8px]">
      <img
        src="/aboveMarks.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-[-17px] top-0 h-[20px] w-[27px] object-contain"
        decoding="async"
      />
      {children}
    </span>
  );

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-[14px] font-semibold text-[#1a2e2c]">
          {labelText}
        </label>
      ) : (
        <span className="text-[14px] font-semibold text-[#1a2e2c]">{labelText}</span>
      )}
    </div>
  );
}

function SubjectChip({ label, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-center gap-1 rounded-[10px] border-[1.5px] px-[8px] py-[6px] text-center text-[10px] font-medium leading-tight transition-colors ${
        active
          ? 'border-[#073E36] bg-[#073E36] text-white'
          : 'border-[#073E36] bg-white text-[#073E36]'
      }`}
    >
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
    </button>
  );
}

const AskDoubtModal = ({
  setIsFormOpen,
  handleSubmit,
  title,
  handleTitleChange,
  errors,
  subject,
  handleSubjectChange,
  doubtCategory,
  handleCategoryChange,
  handleShowCategoryDetails,
  doubtDescription,
  handleDescriptionChange,
  isScheduled,
  setScheduledDate,
  scheduledDate,
  setScheduledTime,
  scheduledTime,
  handleImageUpload,
  imagePreview,
  uploadedImage,
  setUploadedImage,
  setImagePreview,
  setIsScheduled,
  uploading = false
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectsExpanded, setSubjectsExpanded] = useState(false);

  const uploadFromFile = (file) => {
    if (!file) return;
    handleImageUpload({ target: { files: [file], value: '' } });
  };

  const filteredSubjects = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return SUBJECTS;
    return SUBJECTS.filter((s) => s.label.toLowerCase().includes(q));
  }, [subjectSearch]);

  const visibleSubjects = useMemo(() => {
    if (filteredSubjects.length <= 4 || subjectsExpanded) return filteredSubjects;
    return filteredSubjects.slice(0, 4);
  }, [filteredSubjects, subjectsExpanded]);

  const showMoreChip = filteredSubjects.length > 4 && !subjectsExpanded;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4">
      <div
        className="box-border flex h-[min(90vh,720px)] min-h-[520px] w-full max-w-[900px] flex-col overflow-hidden rounded-[28px] bg-white p-[10px] shadow-[0_28px_80px_rgba(0,0,0,0.14),0_12px_36px_rgba(0,0,0,0.08)]"
        style={{ fontFamily: "-apple-system,'SF Pro Display',BlinkMacSystemFont,'Segoe UI',sans-serif" }}
      >
        {/* Top bar — Save Draft + Close */}
        <div className="flex shrink-0 items-center justify-between px-6 pb-0 pt-[0.5rem] md:px-8 md:pt-[0.55rem]">
          <button
            type="button"
            className="rounded-full bg-[#073E36] px-5 py-2 text-[12px] font-bold uppercase tracking-wide text-white shadow-sm transition-opacity hover:opacity-95"
            onClick={() => setIsScheduled(!isScheduled)}
          >
            {isScheduled ? 'Cancel schedule' : 'Save draft'}
          </button>
          <button
            type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#073E36] text-white shadow-sm transition-opacity hover:opacity-95"
            onClick={() => setIsFormOpen(false)}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/*
          Envelope mental model: case rotated 90° CCW → opening faces LEFT.
          Image = envelope case (right). Letter = form sliding out to the left;
          ~10% of sheet width tucks under the case (overlap + z-index).
        */}
        <div className="ask-envelope-stage relative flex min-h-0 flex-1 overflow-hidden">
          <div className="relative z-0 flex min-h-0 min-w-0 flex-1 items-stretch pl-2 pr-0 pb-3 pt-0.5 md:pl-3 md:pr-4 md:pb-4 md:pt-1">
            {/* Letter — sits under case along the right ~10% (see md:mr tuck + case z-index) */}
            <div className="ask-envelope-letter relative z-[2] flex min-h-0 min-w-0 w-full flex-1 md:mt-1 md:w-[37rem] md:flex-none md:shrink-0 md:left-0">
              <div className="ask-envelope-letter-sheet flex min-h-0 w-full flex-col overflow-hidden bg-transparent md:p-0">
                <div
                  className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
                  style={{ backgroundColor: PALE_BG }}
                >
                  {/* Decorative sparkles */}
                  <span
                    className="pointer-events-none absolute left-[12%] top-[28%] text-[#073E36] opacity-[0.12]"
                    aria-hidden
                  >
                    ✦
                  </span>
                  <span
                    className="pointer-events-none absolute right-[18%] top-[55%] text-[#073E36] opacity-[0.1]"
                    aria-hidden
                  >
                    ✦
                  </span>
                  <span
                    className="pointer-events-none absolute left-[22%] bottom-[32%] text-[#073E36] opacity-[0.1]"
                    aria-hidden
                  >
                    ✦
                  </span>

                  <form
                    id="askDoubtForm"
                    onSubmit={handleSubmit}
                    className="ask-doubt-modal-form-scroll flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-6 pb-4 pt-2 md:gap-3 md:pl-6 md:pr-24 md:pb-5 md:pt-3.5"
                  >
              {/* Banner */}
              <div className="ask-envelope-banner ask-envelope-banner-clip relative -ml-6 -mt-3 overflow-hidden bg-[#073E36] px-4 py-3 pr-14 shadow-inner md:-ml-6 md:-mr-24 md:-mt-4 md:min-h-[48px]">
                <p className="relative z-[1] text-[16px] font-bold tracking-[0.1em] text-white md:text-[17px]">Ask your doubt!</p>
                <img
                  src="/Group%2032.png"
                  alt=""
                  aria-hidden
                  decoding="async"
                  className="pointer-events-none absolute bottom-[-0.65rem] left-[0rem] z-[1] h-[84px] w-[17em] opacity-95"
                />
                <img
                  src="/whiteStarBigger.png"
                  alt=""
                  aria-hidden
                  decoding="async"
                  className="pointer-events-none absolute right-[5.7rem] top-[0.35rem] z-[2] h-auto w-[1.5rem]"
                />
                <img
                  src="/whiteStarSmall.png"
                  alt=""
                  aria-hidden
                  decoding="async"
                  className="pointer-events-none absolute right-[5rem] top-[1.6rem] z-[2] h-[1.3rem] w-auto"
                />
              </div>

              {/* Doubt title */}
              <div className="flex flex-col gap-[6px]">
                <LabelWithTicks htmlFor="title">
                  Doubt title <span className="text-[#EF4444]">*</span>
                </LabelWithTicks>
                <input
                  id="title"
                  placeholder="Enter a clear title for your doubt (min 3 characters)"
                  value={title}
                  maxLength={200}
                  onChange={handleTitleChange}
                  className={`rounded-[10px] border-[1.5px] bg-white px-[13px] py-[6px] text-[14px] text-[#111827] shadow-[0_2px_10px_rgba(7,62,54,0.08)] outline-none ${
                    errors.title ? 'border-[#EF4444]' : 'border-[#073E36]/20'
                  }`}
                  required
                />
                {errors.title && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                    <AlertCircle size={13} /> {errors.title}
                  </span>
                )}
                <span className="text-right text-[11px] text-[#6b7a76]">{title.length}/200 characters</span>
              </div>

              {/* Subjects */}
              <div className="flex flex-col gap-1.5">
                <LabelWithTicks>
                  Subjects <span className="text-[#EF4444]">*</span>
                </LabelWithTicks>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a76]"
                    strokeWidth={2}
                  />
                  <input
                    type="search"
                    placeholder="Search a subject"
                    value={subjectSearch}
                    onChange={(e) => {
                      setSubjectSearch(e.target.value);
                      setSubjectsExpanded(false);
                    }}
                    className="w-full rounded-[10px] border-[1.5px] border-[#073E36]/20 bg-white py-[6px] pl-10 pr-3 text-[14px] text-[#111827] shadow-[0_2px_10px_rgba(7,62,54,0.08)] outline-none placeholder:text-[#9ca8a4]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {visibleSubjects.map((sub) => (
                    <SubjectChip
                      key={sub.value}
                      label={sub.label}
                      active={subject === sub.value}
                      onToggle={() => handleSubjectChange({ target: { value: sub.value } })}
                    />
                  ))}
                  {showMoreChip ? (
                    <button
                      type="button"
                      onClick={() => setSubjectsExpanded(true)}
                      className="flex w-full items-center justify-center rounded-[10px] border-[1.5px] border-[#073E36] bg-white px-[8px] py-[6px] text-[10px] font-semibold text-[#073E36] transition-colors hover:bg-white/80"
                    >
                      + More
                    </button>
                  ) : null}
                </div>
                {errors.subject && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                    <AlertCircle size={13} /> {errors.subject}
                  </span>
                )}
              </div>

              {/* Doubt category */}
              <div className="flex flex-col gap-1.5">
                <LabelWithTicks>Doubt category</LabelWithTicks>
                <div className="flex flex-col gap-1.5">
                  {DOUBT_CATEGORIES.map((cat) => {
                    const selected = doubtCategory === cat.id;
                    return (
                      <div
                        key={cat.id}
                        className={`flex items-stretch gap-2 rounded-[12px] border-[1.5px] bg-white px-3 py-1.5 shadow-sm transition-colors ${
                          selected ? 'border-[#073E36] ring-1 ring-[#073E36]/25' : 'border-[#c5d5cf]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleCategoryChange({ target: { value: cat.id } })}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          aria-pressed={selected}
                        >
                          <ChevronRight className="h-4 w-4 shrink-0 text-[#073E36]" strokeWidth={2.5} />
                          <span className="text-[10px] font-medium leading-snug text-[#1a2e2c]">{cat.label}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowCategoryDetails(cat.id);
                          }}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border-[1.5px] border-[#073E36] bg-white text-[#073E36] transition-colors hover:bg-[#073E36]/5"
                          aria-label={`More about ${cat.label}`}
                        >
                          <Info className="h-4 w-4" strokeWidth={2.2} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {errors.category && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                    <AlertCircle size={13} /> {errors.category}
                  </span>
                )}
              </div>

              {/* Describe your doubt */}
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="description" className="text-[14px] font-semibold text-[#1a2e2c]">
                  <span className="relative inline-block pt-[8px]">
                    <img
                      src="/aboveMarks.png"
                      alt=""
                      aria-hidden
                      className="pointer-events-none absolute left-[-17px] top-0 h-[20px] w-[27px] object-contain"
                      decoding="async"
                    />
                    Describe your doubt <span className="text-[#EF4444]">*</span>
                  </span>
                </label>
                <textarea
                  id="description"
                  placeholder="What's on your mind? Share your thoughts, questions, or resources"
                  value={doubtDescription}
                  maxLength={5000}
                  onChange={handleDescriptionChange}
                  className={`min-h-[72px] resize-y rounded-[12px] border-[1.5px] bg-white px-[14px] py-2 text-[14px] leading-[1.55] text-[#374151] shadow-[0_2px_10px_rgba(7,62,54,0.08)] outline-none ${
                    errors.description ? 'border-[#EF4444]' : 'border-[#073E36]/20'
                  }`}
                  required
                />
                {errors.description && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                    <AlertCircle size={13} /> {errors.description}
                  </span>
                )}
                <span className="text-[11px] text-[#6b7a76]">
                  {doubtDescription.length}/5000 characters (minimum 10 required)
                </span>
              </div>

              {isScheduled && (
                <div className="rounded-[12px] border-[1.5px] border-[#c5d5cf] bg-white p-3 shadow-sm">
                  <div className="flex gap-2.5">
                    <div className="flex flex-1 flex-col gap-2">
                      <label htmlFor="scheduledDate" className="text-[14px] font-semibold text-[#1a2e2c]">
                        <span className="relative inline-block pt-[8px]">
                          <img
                            src="/aboveMarks.png"
                            alt=""
                            aria-hidden
                            className="pointer-events-none absolute left-[-17px] top-0 h-[20px] w-[27px] object-contain"
                            decoding="async"
                          />
                          Date <span className="text-[#EF4444]">*</span>
                        </span>
                      </label>
                      <input
                        id="scheduledDate"
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="rounded-[10px] border-[1.5px] border-[#073E36]/20 bg-white px-[13px] py-[8px] text-[14px] text-[#111827] shadow-[0_2px_10px_rgba(7,62,54,0.08)] outline-none"
                        required={isScheduled}
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <label htmlFor="scheduledTime" className="text-[14px] font-semibold text-[#1a2e2c]">
                        <span className="relative inline-block pt-[8px]">
                          <img
                            src="/aboveMarks.png"
                            alt=""
                            aria-hidden
                            className="pointer-events-none absolute left-[-17px] top-0 h-[20px] w-[27px] object-contain"
                            decoding="async"
                          />
                          Time <span className="text-[#EF4444]">*</span>
                        </span>
                      </label>
                      <input
                        id="scheduledTime"
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="rounded-[10px] border-[1.5px] border-[#073E36]/20 bg-white px-[13px] py-[8px] text-[14px] text-[#111827] shadow-[0_2px_10px_rgba(7,62,54,0.08)] outline-none"
                        required={isScheduled}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-[6px]">
                <label className="text-[14px] font-semibold text-[#1a2e2c]">
                  <span className="relative inline-block pt-[8px]">
                    <img
                      src="/aboveMarks.png"
                      alt=""
                      aria-hidden
                      className="pointer-events-none absolute left-[-17px] top-0 h-[20px] w-[27px] object-contain"
                      decoding="async"
                    />
                    Upload reference image (optional)
                  </span>
                </label>
                {errors.image && (
                  <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                    <AlertCircle size={13} /> {errors.image}
                  </span>
                )}
                {imagePreview ? (
                  <div className="flex flex-col items-center gap-2.5 rounded-[12px] border-[1.5px] border-[#c5d5cf] bg-white p-3 shadow-sm">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="max-h-[180px] max-w-full rounded-[8px] object-contain"
                    />
                    <div className="text-[11px] text-[#6b7a76]">{uploadedImage?.name}</div>
                    <button
                      type="button"
                      className="border-none bg-transparent text-[12px] font-medium text-[#EF4444]"
                      onClick={() => {
                        setUploadedImage(null);
                        if (imagePreview) URL.revokeObjectURL(imagePreview);
                        setImagePreview(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex cursor-pointer flex-col items-center justify-center rounded-[12px] border-[1.5px] border-dashed border-[#a8bdb4] bg-white px-4 py-5 shadow-sm transition-colors hover:border-[#073E36] hover:bg-[#f3faf7]"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      uploadFromFile(e.dataTransfer.files[0]);
                    }}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const nextFile = e.target.files?.[0];
                        if (nextFile) uploadFromFile(nextFile);
                      }}
                    />
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="mb-1.5 text-[#9ca8a4]">
                      <path
                        d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="m-0 text-[13px] font-medium text-[#6b7a76]">Click to upload an image</p>
                    <p className="mt-[3px] text-[11px] text-[#9ca8a4]">PNG, JPG, GIF up to 2MB</p>
                  </div>
                )}
              </div>

              <div className="mt-2 flex w-full justify-stretch pt-1 md:mt-3 md:justify-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full rounded-full bg-[#073E36] py-2.5 text-[13px] font-bold uppercase tracking-wide text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:px-8"
                >
                  {uploading ? 'Submitting…' : 'Submit doubt'}
                </button>
              </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Envelope case (image) — stacks above the tucked-in strip of the letter */}
            <div className="ask-envelope-case relative z-[5] hidden min-h-0 w-[24rem] shrink-0 md:-ml-6 md:mr-2 md:flex md:flex-col">
              <div className="flex min-h-0 flex-1 flex-col justify-end pt-2">
                <div className="ask-envelope-cover-inner relative min-h-0 flex-1 overflow-hidden rounded-tr-[24px] rounded-br-[20px]">
                  <img
                    src="/backgroundAskDoubtImg.png"
                    alt=""
                    className="ask-envelope-cover-photo h-full min-h-[280px] w-full"
                    decoding="async"
                  />
                  <span
                    className="pointer-events-none absolute left-[10%] top-[14%] z-[3] text-[10px] text-white opacity-90 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]"
                    aria-hidden
                  >
                    ✦ ✦
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AskDoubtModal;
