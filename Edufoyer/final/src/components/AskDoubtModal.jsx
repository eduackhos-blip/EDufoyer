import React, { useRef } from 'react';
import { AlertCircle } from 'lucide-react';

const SUBJECTS = [
  { label: 'Operating Systems', value: 'operating systems' },
  { label: 'Artificial Intelligence', value: 'artificial intelligence' },
  { label: 'Database Management Systems', value: 'database management systems' },
  { label: 'Data Structures and Algorithms', value: 'data structures and algorithms' },
  { label: 'Java', value: 'java' },
  { label: 'MERN', value: 'mern' }
];

const DOUBT_CATEGORIES = [
  { id: 'small', label: 'Quick 20-Minute Session' },
  { id: 'medium', label: 'Medium Topic - Unpacking Concepts in 30 Minutes' },
  { id: 'large', label: 'Large Topic - Understand the Entire Chapter in 60 Minutes' }
];

function SubjectChip({ label, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-full rounded-[10px] border-[1.5px] bg-white px-[10px] py-[11px] text-center text-[13.5px] font-medium leading-[1.3] text-[#3B82F6] transition-colors ${
        active ? 'border-[#3B82F6]' : 'border-[#C5D0F5]'
      }`}
    >
      {label}
      {active && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B82F6]">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
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
  uploading
}) => {
  const fileRef = useRef(null);

  const canSubmit =
    title.trim().length >= 3 &&
    Boolean(subject) &&
    doubtDescription.trim().length >= 10 &&
    !uploading &&
    (!isScheduled || (scheduledDate && scheduledTime));

  const uploadFromFile = (file) => {
    if (!file) return;
    handleImageUpload({ target: { files: [file], value: '' } });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4">
      <div
        className="flex h-[636px] w-[680px] max-w-[680px] flex-col overflow-hidden rounded-[20px] bg-white"
        style={{ fontFamily: "-apple-system,'SF Pro Display',BlinkMacSystemFont,'Segoe UI',sans-serif" }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pb-[14px] pt-5">
          <span className="text-[20px] font-bold text-[#111827]" style={{ letterSpacing: '-0.3px' }}>
            Ask Your Doubt
          </span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="bg-transparent p-0 text-[15px] font-medium text-[#3B82F6]"
              onClick={() => setIsScheduled(!isScheduled)}
            >
              {isScheduled ? 'Cancel Schedule' : 'Save Draft'}
            </button>
            <button
              type="button"
              className="flex items-center rounded-md p-1 text-[#6B7280]"
              onClick={() => setIsFormOpen(false)}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable form body ── */}
        <form
          id="askDoubtForm"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-[18px] overflow-y-auto px-6 pb-4"
        >

          {/* Doubt Title */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="title" className="text-[14px] font-semibold text-[#111827]">
              Doubt Title <span className="text-[#EF4444]">*</span>
            </label>
            <input
              id="title"
              placeholder="Enter a clear title for your doubt (min 3 characters)"
              value={title}
              maxLength={200}
              onChange={handleTitleChange}
              className={`rounded-[10px] border-[1.5px] bg-white px-[13px] py-[10px] text-[14px] text-[#111827] outline-none ${
                errors.title ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
              }`}
              required
            />
            {errors.title && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                <AlertCircle size={13} /> {errors.title}
              </span>
            )}
            <span className="text-[11px] text-[#9CA3AF]">{title.length}/200 characters</span>
          </div>

          {/* Subject chips — 3-column grid */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-[#111827]">
              Subject <span className="text-[#EF4444]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {SUBJECTS.map((sub) => (
                <SubjectChip
                  key={sub.value}
                  label={sub.label}
                  active={subject === sub.value}
                  onToggle={() => handleSubjectChange({ target: { value: sub.value } })}
                />
              ))}
            </div>
            {errors.subject && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                <AlertCircle size={13} /> {errors.subject}
              </span>
            )}
          </div>

          {/* Doubt Category */}
          <div className="flex flex-col gap-1">
            <label className="text-[14px] font-semibold text-[#111827]">Doubt Category</label>
            {DOUBT_CATEGORIES.map((cat) => (
              <label key={cat.id} className="flex cursor-pointer items-center gap-2.5 px-0.5 py-2">
                <input
                  type="radio"
                  name="doubtCategory"
                  value={cat.id}
                  checked={doubtCategory === cat.id}
                  onChange={handleCategoryChange}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-[#3B82F6]"
                />
                <span className="flex-1 text-[14px] text-[#374151]">{cat.label}</span>
                <button
                  type="button"
                  onClick={() => handleShowCategoryDetails(cat.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-none bg-[#EEF2FF] text-[11px] font-semibold text-[#3B82F6]"
                >
                  i
                </button>
              </label>
            ))}
            {errors.category && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                <AlertCircle size={13} /> {errors.category}
              </span>
            )}
          </div>

          {/* Describe your doubt */}
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="description" className="text-[14px] font-semibold text-[#111827]">
              Describe your doubt <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              id="description"
              placeholder="What's on your mind? Share your thoughts, questions, or resources..."
              value={doubtDescription}
              maxLength={5000}
              onChange={handleDescriptionChange}
              className={`min-h-[110px] resize-y rounded-[12px] border-[1.5px] bg-[#F9FAFB] px-[14px] py-3 text-[14px] leading-[1.6] text-[#374151] outline-none ${
                errors.description ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
              }`}
              required
            />
            {errors.description && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                <AlertCircle size={13} /> {errors.description}
              </span>
            )}
            <span className="text-[11px] text-[#9CA3AF]">
              {doubtDescription.length}/5000 characters (minimum 10 required)
            </span>
          </div>

          {/* Scheduled date/time — shown only when isScheduled */}
          {isScheduled && (
            <div className="rounded-[12px] border-[1.5px] border-[#DBEAFE] bg-[#EFF6FF] p-3">
              <div className="flex gap-2.5">
                <div className="flex flex-1 flex-col gap-2">
                  <label htmlFor="scheduledDate" className="text-[14px] font-semibold text-[#111827]">
                    Date <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="scheduledDate"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="rounded-[10px] border-[1.5px] border-[#E5E7EB] bg-white px-[13px] py-[10px] text-[14px] text-[#111827] outline-none"
                    required={isScheduled}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <label htmlFor="scheduledTime" className="text-[14px] font-semibold text-[#111827]">
                    Time <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    id="scheduledTime"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="rounded-[10px] border-[1.5px] border-[#E5E7EB] bg-white px-[13px] py-[10px] text-[14px] text-[#111827] outline-none"
                    required={isScheduled}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload reference image */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[14px] font-semibold text-[#111827]">
              Upload reference image (optional)
            </label>
            {errors.image && (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                <AlertCircle size={13} /> {errors.image}
              </span>
            )}
            {imagePreview ? (
              <div className="flex flex-col items-center gap-2.5 rounded-[12px] border-[1.5px] border-[#E5E7EB] bg-[#F9FAFB] p-3">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="max-h-[180px] max-w-full rounded-[8px] object-contain"
                />
                <div className="text-[11px] text-[#9CA3AF]">{uploadedImage?.name}</div>
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
                className="flex cursor-pointer flex-col items-center justify-center rounded-[12px] border-[1.5px] border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-7 transition-colors hover:border-[#3B82F6] hover:bg-[#EFF6FF]"
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
                  onChange={(e) => uploadFromFile(e.target.files[0])}
                />
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="mb-1.5 text-[#9CA3AF]">
                  <path
                    d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="m-0 text-[13px] font-medium text-[#6B7280]">Click to upload an image</p>
                <p className="mt-[3px] text-[11px] text-[#9CA3AF]">PNG, JPG, GIF up to 2MB</p>
              </div>
            )}
          </div>

        </form>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-[#F3F4F6] px-6 pb-5 pt-3.5">

          {/* Left — decorative icon row matching the Create Post modal */}
          <div className="flex items-center gap-[18px]">
            <button
              type="button"
              className="flex items-center justify-center rounded-md border-none bg-transparent p-0.5 text-[#9CA3AF] hover:text-[#6B7280]"
              onClick={() => fileRef.current?.click()}
              title="Upload image"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="1.5" y="3.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M1.5 13l4.5-4 3 3 2.5-2.5 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center justify-center rounded-md border-none bg-transparent p-0.5 text-[#9CA3AF] hover:text-[#6B7280]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" />
                <path d="M7 11.5s.8 2 3 2 3-2 3-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="7.5" cy="8.5" r="1" fill="currentColor" />
                <circle cx="12.5" cy="8.5" r="1" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center justify-center rounded-md border-none bg-transparent p-0.5 text-[#9CA3AF] hover:text-[#6B7280]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a5.5 5.5 0 015.5 5.5C15.5 11.5 10 18 10 18S4.5 11.5 4.5 7.5A5.5 5.5 0 0110 2z" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="10" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </div>

          {/* Right — submit button */}
          <button
            type="submit"
            form="askDoubtForm"
            disabled={!canSubmit}
            className={`rounded-[10px] border-none px-[22px] py-[10px] text-[15px] font-semibold transition-colors ${
              canSubmit
                ? 'cursor-pointer bg-[#3B82F6] text-white'
                : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
            }`}
          >
            {uploading ? 'Submitting...' : isScheduled ? 'Schedule Doubt' : 'Submit Doubt'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default AskDoubtModal;