/**
 * Profanity Filter for Chat Messages
 * Filters abusive language in both Hindi and English
 */

// Common abusive words in English
const englishBadWords = [
  'fuck', 'fucking', 'fucked', 'fucker',
  'shit', 'shitting', 'shitty',
  'damn', 'damned', 'dammit',
  'bitch', 'bitches', 'bitching',
  'ass', 'asses', 'asshole', 'assholes',
  'bastard', 'bastards',
  'piss', 'pissing', 'pissed',
  'crap', 'crappy',
  'hell', 'hells',
  'idiot', 'idiots', 'idiotic',
  'stupid', 'stupidity',
  'dumb', 'dumber', 'dumbest',
  'moron', 'moronic',
  'retard', 'retarded',
  'hate', 'hated', 'hating',
  'kill', 'killing', 'killed',
  'die', 'died', 'dying',
  'damn', 'damned'
];

// Common abusive words in Hindi (transliterated)
const hindiBadWords = [
  'madarchod', 'madarchod', 'maderchod',
  'behenchod', 'behenchoda', 'behenchod',
  'chutiya', 'chutiyapa', 'chutiye',
  'gaand', 'gand', 'gaandu', 'gandu',
  'lund', 'loda', 'lode',
  'bhosdi', 'bhosdike', 'bhosdika',
  'harami', 'haramkhor', 'haramkhor',
  'kutta', 'kutti', 'kutte',
  'sala', 'saale', 'sali',
  'randi', 'rand', 'randi',
  'chakke', 'chakka',
  'bhenchod', 'bhenchoda',
  'machod', 'machod',
  'teri maa', 'teri maa ki',
  'maa chod', 'maa ka',
  'behen ka',
  'bhosda',
  'gandu',
  'loda',
  'chutiya'
];

// Common variations and attempts to bypass filters
const variations = [
  // Replace vowels with numbers/symbols
  /[a@]ss/i,
  /f[u@]ck/i,
  /sh[i1]t/i,
  /b[i1]tch/i,
  /d[i1]ck/i,
  /p[i1]ss/i,
  // Repeated characters
  /f+u+c+k+/i,
  /s+h+i+t+/i,
  /b+i+t+c+h+/i,
  // Spaces between letters
  /f\s*u\s*c\s*k/i,
  /s\s*h\s*i\s*t/i
];

/**
 * Normalize text by removing special characters and converting to lowercase
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  // Convert to lowercase
  let normalized = text.toLowerCase();
  
  // Remove special characters but keep spaces and basic punctuation
  normalized = normalized.replace(/[^\w\s]/g, '');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized.trim();
}

/**
 * Check if text contains abusive words
 * @param {string} text - Text to check
 * @returns {boolean} True if abusive language detected
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  
  const normalized = normalizeText(text);
  const lowerText = text.toLowerCase();
  
  // Check English abusive words
  for (const word of englishBadWords) {
    // Exact word match or word boundary match
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized) || regex.test(lowerText)) {
      return true;
    }
  }
  
  // Check Hindi abusive words (transliterated)
  for (const word of hindiBadWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized) || regex.test(lowerText)) {
      return true;
    }
  }
  
  // Check common variations
  for (const pattern of variations) {
    if (pattern.test(text)) {
      return true;
    }
  }
  
  // Check for repeated characters (common bypass technique)
  const repeatedPattern = /(.)\1{4,}/; // Same character 5+ times
  if (repeatedPattern.test(normalized)) {
    // Allow if it's a legitimate word (like "hello" with repeated letters)
    const commonWords = ['hello', 'good', 'thank', 'please', 'sorry', 'okay', 'yes', 'no'];
    const words = normalized.split(/\s+/);
    for (const word of words) {
      if (word.length > 10 && !commonWords.some(cw => word.includes(cw))) {
        // Likely an attempt to bypass filter
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Filter abusive words from text (replaces with asterisks)
 * @param {string} text - Text to filter
 * @returns {string} Filtered text
 */
export function filterProfanity(text) {
  if (!text || typeof text !== 'string') return text;
  
  let filtered = text;
  const normalized = normalizeText(text);
  const words = text.split(/\s+/);
  
  // Replace abusive words with asterisks
  const allBadWords = [...englishBadWords, ...hindiBadWords];
  
  for (const word of allBadWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  }
  
  return filtered;
}

/**
 * Get a user-friendly error message
 * @returns {string} Error message
 */
export function getProfanityErrorMessage() {
  const messages = [
    'Please use respectful language in the chat.',
    'Abusive language is not allowed. Please rephrase your message.',
    'Your message contains inappropriate content. Please use respectful language.',
    'Please maintain a professional and respectful tone in the chat.'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

