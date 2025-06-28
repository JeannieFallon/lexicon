// Application state and configuration
const CONFIG = {
  API_URL: 'http://localhost:11434/api/chat',
  MODEL: 'codellama',
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3
};

const STATE = {
  isLoading: false,
  abortController: null
};

// DOM element references (cached for performance)
const elements = {
  sendButton: null,
  promptTextarea: null,
  responseElement: null,
  form: null
};

// Initialize the application
function initializeApp() {
  // Cache DOM elements
  elements.sendButton = document.getElementById('send');
  elements.promptTextarea = document.getElementById('prompt');
  elements.responseElement = document.getElementById('response');
  elements.form = document.querySelector('form');

  // Validate required elements exist
  if (!elements.sendButton || !elements.promptTextarea || !elements.responseElement) {
    console.error('Required DOM elements not found');
    return;
  }

  // Add event listeners
  elements.sendButton.addEventListener('click', handleSendClick);
  elements.promptTextarea.addEventListener('keydown', handleTextareaKeydown);
  
  // Handle form submission if form exists
  if (elements.form) {
    elements.form.addEventListener('submit', handleFormSubmit);
  }

  // Set initial focus
  elements.promptTextarea.focus();
}

// Handle form submission
function handleFormSubmit(event) {
  event.preventDefault();
  handleSendClick();
}

// Enhanced keyboard handling for textarea
function handleTextareaKeydown(event) {
  // Enter key behavior
  if (event.key === 'Enter') {
    // Shift+Enter: Insert new line (default behavior)
    if (event.shiftKey) {
      return; // Let the default behavior happen (new line)
    }
    
    // Ctrl/Cmd+Enter: Force send (same as before)
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      handleSendClick();
      return;
    }
    
    // Plain Enter: Auto-submit (new behavior)
    event.preventDefault();
    handleSendClick();
  }
  
  // Escape key: Cancel request if loading, or clear textarea if not
  if (event.key === 'Escape') {
    if (STATE.isLoading) {
      cancelRequest();
    } else {
      elements.promptTextarea.value = '';
    }
  }
}

// Main send handler
async function handleSendClick() {
  if (STATE.isLoading) {
    // Cancel current request
    cancelRequest();
    return;
  }

  const prompt = elements.promptTextarea.value.trim();
  
  if (!prompt) {
    showError('Please enter a prompt.');
    elements.promptTextarea.focus();
    return;
  }

  await sendPrompt(prompt);
}

// Send prompt to API with retry logic
async function sendPrompt(prompt, retryCount = 0) {
  try {
    setLoadingState(true);
    
    // Create new abort controller for this request
    STATE.abortController = new AbortController();
    
    showLoadingMessage();

    const response = await fetchWithTimeout(prompt, STATE.abortController.signal);
    const responseText = await parseResponse(response);
    
    showResponse(responseText);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      showMessage('Request cancelled.');
      return;
    }

    console.error('API Error:', error);
    
    // Retry logic for network errors
    if (retryCount < CONFIG.MAX_RETRIES && isRetryableError(error)) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      showMessage(`Request failed. Retrying in ${delay/1000}s... (Attempt ${retryCount + 1}/${CONFIG.MAX_RETRIES})`);
      
      setTimeout(() => {
        sendPrompt(prompt, retryCount + 1);
      }, delay);
      return;
    }

    showError(getErrorMessage(error));
  } finally {
    setLoadingState(false);
  }
}

// Fetch with timeout and proper error handling
async function fetchWithTimeout(prompt, signal) {
  const timeoutId = setTimeout(() => {
    if (STATE.abortController) {
      STATE.abortController.abort();
    }
  }, CONFIG.TIMEOUT);

  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful coding assistant.' },
          { role: 'user', content: prompt }
        ],
        stream: false
      }),
      signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Parse API response
async function parseResponse(response) {
  const data = await response.json();
  
  if (!data) {
    throw new Error('Empty response from server');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (data.message?.content) {
    return data.message.content.trim();
  }

  throw new Error('Invalid response format from server');
}

// UI State Management
function setLoadingState(loading) {
  STATE.isLoading = loading;
  elements.sendButton.disabled = loading;
  elements.sendButton.textContent = loading ? 'Cancel' : 'Send';
  elements.promptTextarea.disabled = loading;
  
  // Add visual loading state
  if (loading) {
    elements.sendButton.classList.add('loading');
  } else {
    elements.sendButton.classList.remove('loading');
  }
}

function cancelRequest() {
  if (STATE.abortController) {
    STATE.abortController.abort();
    STATE.abortController = null;
  }
  setLoadingState(false);
  showMessage('Request cancelled.');
}

// UI Message Functions
function showLoadingMessage() {
  elements.responseElement.textContent = 'Waiting for response...';
  elements.responseElement.className = 'loading';
}

function showResponse(text) {
  elements.responseElement.textContent = text;
  elements.responseElement.className = 'success';
  
  // Clear prompt on successful response
  elements.promptTextarea.value = '';
  elements.promptTextarea.focus();
}

function showError(message) {
  elements.responseElement.textContent = message;
  elements.responseElement.className = 'error';
}

function showMessage(message) {
  elements.responseElement.textContent = message;
  elements.responseElement.className = 'info';
}

// Utility Functions
function isRetryableError(error) {
  return error.name === 'TypeError' || // Network error
         error.name === 'TimeoutError' ||
         (error.message && error.message.includes('fetch'));
}

function getErrorMessage(error) {
  if (!navigator.onLine) {
    return 'No internet connection. Please check your network.';
  }
  
  if (error.message.includes('Failed to fetch')) {
    return 'Cannot connect to the server. Please ensure the local server is running on port 11434.';
  }
  
  return `Error: ${error.message}`;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (STATE.abortController) {
    STATE.abortController.abort();
  }
});
