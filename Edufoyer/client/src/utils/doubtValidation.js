/**
 * Doubt Form Validation Utility
 * Validates doubt submission form fields
 */

/**
 * Validate doubt title
 * @param {string} title - Title to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateTitle(title) {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }
  
  if (title.trim().length < 3) {
    return { valid: false, error: 'Title must be at least 3 characters long' };
  }
  
  if (title.trim().length > 200) {
    return { valid: false, error: 'Title cannot exceed 200 characters' };
  }
  
  // Check for only whitespace
  if (title.trim().length === 0) {
    return { valid: false, error: 'Title cannot be only spaces' };
  }
  
  return { valid: true, error: '' };
}

/**
 * Validate subject selection
 * @param {string} subject - Subject to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateSubject(subject) {
  if (!subject || subject.trim().length === 0) {
    return { valid: false, error: 'Please select a subject' };
  }
  
  const validSubjects = [
    'operating systems',
    'artificial intelligence',
    'database management systems',
    'data structures and algorithms',
    'java',
    'mern'
  ];
  
  if (!validSubjects.includes(subject.toLowerCase())) {
    return { valid: false, error: 'Please select a valid subject' };
  }
  
  return { valid: true, error: '' };
}

/**
 * Validate doubt description
 * @param {string} description - Description to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateDescription(description) {
  if (!description || description.trim().length === 0) {
    return { valid: false, error: 'Description is required' };
  }
  
  if (description.trim().length < 10) {
    return { valid: false, error: 'Description must be at least 10 characters long. Please provide more details.' };
  }
  
  if (description.length > 5000) {
    return { valid: false, error: 'Description cannot exceed 5000 characters' };
  }
  
  // Check for only whitespace
  if (description.trim().length < 10) {
    return { valid: false, error: 'Description must contain meaningful content (at least 10 characters)' };
  }
  
  // Check for repetitive characters (e.g., "aaaaaaa" or "........")
  const repetitivePattern = /(.)\1{20,}/;
  if (repetitivePattern.test(description)) {
    return { valid: false, error: 'Description contains too many repetitive characters. Please provide meaningful content.' };
  }
  
  return { valid: true, error: '' };
}

/**
 * Validate doubt category
 * @param {string} category - Category to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateCategory(category) {
  if (!category) {
    return { valid: false, error: 'Please select a doubt category' };
  }
  
  const validCategories = ['small', 'medium', 'large'];
  if (!validCategories.includes(category)) {
    return { valid: false, error: 'Please select a valid category' };
  }
  
  return { valid: true, error: '' };
}

/**
 * Validate uploaded image
 * @param {File} file - Image file to validate
 * @returns {Object} { valid: boolean, error: string }
 */
export function validateImage(file) {
  if (!file) {
    return { valid: true, error: '' }; // Image is optional
  }
  
  // Check file size (2MB limit)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 2MB' };
  }
  
  // Check file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only PNG, JPG, and GIF images are allowed' };
  }
  
  return { valid: true, error: '' };
}

/**
 * Validate entire doubt form
 * @param {Object} formData - Form data to validate
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateDoubtForm(formData) {
  const { title, subject, description, doubtDescription, category, doubtCategory, image } = formData;
  
  const errors = {};
  let isValid = true;
  
  // Validate title
  const titleValidation = validateTitle(title);
  if (!titleValidation.valid) {
    errors.title = titleValidation.error;
    isValid = false;
  }
  
  // Validate subject
  const subjectValidation = validateSubject(subject);
  if (!subjectValidation.valid) {
    errors.subject = subjectValidation.error;
    isValid = false;
  }
  
  // Validate description (use description or doubtDescription)
  const desc = description || doubtDescription;
  const descValidation = validateDescription(desc);
  if (!descValidation.valid) {
    errors.description = descValidation.error;
    isValid = false;
  }
  
  // Validate category (use category or doubtCategory)
  const cat = category || doubtCategory;
  const catValidation = validateCategory(cat);
  if (!catValidation.valid) {
    errors.category = catValidation.error;
    isValid = false;
  }
  
  // Validate image (if provided)
  if (image) {
    const imageValidation = validateImage(image);
    if (!imageValidation.valid) {
      errors.image = imageValidation.error;
      isValid = false;
    }
  }
  
  return { valid: isValid, errors };
}

