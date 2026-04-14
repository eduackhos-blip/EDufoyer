/**
 * Email Whitelist System
 * Only allows signup for pre-approved email addresses
 */

// List of approved email addresses/domains
const APPROVED_EMAILS = [
  // Only admin emails can be added here if needed
];

// List of approved domains - ONLY KIIT domains allowed
const APPROVED_DOMAINS = [
  'kiit.ac.in',
  'kiit.edu.in'
];

/**
 * Check if email is in the whitelist
 * @param {string} email - Email address to check
 * @returns {object} - Validation result
 */
export const checkEmailWhitelist = (email) => {
  if (!email || typeof email !== 'string') {
    return {
      isApproved: false,
      message: 'Email is required'
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is in the approved list
  if (APPROVED_EMAILS.includes(normalizedEmail)) {
    return {
      isApproved: true,
      message: 'Email is approved'
    };
  }

  // Check if domain is in the approved domains list
  const domain = normalizedEmail.split('@')[1];
  if (domain && APPROVED_DOMAINS.includes(domain)) {
    return {
      isApproved: true,
      message: 'Email domain is approved'
    };
  }

  return {
    isApproved: false,
    message: 'Only @kiit.ac.in or @kiit.edu.in email addresses are allowed for registration.'
  };
};

/**
 * Add email to whitelist (admin function)
 * @param {string} email - Email to add
 */
export const addToWhitelist = (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!APPROVED_EMAILS.includes(normalizedEmail)) {
    APPROVED_EMAILS.push(normalizedEmail);
    return true;
  }
  return false;
};

/**
 * Remove email from whitelist (admin function)
 * @param {string} email - Email to remove
 */
export const removeFromWhitelist = (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const index = APPROVED_EMAILS.indexOf(normalizedEmail);
  if (index > -1) {
    APPROVED_EMAILS.splice(index, 1);
    return true;
  }
  return false;
};

/**
 * Get all approved emails (admin function)
 */
export const getApprovedEmails = () => {
  return [...APPROVED_EMAILS];
};

/**
 * Get all approved domains (admin function)
 */
export const getApprovedDomains = () => {
  return [...APPROVED_DOMAINS];
};
