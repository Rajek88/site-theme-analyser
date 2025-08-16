// Update the console code with the actual origin URL
document.addEventListener("DOMContentLoaded", function () {
  const consoleCode = document.getElementById("consoleCode");
  if (consoleCode) {
    const actualUrl =
      window.location.href.replace(/\/[^\/]*$/, "") +
      "/website_analyzer.js";
    // Find the specific span containing the URL placeholder
    const placeholderSpan = consoleCode.querySelector(
      ".js-url-placeholder"
    );
    if (placeholderSpan) {
      placeholderSpan.textContent = "'" + actualUrl + "'";
    }
  }
});

// Function to copy code to clipboard
function copyCodeToClipboard() {
  const consoleCode = document.getElementById("consoleCode");
  const copyBtn = document.getElementById("copyCodeBtn");

  if (!consoleCode) return;

  // Get the plain text content (without HTML tags)
  const codeText = consoleCode.textContent || consoleCode.innerText;

  // Try to use the modern clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(codeText)
      .then(() => {
        // Show success feedback
        copyBtn.innerHTML = '<i data-lucide="check" class="copy-icon"></i> Copied!';
        copyBtn.classList.add("copied");

        // Reset button after 2 seconds
        setTimeout(() => {
          copyBtn.innerHTML = '<i data-lucide="clipboard" class="copy-icon"></i> Copy Code';
          copyBtn.classList.remove("copied");
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }, 2000);
        
        // Re-initialize icons
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        fallbackCopyTextToClipboard(codeText, copyBtn);
      });
  } else {
    // Fallback for older browsers
    fallbackCopyTextToClipboard(codeText, copyBtn);
  }
}

// Fallback copy method for older browsers
function fallbackCopyTextToClipboard(text, button) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");
    if (successful) {
      button.innerHTML = '<i data-lucide="check" class="copy-icon"></i> Copied!';
      button.classList.add("copied");

      setTimeout(() => {
        button.innerHTML = '<i data-lucide="clipboard" class="copy-icon"></i> Copy Code';
        button.classList.remove("copied");
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }, 2000);
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } else {
      button.textContent = "❌ Failed";
      button.style.background = "#dc3545";

      setTimeout(() => {
        button.textContent = "📋 Copy Code";
        button.style.background = "#007bff";
      }, 2000);
    }
  } catch (err) {
    console.error("Fallback copy failed: ", err);
    button.textContent = "❌ Failed";
    button.style.background = "#dc3545";

    setTimeout(() => {
      button.textContent = "📋 Copy Code";
      button.style.background = "#007bff";
    }, 2000);
  }

  document.body.removeChild(textArea);
}

// Enhanced analyzeByURL function
async function analyzeByURL() {
  const urlInput = document.getElementById("urlInput");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const resultsSection = document.getElementById("resultsSection");
  const iframePlaceholder = document.getElementById("iframePlaceholder");
  const analysisIframe = document.getElementById("analysisIframe");
  const progressSection = document.getElementById("progressSection");
  const progressStatus = document.getElementById("progressStatus");
  const progressFill = document.getElementById("progressFill");
  const progressPercentage = document.getElementById("progressPercentage");
  const progressSteps = document.getElementById("progressSteps");

  const url = urlInput.value.trim();

  if (!url) {
    alert("Please enter a valid URL");
    return;
  }

  // Clear previous results and show progress immediately
  resultsSection.style.display = "none"; // Hide results initially
  progressSection.style.display = "block"; // Show progress section
  progressSteps.innerHTML = "";

  // Reset progress
  updateProgress(0, "Initializing analysis...");

  // Create all progress steps upfront and show them
  createModernProgressSteps();
  
  // Update first step to current immediately
  updateModernProgressStep(1, "current", "Starting analysis...", "Preparing to analyze website");

  // Update button state
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';

  // Always show iframe for visual comparison
  iframePlaceholder.style.display = "none";
  analysisIframe.style.display = "block";
  // Add cache-busting parameter to ensure fresh content
  const separator = url.includes('?') ? '&' : '?';
  analysisIframe.src = url + separator + '_cacheBust=' + Date.now();

  try {
    let results;

    // Check if it's the current page or external URL
    const currentUrl = window.location.href;
    const isCurrentPage =
      url === currentUrl ||
      url === currentUrl.replace(/\/$/, "") ||
      currentUrl.replace(/\/$/, "") === url;

    // Mark first step as completed and move to second
    updateProgressStep(1, "Analysis started", "completed");
    updateProgressStep(2, "Detecting page type...", "current");
    
    // Small delay to show progress update
    await new Promise(resolve => setTimeout(resolve, 500));

    if (isCurrentPage) {
      // Analyze current page directly
      console.log("Analyzing current page...");
      updateProgressStep(2, "Current page detected", "completed");
      updateProgressStep(3, "Extracting colors and fonts...", "current");
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 300));
      
      results = analyzeWebsiteColors();
      updateProgressStep(3, "Analysis complete", "completed");
    } else {
      // Analyze external URL in background
      console.log("Analyzing external URL:", url);
      updateProgressStep(2, "External URL detected", "completed");
      updateProgressStep(3, "Background analysis in progress...", "current");
      
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500));
      
      results = await analyzeWebsiteByURL(url);
      updateProgressStep(3, "Background analysis complete", "completed");
    }

    // Save URL to history if it's not the current page
    if (!isCurrentPage) {
      saveUrlToHistory(url);
    }

    updateProgressStep(4, "Processing results...", "current");
    
    // Small delay to show processing step
    await new Promise(resolve => setTimeout(resolve, 300));

    // Process and display results
    updateProgress(80, "Processing results...");
    updateModernProgressStep(4, "current", "Data Processing", "Organizing analysis results");
    
    // Small delay to show processing step
    await new Promise(resolve => setTimeout(resolve, 300));
    
    updateProgress(100, "Analysis completed successfully");
    updateModernProgressStep(4, "completed");
    updateModernProgressStep(5, "completed", "Results Ready", "Analysis completed successfully");
    
    // Display results after a brief delay
    setTimeout(() => {
      displayResults(results);
      resultsSection.style.display = "block";
      progressSection.style.display = "none";
    }, 800);
  } catch (error) {
    console.error("Analysis error:", error);
    
    // Update progress to show error
    updateProgress(0, "Analysis failed");
    
    // Find current step and mark as error
    const currentStep = document.querySelector('.progress-step-modern.current');
    if (currentStep) {
      const stepNum = parseInt(currentStep.dataset.stepNumber);
      updateModernProgressStep(stepNum, "error", "Analysis Failed", error.message);
    } else {
      updateModernProgressStep(5, "error", "Analysis Failed", error.message);
    }
    
    // Show error in results section
    setTimeout(() => {
      displayError("Failed to analyze website: " + error.message);
      resultsSection.style.display = "block";
      progressSection.style.display = "none";
    }, 1000);
  } finally {
    // Reset button state
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<i data-lucide="search" class="button-icon"></i> Analyze Website';
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

// Enhanced displayResults function
function displayResults(results) {
  const resultsSection = document.getElementById("resultsSection");
  const resultsGrid = document.getElementById("resultsGrid");

  // Always show the results section
  resultsSection.style.display = "block";

  if (results.error) {
    displayError(results.error);
    return;
  }

  // Debug: Log the actual results structure
  console.log("Raw results:", results);
  console.log("Results type:", typeof results);
  console.log("Results keys:", Object.keys(results || {}));

  // Check if results is valid
  if (!results || typeof results !== "object") {
    displayError("Invalid results received from analyzer");
    return;
  }

  // Map the results to the expected structure with fallbacks
  const resultItems = [
    {
      label: "Background Color",
      value: results.background_color || "Not detected",
      type: "color",
    },
    {
      label: "Primary Font Color",
      value: results.primary_color_font || "Not detected",
      type: "color",
    },
    {
      label: "Primary Button Color",
      value: results.primary_color_button || "Not detected",
      type: "color",
    },
    {
      label: "Secondary Font Color",
      value: results.secondary_color_font || "Not detected",
      type: "color",
    },
    {
      label: "Secondary Button Color",
      value: results.secondary_color_button || "Not detected",
      type: "color",
    },
    {
      label: "Website Font",
      value: results.font || "Not detected",
      type: "font",
    },
  ];

  // Add timestamp if available
  if (results.analysis_timestamp) {
    resultItems.push({
      label: "Analysis Time",
      value: new Date(results.analysis_timestamp).toLocaleString(),
      type: "info",
    });
  }

  resultsGrid.innerHTML = resultItems
    .map(
      (item) => `
      <div class="result-item">
        <div class="result-label">${item.label}</div>
        <div class="result-value">
          ${
            item.type === "color" && item.value !== "Not detected"
              ? `<span class="color-preview" style="background: ${item.value}"></span>`
              : ""
          }
          <span>${item.value}</span>
        </div>
      </div>
    `
    )
    .join("");
}

// Enhanced displayError function
function displayError(message) {
  const resultsSection = document.getElementById("resultsSection");
  const resultsGrid = document.getElementById("resultsGrid");

  resultsSection.style.display = "block";
  resultsGrid.innerHTML = `
    <div class="error-state">
      <div style="font-size: 2rem; margin-bottom: 16px;">❌</div>
      <div style="font-weight: 600; margin-bottom: 8px;">Analysis Failed</div>
      <div>${message}</div>
    </div>
  `;
}

// Function to add a new progress step
function addProgressStep(message, status = "pending") {
  const progressSteps = document.getElementById("progressSteps");

  // Create step element
  const newStep = document.createElement("div");
  newStep.className = `progress-step ${status}`;

  // Create step number
  const stepNumber = document.createElement("div");
  stepNumber.className = "step-number";
  stepNumber.textContent = progressSteps.children.length + 1;

  // Create step text
  const stepText = document.createElement("div");
  stepText.className = "step-text";
  stepText.textContent = message;

  // Add icon for completed steps
  if (status === "completed") {
    stepNumber.innerHTML = "✓";
  }

  // Assemble step
  newStep.appendChild(stepNumber);
  newStep.appendChild(stepText);

  // Add to progress bar
  progressSteps.appendChild(newStep);

  // Update all step numbers
  updateStepNumbers();

  // Auto-scroll to show latest step
  progressSteps.scrollLeft = progressSteps.scrollWidth;
}

// Function to update step numbers
function updateStepNumbers() {
  const steps = document.querySelectorAll(".progress-step");
  steps.forEach((step, index) => {
    const stepNumber = step.querySelector(".step-number");
    if (stepNumber) {
      stepNumber.textContent = index + 1;
    }
  });
}

// Function to show URL history dropdown
function showUrlHistory() {
  const urlInput = document.getElementById("urlInput");
  const urlHistoryDropdown =
    document.getElementById("urlHistoryDropdown");

  // Get history from localStorage
  const history = JSON.parse(
    localStorage.getItem("websiteAnalyzerHistory") || "[]"
  );

  if (history.length === 0) {
    // No history to show
    return;
  }

  // Clear previous history
  urlHistoryDropdown.innerHTML = "";

  // Populate dropdown with history
  history.forEach((item, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "url-history-item";
    historyItem.innerHTML = `
      <div class="url-text">${item.url}</div>
      <div class="url-date">Analyzed: ${new Date(
        item.timestamp
      ).toLocaleDateString()}</div>
    `;

    historyItem.onclick = () => {
      urlInput.value = item.url;
      urlHistoryDropdown.style.display = "none";
      // Optionally auto-analyze the selected URL
      // analyzeByURL();
    };

    urlHistoryDropdown.appendChild(historyItem);
  });

  urlHistoryDropdown.style.display = "block";
}

// Function to save URL to history
function saveUrlToHistory(url) {
  try {
    const history = JSON.parse(
      localStorage.getItem("websiteAnalyzerHistory") || "[]"
    );

    // Remove if already exists (to avoid duplicates)
    const existingIndex = history.findIndex((item) => item.url === url);
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    // Add to beginning of array
    history.unshift({
      url: url,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 10 URLs
    if (history.length > 10) {
      history.splice(10);
    }

    localStorage.setItem(
      "websiteAnalyzerHistory",
      JSON.stringify(history)
    );
  } catch (error) {
    console.error("Failed to save URL to history:", error);
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  const urlInput = document.getElementById("urlInput");
  const urlHistoryDropdown =
    document.getElementById("urlHistoryDropdown");

  if (
    !urlInput.contains(event.target) &&
    !urlHistoryDropdown.contains(event.target)
  ) {
    urlHistoryDropdown.style.display = "none";
  }
});

// Function to create all progress steps upfront
function createProgressSteps() {
  const progressSteps = document.getElementById("progressSteps");
  progressSteps.innerHTML = "";

  const steps = [
    "Starting analysis...",
    "Detecting page type...",
    "Running analysis...",
    "Processing results...",
    "Displaying results...",
  ];

  steps.forEach((stepText, index) => {
    const step = document.createElement("div");
    step.className = "progress-step pending";
    step.dataset.stepNumber = index + 1;

    const stepNumber = document.createElement("div");
    stepNumber.className = "step-number";
    stepNumber.textContent = index + 1;

    const stepTextDiv = document.createElement("div");
    stepTextDiv.className = "step-text";
    stepTextDiv.textContent = stepText;

    step.appendChild(stepNumber);
    step.appendChild(stepTextDiv);
    progressSteps.appendChild(step);
  });
}

// Function to update progress bar and status
function updateProgress(percentage, status) {
  const progressFill = document.getElementById("progressFill");
  const progressPercentage = document.getElementById("progressPercentage");
  const progressStatus = document.getElementById("progressStatus");
  
  if (progressFill) {
    progressFill.style.width = percentage + "%";
  }
  if (progressPercentage) {
    progressPercentage.textContent = Math.round(percentage) + "%";
  }
  if (progressStatus) {
    progressStatus.textContent = status;
  }
}

// Function to create modern progress steps
function createModernProgressSteps() {
  const progressSteps = document.getElementById("progressSteps");
  if (!progressSteps) return;
  
  progressSteps.innerHTML = "";

  const steps = [
    { title: "Initialization", description: "Setting up analysis environment" },
    { title: "Page Detection", description: "Identifying page type and source" },
    { title: "Content Analysis", description: "Extracting colors and typography" },
    { title: "Data Processing", description: "Processing and organizing results" },
    { title: "Results Ready", description: "Analysis completed successfully" }
  ];

  steps.forEach((step, index) => {
    const stepElement = document.createElement("div");
    stepElement.className = "progress-step-modern pending";
    stepElement.dataset.stepNumber = index + 1;
    
    stepElement.innerHTML = `
      <div class="step-indicator">${index + 1}</div>
      <div class="step-content">
        <div class="step-title">${step.title}</div>
        <div class="step-description">${step.description}</div>
      </div>
    `;
    
    progressSteps.appendChild(stepElement);
  });
}

// Function to update modern progress step
function updateModernProgressStep(stepNumber, status, title, description) {
  const step = document.querySelector(`[data-step-number="${stepNumber}"]`);
  if (!step) return;
  
  // Remove all status classes
  step.classList.remove('pending', 'current', 'completed', 'error');
  step.classList.add(status);
  
  // Update indicator
  const indicator = step.querySelector('.step-indicator');
  if (indicator) {
    if (status === 'completed') {
      indicator.innerHTML = '<i data-lucide="check" style="width: 12px; height: 12px;"></i>';
    } else if (status === 'error') {
      indicator.innerHTML = '<i data-lucide="x" style="width: 12px; height: 12px;"></i>';
    } else {
      indicator.textContent = stepNumber;
    }
  }
  
  // Update content if provided
  if (title) {
    const titleEl = step.querySelector('.step-title');
    if (titleEl) titleEl.textContent = title;
  }
  
  if (description) {
    const descEl = step.querySelector('.step-description');
    if (descEl) descEl.textContent = description;
  }
  
  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Legacy function for compatibility
function updateProgressStep(stepNumber, message, status) {
  const progressMap = {
    1: 20,
    2: 40,
    3: 60,
    4: 80,
    5: 100
  };
  
  const percentage = progressMap[stepNumber] || 0;
  updateProgress(percentage, message);
  updateModernProgressStep(stepNumber, status, message, "");
}

// UI-specific functions for iframe analysis and fallback methods

// Function to analyze website using iframe
function analyzeWebsiteInIframe(url) {
  return new Promise((resolve, reject) => {
    // Create a hidden iframe for silent background analysis
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none'; // Hidden for true headless operation
    // Add cache-busting parameter to ensure fresh content
    const separator = url.includes('?') ? '&' : '?';
    iframe.src = url + separator + '_cacheBust=' + Date.now();
    
    // Add iframe to page
    document.body.appendChild(iframe);
    
    // Set timeout for iframe loading
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Website analysis timed out'));
    }, 15000); // 15 second timeout
    
    // Function to clean up iframe
    function cleanup() {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      clearTimeout(timeout);
    }
    
    // Handle iframe load
    iframe.onload = function() {
      try {
        // Try to access iframe content
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Inject our analyzer code into the iframe
        const script = iframeDoc.createElement('script');
        script.textContent = `
          // Website Analyzer Code
          ${WebsiteAnalyzer.toString()}
          ${analyzeWebsiteColors.toString()}
          
          // Run analysis and send result back
          try {
            const results = analyzeWebsiteColors();
            window.parent.postMessage({
              type: 'ANALYSIS_RESULT',
              results: results
            }, '*');
          } catch (error) {
            window.parent.postMessage({
              type: 'ANALYSIS_ERROR',
              error: error.message
            }, '*');
          }
        `;
        
        iframeDoc.head.appendChild(script);
        
      } catch (error) {
        // If we can't access iframe content due to CORS, try alternative method
        console.log('Iframe access blocked, trying alternative method...');
        tryAlternativeMethod();
      }
    };
    
    // Handle iframe errors
    iframe.onerror = function() {
      cleanup();
      reject(new Error('Failed to load website'));
    };
    
    // Alternative method using postMessage
    function tryAlternativeMethod() {
      // Send message to iframe with analyzer code
      iframe.contentWindow.postMessage({
        type: 'ANALYZE_WEBSITE',
        analyzerCode: WebsiteAnalyzer.toString() + '\n' + analyzeWebsiteColors.toString()
      }, '*');
      
      // Listen for response
      const messageHandler = function(event) {
        if (event.source === iframe.contentWindow) {
          if (event.data.type === 'ANALYSIS_RESULT') {
            window.removeEventListener('message', messageHandler);
            cleanup();
            resolve(event.data.results);
          } else if (event.data.type === 'ANALYSIS_ERROR') {
            window.removeEventListener('message', messageHandler);
            cleanup();
            reject(new Error(event.data.error));
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Set timeout for message response
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        cleanup();
        // In headless mode, we don't fall back to new tabs
        resolve({ fallback: true, message: 'CORS restrictions prevent background analysis.' });
      }, 5000);
    }
    
    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
      if (event.source === iframe.contentWindow) {
        if (event.data.type === 'ANALYSIS_RESULT') {
          cleanup();
          resolve(event.data.results);
        } else if (event.data.type === 'ANALYSIS_ERROR') {
          cleanup();
          reject(new Error(event.data.error));
        }
      }
    });
  });
}

// Function to analyze website using visible iframe (non-headless mode)
function analyzeWebsiteInVisibleIframe(url) {
  return new Promise((resolve, reject) => {
    // Show the iframe container
    const iframeContainer = document.getElementById('iframeContainer');
    const iframe = document.getElementById('analysisIframe');
    const iframeStatus = document.getElementById('iframeStatus');
    
    if (!iframeContainer || !iframe) {
      reject(new Error('Iframe components not found'));
      return;
    }
    
    // Show iframe container and update status
    if (iframeContainer) iframeContainer.style.display = 'block';
    if (iframeStatus) {
      iframeStatus.textContent = 'Loading website...';
      iframeStatus.style.color = '#007bff';
    }
    
    // Set iframe source with cache-busting
    const separator = url.includes('?') ? '&' : '?';
    iframe.src = url + separator + '_cacheBust=' + Date.now();
    
    // Set timeout for iframe loading
    const timeout = setTimeout(() => {
      if (iframeStatus) {
        iframeStatus.textContent = 'Analysis timed out';
        iframeStatus.style.color = '#dc3545';
      }
      reject(new Error('Website analysis timed out'));
    }, 15000); // 15 second timeout
    
    // Function to clean up iframe
    function cleanup() {
      clearTimeout(timeout);
      if (iframeStatus) {
        iframeStatus.textContent = 'Analysis completed';
        iframeStatus.style.color = '#28a745';
      }
    }
    
    // Handle iframe load
    iframe.onload = function() {
      if (iframeStatus) {
        iframeStatus.textContent = 'Running analysis...';
        iframeStatus.style.color = '#ffc107';
      }
      
      try {
        // Try to access iframe content
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
        // Inject our analyzer code into the iframe
        const script = iframeDoc.createElement('script');
        script.textContent = `
          // Website Analyzer Code
          ${WebsiteAnalyzer.toString()}
          ${analyzeWebsiteColors.toString()}
          
          // Run analysis and send result back
          try {
            const results = analyzeWebsiteColors();
            window.parent.postMessage({
              type: 'ANALYSIS_RESULT',
              results: results
            }, '*');
          } catch (error) {
            window.parent.postMessage({
              type: 'ANALYSIS_ERROR',
              error: error.message
            }, '*');
          }
        `;
        
        iframeDoc.head.appendChild(script);
        
      } catch (error) {
        // If we can't access iframe content due to CORS, try alternative method
        console.log('Iframe access blocked, trying alternative method...');
        if (iframeStatus) {
          iframeStatus.textContent = 'CORS blocked, trying alternative method...';
          iframeStatus.style.color = '#ffc107';
        }
        tryAlternativeMethod();
      }
    };
    
    // Handle iframe errors
    iframe.onerror = function() {
      if (iframeStatus) {
        iframeStatus.textContent = 'Failed to load website';
        iframeStatus.style.color = '#dc3545';
      }
      cleanup();
      reject(new Error('Failed to load website'));
    };
    
    // Alternative method using postMessage
    function tryAlternativeMethod() {
      // Send message to iframe with analyzer code
      iframe.contentWindow.postMessage({
        type: 'ANALYZE_WEBSITE',
        analyzerCode: WebsiteAnalyzer.toString() + '\n' + analyzeWebsiteColors.toString()
      }, '*');
      
      // Listen for response
      const messageHandler = function(event) {
        if (event.source === iframe.contentWindow) {
          if (event.data.type === 'ANALYSIS_RESULT') {
            window.removeEventListener('message', messageHandler);
            cleanup();
            resolve(event.data.results);
          } else if (event.data.type === 'ANALYSIS_ERROR') {
            window.removeEventListener('message', messageHandler);
            cleanup();
            reject(new Error(event.data.error));
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Set timeout for message response
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        cleanup();
        reject(new Error('Alternative method also failed due to CORS restrictions'));
      }, 5000);
    }
    
    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
      if (event.source === iframe.contentWindow) {
        if (event.data.type === 'ANALYSIS_RESULT') {
          cleanup();
          resolve(event.data.results);
        } else if (event.data.type === 'ANALYSIS_ERROR') {
          cleanup();
          reject(new Error(event.data.error));
        }
      }
    });
  });
}

// Function to try all fallback methods (headless mode)
async function tryFallbackMethods(url) {
  console.log('Trying comprehensive fallback methods...');
  
  // Method 1: Try CORS proxy
  try {
    console.log('Trying CORS proxy method...');
    const results = await tryCorsProxy(url);
    if (results) {
      displayResults(results);
      return;
    }
  } catch (error) {
    console.log('CORS proxy failed:', error.message);
  }
  
  // Method 2: Try fetch with different modes
  try {
    console.log('Trying fetch with different modes...');
    const results = await tryFetchMethods(url);
    if (results) {
      displayResults(results);
      return;
    }
  } catch (error) {
    console.log('Fetch methods failed:', error.message);
  }
  
  // Method 3: Try iframe with different sandbox settings
  try {
    console.log('Trying iframe with different sandbox settings...');
    const results = await tryIframeSandboxVariations(url);
    if (results) {
      displayResults(results);
      return;
    }
  } catch (error) {
    console.log('Iframe sandbox variations failed:', error.message);
  }
  
  // Method 4: Final fallback - open in new tab with instructions
  console.log('All fallback methods failed, opening new tab with instructions...');
  openInNewTabWithInstructions(url);
}

// Method 1: CORS Proxy
async function tryCorsProxy(url) {
  try {
    const corsProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(corsProxyUrl);
    
    if (response.ok) {
      const data = await response.json();
      if (data.contents) {
        return analyzeHTMLContent(data.contents, url);
      }
    }
  } catch (error) {
    console.log('CORS proxy error:', error.message);
  }
  
  // Try alternative proxy
  try {
    const corsProxyUrl2 = `https://cors-anywhere.herokuapp.com/${url}`;
    const response = await fetch(corsProxyUrl2);
    
    if (response.ok) {
      const html = await response.text();
      return analyzeHTMLContent(html, url);
    }
  } catch (error) {
    console.log('Alternative CORS proxy error:', error.message);
  }
  
  return null;
}

// Method 2: Fetch with different modes
async function tryFetchMethods(url) {
  const fetchOptions = [
    { mode: 'cors', cache: 'no-cache' },
    { mode: 'no-cors', cache: 'no-cache' },
    { credentials: 'omit', cache: 'no-cache' },
    { 
      cache: 'no-cache',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      } 
    }
  ];
  
  for (const options of fetchOptions) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        const html = await response.text();
        return analyzeHTMLContent(html, url);
      }
    } catch (error) {
      console.log(`Fetch with options ${JSON.stringify(options)} failed:`, error.message);
    }
  }
  
  return null;
}

// Method 3: Iframe with different sandbox settings
async function tryIframeSandboxVariations(url) {
  const sandboxOptions = [
    'allow-scripts allow-same-origin',
    'allow-scripts allow-same-origin allow-forms',
    'allow-scripts allow-same-origin allow-forms allow-popups',
    'allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation'
  ];
  
  for (const sandbox of sandboxOptions) {
    try {
      const results = await tryIframeWithSandbox(url, sandbox);
      if (results) {
        return results;
      }
    } catch (error) {
      console.log(`Iframe with sandbox "${sandbox}" failed:`, error.message);
    }
  }
  
  return null;
}

// Helper function for iframe sandbox variations
function tryIframeWithSandbox(url, sandbox) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.sandbox = sandbox;
    // Add cache-busting parameter
    const separator = url.includes('?') ? '&' : '?';
    iframe.src = url + separator + '_cacheBust=' + Date.now();
    
    document.body.appendChild(iframe);
    
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Sandbox iframe timeout'));
    }, 10000);
    
    function cleanup() {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      clearTimeout(timeout);
    }
    
    iframe.onload = function() {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const script = iframeDoc.createElement('script');
        script.textContent = `
          ${WebsiteAnalyzer.toString()}
          ${analyzeWebsiteColors.toString()}
          
          try {
            const results = analyzeWebsiteColors();
            window.parent.postMessage({
              type: 'ANALYSIS_RESULT',
              results: results
            }, '*');
          } catch (error) {
            window.parent.postMessage({
              type: 'ANALYSIS_ERROR',
              error: error.message
            }, '*');
          }
        `;
        
        iframeDoc.head.appendChild(script);
        
        // Listen for response
        const messageHandler = function(event) {
          if (event.source === iframe.contentWindow) {
            if (event.data.type === 'ANALYSIS_RESULT') {
              window.removeEventListener('message', messageHandler);
              cleanup();
              resolve(event.data.results);
            } else if (event.data.type === 'ANALYSIS_ERROR') {
              window.removeEventListener('message', messageHandler);
              cleanup();
              reject(new Error(event.data.error));
            }
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          cleanup();
          reject(new Error('Sandbox iframe message timeout'));
        }, 8000);
        
      } catch (error) {
        cleanup();
        reject(error);
      }
    };
    
    iframe.onerror = function() {
      cleanup();
      reject(new Error('Sandbox iframe load error'));
    };
  });
}

// Fallback method: Open in new tab with instructions
function openInNewTabWithInstructions(url) {
  try {
    // Force popup blocker check
    const newTab = window.open(url, '_blank', 'noopener,noreferrer');
    
    if (newTab && !newTab.closed) {
      // Successfully opened new tab
      console.log('New tab opened successfully');
      
      // Show instructions for manual analysis
      const resultsDiv = document.getElementById("resultsGrid");
      if (resultsDiv) {
        resultsDiv.innerHTML = `
          <div class="info-box" style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px;">
            <h3>🌐 Site Opened in New Tab</h3>
            <p><strong>✅ Success!</strong> The website has been opened in a new tab.</p>
            <p><strong>To analyze this website:</strong></p>
            <ol>
              <li>Go to the new tab that just opened</li>
              <li>Open browser console (F12 → Console tab)</li>
              <li>Copy and paste this code:</li>
              <li style="margin: 10px 0;">
                <code style="background: #f8f9fa; padding: 10px; border-radius: 5px; display: block; font-family: monospace; white-space: pre-wrap;">
// Load the analyzer
const script = document.createElement('script');
script.src = '${window.location.origin}/website_analyzer.js';
script.onload = function() {
    const results = analyzeWebsiteColors();
    console.log('🎨 Analysis Results:', results);
    console.log('📋 JSON Output:', JSON.stringify(results, null, 2));
};
document.head.appendChild(script);
                </code>
              </li>
              <li>Press Enter to run the analysis</li>
              <li>Copy the results from the console</li>
            </ol>
            <p><strong>Note:</strong> This method works on ANY website since it runs directly in the target site's context!</p>
          </div>
        `;
      }
    } else {
      // Popup blocked or failed to open
      console.log('Failed to open new tab - popup blocked or error occurred');
      displayError(`
        <strong>❌ Failed to open new tab</strong><br><br>
        <strong>Possible reasons:</strong><br>
        • Popup blocker is enabled<br>
        • Browser security settings<br>
        • Network restrictions<br><br>
        <strong>Alternative solution:</strong><br>
        1. Copy this URL: <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 3px;">${url}</code><br>
        2. Open a new tab manually<br>
        3. Paste the URL and navigate<br>
        4. Follow the console analysis steps above
      `);
    }
  } catch (error) {
    console.error('Error opening new tab:', error);
    displayError(`Failed to open new tab: ${error.message}`);
  }
}
