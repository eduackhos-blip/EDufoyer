/**
 * Screen Recording Detection and Prevention Utility
 * Detects and warns about screen recording attempts
 */

/**
 * Detect if browser is attempting screen capture
 * @returns {boolean} True if screen capture is detected
 */
export function detectScreenCapture() {
  // Check for MediaStreamTrack API usage (screen sharing)
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    // This API exists, but we can't prevent it completely
    // We'll detect when it's being used
    return true;
  }
  return false;
}

/**
 * Detect screen recording through various methods
 * @returns {Object} Detection results
 */
export function detectRecordingAttempts() {
  const detection = {
    isRecording: false,
    methods: [],
    warnings: []
  };

  // Method 1: Skip getDisplayMedia interception - it's needed for legitimate screen sharing
  // getDisplayMedia is used by LiveKit for screen sharing, so we don't treat it as recording
  // We only detect external recording tools, not legitimate screen sharing

  // Method 2: Check for DevTools (common for recording)
  const devtools = {
    open: false,
    orientation: null
  };
  
  setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if (widthThreshold || heightThreshold) {
      if (!devtools.open) {
        devtools.open = true;
        detection.isRecording = true;
        detection.methods.push('DevTools');
        detection.warnings.push('Developer Tools detected');
      }
    } else {
      devtools.open = false;
    }
  }, 500);

  // Method 3: Detect console access (indicates DevTools)
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };

  // Method 4: Detect iframe access (some recording tools use iframes)
  if (window.self !== window.top) {
    detection.isRecording = true;
    detection.methods.push('iframe');
    detection.warnings.push('Page loaded in iframe');
  }

  // Method 5: Detect context menu disabling attempts (some recorders disable right-click)
  document.addEventListener('contextmenu', (e) => {
    // Some recording tools manipulate context menu
    if (e.isTrusted === false) {
      detection.isRecording = true;
      detection.methods.push('contextMenu');
    }
  }, true);

  return detection;
}

/**
 * Check if page visibility changes (indicates tab switching or recording)
 */
export function detectVisibilityChanges(callback) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Tab is hidden - might be recording
      callback({
        type: 'visibility',
        message: 'Tab visibility changed - recording may be active'
      });
    }
  });

  // Also detect blur events
  window.addEventListener('blur', () => {
    callback({
      type: 'blur',
      message: 'Window lost focus - recording may be active'
    });
  });
}

/**
 * Get user-friendly warning message
 * @param {Array} methods - Detected recording methods
 * @returns {string} Warning message
 */
export function getRecordingWarningMessage(methods = []) {
  const messages = [
    'Screen recording is not allowed in this session. Please stop recording.',
    'Recording detected. This session is private and cannot be recorded.',
    'Unauthorized recording detected. Please disable screen recording.',
    'Screen capture is not permitted. Please stop any recording software.'
  ];
  
  if (methods.length > 0) {
    return `Recording detected via ${methods.join(', ')}. Please stop recording.`;
  }
  
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Add visual indicators to discourage recording
 */
export function addAntiRecordingIndicators() {
  // Add CSS to prevent easy screenshot
  const style = document.createElement('style');
  style.textContent = `
    /* Prevent right-click context menu */
    video, [data-lk-video] {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      pointer-events: auto;
    }
    
    /* Disable text selection */
    [data-lk-theme] {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    
    /* Prevent drag */
    video, [data-lk-video] {
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
      user-drag: none;
    }
  `;
  document.head.appendChild(style);

  // Disable right-click on video elements
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'VIDEO' || e.target.closest('video')) {
      e.preventDefault();
      return false;
    }
  }, true);

  // Disable common keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Disable Print Screen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    
    // Disable F12 (DevTools)
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    
    // Disable Ctrl+Shift+C (Element Inspector)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }
  }, true);
}

