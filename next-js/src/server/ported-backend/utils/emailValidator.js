/**
 * Comprehensive email validation utility
 * Ensures only valid email addresses can be used for registration
 */

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      message: 'Email is required and must be a string'
    };
  }

  // Trim whitespace
  email = email.trim();

  // Check length
  if (email.length < 5 || email.length > 100) {
    return {
      isValid: false,
      message: 'Email must be between 5 and 100 characters'
    };
  }

  // Basic email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Invalid email format'
    };
  }

  // Check for invalid patterns
  const invalidPatterns = [
    { pattern: /^[^@]+$/, message: 'Email must contain @ symbol' },
    { pattern: /@$/, message: 'Email cannot end with @' },
    { pattern: /^@/, message: 'Email cannot start with @' },
    { pattern: /\.{2,}/, message: 'Email cannot contain consecutive dots' },
    { pattern: /@.*@/, message: 'Email cannot contain multiple @ symbols' },
    { pattern: /\.$/, message: 'Email cannot end with a dot' },
    { pattern: /^\./, message: 'Email cannot start with a dot' },
    { pattern: /\.@/, message: 'Invalid dot placement before @' },
    { pattern: /@\./, message: 'Invalid dot placement after @' },
    { pattern: /\s/, message: 'Email cannot contain spaces' },
    { pattern: /[<>]/, message: 'Email cannot contain < or > characters' },
    { pattern: /[()]/, message: 'Email cannot contain parentheses' },
    { pattern: /[\[\]]/, message: 'Email cannot contain square brackets' },
    { pattern: /[{}]/, message: 'Email cannot contain curly braces' },
    { pattern: /[|\\]/, message: 'Email cannot contain pipe or backslash' },
    { pattern: /[;:]/, message: 'Email cannot contain semicolon or colon' },
    { pattern: /[",]/, message: 'Email cannot contain quotes or commas' }
  ];

  for (const { pattern, message } of invalidPatterns) {
    if (pattern.test(email)) {
      return {
        isValid: false,
        message
      };
    }
  }

  // Check domain part
  const [localPart, domainPart] = email.split('@');
  
  if (!localPart || !domainPart) {
    return {
      isValid: false,
      message: 'Email must have both local and domain parts'
    };
  }

  // Check local part (before @)
  if (localPart.length > 64) {
    return {
      isValid: false,
      message: 'Local part of email cannot exceed 64 characters'
    };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return {
      isValid: false,
      message: 'Local part cannot start or end with a dot'
    };
  }

  // Check domain part (after @)
  if (domainPart.length > 253) {
    return {
      isValid: false,
      message: 'Domain part cannot exceed 253 characters'
    };
  }

  if (!domainPart.includes('.')) {
    return {
      isValid: false,
      message: 'Domain must contain at least one dot'
    };
  }

  // Check for valid TLD (top-level domain)
  const tldRegex = /\.[a-zA-Z]{2,}$/;
  if (!tldRegex.test(domainPart)) {
    return {
      isValid: false,
      message: 'Domain must have a valid top-level domain (e.g., .com, .org)'
    };
  }

  // Check for common fake domains (exact match only)
  const fakeDomains = [
    'gmail.con', 'yahoo.con', 'hotmail.con',
    'gmail.cm', 'yahoo.cm', 'hotmail.cm',
    'gmail.co', 'yahoo.co', 'hotmail.co',
    'gmail.om', 'yahoo.om', 'hotmail.om'
  ];

  if (fakeDomains.some(domain => domainPart.toLowerCase() === domain)) {
    return {
      isValid: false,
      message: 'Invalid domain format'
    };
  }

  return {
    isValid: true,
    message: 'Valid email address'
  };
};

export const normalizeEmail = (email) => {
  if (!email) return email;
  
  return email
    .trim()
    .toLowerCase()
    .replace(/\.{2,}/g, '.') // Replace multiple dots with single dot
    .replace(/\s+/g, ''); // Remove all spaces
};
