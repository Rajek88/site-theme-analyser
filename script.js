// Global variable to track iframe load status
let iframeLoadedSuccessfully = false;

// Helper function to normalize URL - add https if no protocol
function normalizeUrl(url) {
  if (!url) return url;
  
  // Remove whitespace
  url = url.trim();
  
  // If URL already has a protocol, return as is
  if (url.match(/^https?:\/\//i)) {
    return url;
  }
  
  // If URL starts with //, add https:
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  // Otherwise, add https://
  return 'https://' + url;
}

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
  let codeText = consoleCode.textContent || consoleCode.innerText;
  
  // Replace the placeholder with actual website_analyzer.js URL
  const actualUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '/') + 'website_analyzer.js';
  codeText = codeText.replace('REPLACE_WITH_ACTUAL_URL', actualUrl);

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

// New function to start analysis from landing page
function startAnalysis() {
  let url = document.getElementById("urlInput").value.trim();
  
  if (!url) {
    alert("Please enter a valid URL");
    return;
  }
  
  // Normalize the URL (add https if needed)
  url = normalizeUrl(url);
  
  // Update the input field with the normalized URL
  document.getElementById("urlInput").value = url;
  
  // Show the analyzing URL
  const analyzingUrlSpan = document.querySelector("#analyzingUrl span");
  if (analyzingUrlSpan) {
    analyzingUrlSpan.textContent = url;
  }
  
  // Transition from landing page to analysis interface
  const landingPage = document.getElementById("landingPage");
  const analysisInterface = document.getElementById("analysisInterface");
  
  landingPage.style.display = "none";
  analysisInterface.style.display = "block";
  
  // Start the analysis
  analyzeByURL();
}

// Function to go back to landing page
function backToLanding() {
  const landingPage = document.getElementById("landingPage");
  const analysisInterface = document.getElementById("analysisInterface");
  const progressSection = document.getElementById("progressSection");
  const resultsSection = document.getElementById("resultsSection");
  
  // Hide analysis interface and progress/results
  analysisInterface.style.display = "none";
  progressSection.style.display = "none";
  resultsSection.style.display = "none";
  
  // Show landing page
  landingPage.style.display = "block";
  
  // Reset URL input
  document.getElementById("urlInput").value = "";
  
  // Reset iframe
  const iframePlaceholder = document.getElementById("iframePlaceholder");
  const analysisIframe = document.getElementById("analysisIframe");
  if (iframePlaceholder) iframePlaceholder.style.display = "flex";
  if (analysisIframe) analysisIframe.style.display = "none";
}

// Function to rerun analysis
function rerunAnalysis() {
  const rerunBtn = document.getElementById("rerunBtn");
  const progressSection = document.getElementById("progressSection");
  const resultsSection = document.getElementById("resultsSection");
  
  // Disable the rerun button and show loading state
  rerunBtn.disabled = true;
  rerunBtn.classList.add("loading");
  rerunBtn.innerHTML = `
    <i data-lucide="refresh-cw" class="rerun-icon"></i>
    <span>Rerunning...</span>
  `;
  
  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Hide previous results
  resultsSection.style.display = "none";
  
  // Start fresh analysis
  analyzeByURL().finally(() => {
    // Reset button state
    rerunBtn.disabled = false;
    rerunBtn.classList.remove("loading");
    rerunBtn.innerHTML = `
      <i data-lucide="refresh-cw" class="rerun-icon"></i>
      <span>Rerun Analysis</span>
    `;
    
    // Re-initialize icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  });
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

  let url = urlInput.value.trim();
  
  // Normalize the URL (add https if needed)
  url = normalizeUrl(url);
  
  // Update the input field with the normalized URL
  urlInput.value = url;

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
  const isHeroButton = analyzeBtn.classList.contains('hero-analyze-button');
  
  if (isHeroButton) {
    analyzeBtn.innerHTML = `
      <i data-lucide="loader" class="button-icon animate-spin"></i>
      <span>Analyzing...</span>
    `;
  } else {
    analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';
  }
  
  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Always show iframe for visual comparison
  iframePlaceholder.style.display = "none";
  analysisIframe.style.display = "block";
  
  // Add comprehensive error handling for iframe loading
  let iframeTimeout;
  iframeLoadedSuccessfully = true; // Start optimistic - assume it will load
  
  analysisIframe.onload = function() {
    clearTimeout(iframeTimeout);
    console.log("Iframe loaded successfully");
    
    // Always consider iframe as loaded successfully when onload fires
    // Don't try to access iframe content as it may cause cross-origin errors
    iframeLoadedSuccessfully = true;
    console.log('Iframe loaded successfully, setting iframeLoadedSuccessfully =', iframeLoadedSuccessfully);
    
    const analysisPanel = document.querySelector('.analysis-panel');
    if (analysisPanel) {
      analysisPanel.style.display = "block";
    }
    
    // Optional: Try to detect if iframe is actually blocked, but don't fail on errors
    try {
      const iframeDoc = analysisIframe.contentDocument || analysisIframe.contentWindow.document;
      if (iframeDoc && iframeDoc.location.href === 'about:blank') {
        console.log("Iframe might be blocked, but keeping it visible");
      }
    } catch (e) {
      // Cross-origin or other errors are normal - just log and continue
      console.log("Cross-origin iframe (normal behavior):", e.message);
    }
  };
  
  analysisIframe.onerror = function() {
    clearTimeout(iframeTimeout);
    console.log("Iframe failed to load - hiding entire analysis panel");
    iframeLoadedSuccessfully = false;
    // Hide the entire analysis panel
    const analysisPanel = document.querySelector('.analysis-panel');
    if (analysisPanel) {
      analysisPanel.style.display = "none";
    }
  };
  
  // Set a timeout for iframe loading (10 seconds - more lenient)
  iframeTimeout = setTimeout(() => {
    console.log("Iframe loading timeout - but keeping it visible as content might still load");
    // Don't hide the iframe on timeout - some sites are just slow
    // iframeLoadedSuccessfully = false;
    
    // Just log the timeout but keep iframe visible
    console.log("Iframe took longer than 10 seconds to load, but keeping preview visible");
  }, 10000);
  
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
    const isHeroButton = analyzeBtn.classList.contains('hero-analyze-button');
    
    if (isHeroButton) {
      analyzeBtn.innerHTML = `
        <i data-lucide="search" class="button-icon"></i>
        <span>Analyze Website</span>
        <div class="button-shine"></div>
      `;
    } else {
      analyzeBtn.innerHTML = '<i data-lucide="search" class="button-icon"></i> Analyze Website';
    }
    
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
  
  // Ensure analysis panel is visible when showing results (if iframe loaded successfully)
  const analysisPanel = document.querySelector('.analysis-panel');
  console.log('displayResults - analysisPanel:', analysisPanel, 'iframeLoadedSuccessfully:', iframeLoadedSuccessfully);
  
  if (analysisPanel && iframeLoadedSuccessfully) {
    console.log('Forcing analysis panel to be visible');
    analysisPanel.style.display = "block";
    
    // Also make sure the integrated preview is visible
    const integratedPreview = analysisPanel.querySelector('.integrated-preview');
    if (integratedPreview) {
      integratedPreview.style.display = "block";
    }
  }

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
      icon: "square",
      value: results.background_color || "Not detected",
      type: "color",
    },
    {
      label: "Primary Font Color",
      icon: "type",
      value: results.primary_color_font || "Not detected",
      type: "color",
    },
    {
      label: "Primary Button Color",
      icon: "mouse-pointer",
      value: results.primary_color_button || "Not detected",
      type: "color",
    },
    {
      label: "Secondary Font Color",
      icon: "align-left",
      value: results.secondary_color_font || "Not detected",
      type: "color",
    },
    {
      label: "Secondary Button Color",
      icon: "click",
      value: results.secondary_color_button || "Not detected",
      type: "color",
    },
    {
      label: "Website Font",
      icon: "font",
      value: results.font || "Not detected",
      type: "font",
    },
  ];

  // Add timestamp if available
  if (results.analysis_timestamp) {
    resultItems.push({
      label: "Analysis Time",
      icon: "clock",
      value: new Date(results.analysis_timestamp).toLocaleString(),
      type: "info",
    });
  }

  // Reset grid display for normal results
  resultsGrid.style.display = "grid";
  resultsGrid.style.gridTemplateColumns = "";
  
  resultsGrid.innerHTML = resultItems
    .map(
      (item) => `
      <div class="result-item">
        <div class="result-label">
          <i data-lucide="${item.icon}" class="result-icon"></i>
          ${item.label}
        </div>
        <div class="result-value">
          ${
            item.type === "color" && item.value !== "Not detected" && isValidColor(item.value)
              ? `<div class="color-preview" style="background-color: ${cleanColorValue(item.value)}"></div>`
              : item.type === "color" 
              ? `<div class="color-preview-empty"></div>` 
              : ""
          }
          <span class="result-text">${cleanDisplayValue(item.value)}</span>
          ${
            item.type === "color" && isValidColor(item.value)
              ? `<button class="copy-color-btn" onclick="copyToClipboard('${cleanColorValue(item.value)}')" title="Copy color">
                   <i data-lucide="copy" class="copy-color-icon"></i>
                 </button>`
              : ""
          }
        </div>
      </div>
    `
    )
    .join("");
    
  // Re-initialize icons after updating the DOM
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Helper functions for color processing
function isValidColor(color) {
  if (!color || color === "Not detected" || color.includes("!important")) {
    return false;
  }
  
  // Check if it's a valid CSS color format
  const colorFormats = [
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, // Hex colors
    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, // RGB colors
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/, // RGBA colors
    /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/, // HSL colors
    /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)$/, // HSLA colors
  ];
  
  return colorFormats.some(format => format.test(color.trim()));
}

function cleanColorValue(color) {
  if (!color) return "";
  
  // Remove !important and other CSS artifacts
  return color
    .replace(/\s*!important\s*/gi, "")
    .replace(/\s*;.*$/g, "")
    .trim();
}

function cleanDisplayValue(value) {
  if (!value) return "Not detected";
  
  // Clean up the display value
  let cleaned = value
    .replace(/\s*!important\s*/gi, "")
    .replace(/\s*;.*$/g, "")
    .trim();
    
  // If it's a long color value, truncate it
  if (cleaned.length > 50) {
    cleaned = cleaned.substring(0, 47) + "...";
  }
  
  return cleaned || "Not detected";
}

function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      // Show temporary feedback
      showCopyFeedback("Color copied!");
    }).catch(() => {
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

function showCopyFeedback(message) {
  // Create a temporary toast notification
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Show and hide the toast
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2000);
}

// Enhanced displayError function
function displayError(message) {
  const resultsSection = document.getElementById("resultsSection");
  const resultsGrid = document.getElementById("resultsGrid");

  // Determine error type and customize message
  let errorTitle = "Analysis Failed";
  let errorIcon = "alert-circle";
  let actionButtons = "";
  
  if (message.includes("security restrictions") || message.includes("CORS")) {
    errorTitle = "Security Restriction";
    errorIcon = "shield-x";
    actionButtons = `
      <div class="error-actions">
        <button class="error-action-btn primary" onclick="rerunAnalysis()">
          <i data-lucide="refresh-cw"></i>
          Try Again
        </button>
        <button class="error-action-btn" onclick="showConsoleInstructions()">
          <i data-lucide="terminal"></i>
          Use Console Method
        </button>
      </div>
    `;
  } else if (message.includes("timeout") || message.includes("timed out")) {
    errorTitle = "Request Timeout";
    errorIcon = "clock-x";
    actionButtons = `
      <div class="error-actions">
        <button class="error-action-btn primary" onclick="rerunAnalysis()">
          <i data-lucide="refresh-cw"></i>
          Retry Analysis
        </button>
        <button class="error-action-btn" onclick="backToLanding()">
          <i data-lucide="arrow-left"></i>
          Try Different URL
        </button>
      </div>
    `;
  } else if (message.includes("network") || message.includes("fetch")) {
    errorTitle = "Network Error";
    errorIcon = "wifi-off";
    actionButtons = `
      <div class="error-actions">
        <button class="error-action-btn primary" onclick="rerunAnalysis()">
          <i data-lucide="refresh-cw"></i>
          Retry
        </button>
        <button class="error-action-btn" onclick="checkConnection()">
          <i data-lucide="activity"></i>
          Check Connection
        </button>
      </div>
    `;
  } else {
    actionButtons = `
      <div class="error-actions">
        <button class="error-action-btn primary" onclick="rerunAnalysis()">
          <i data-lucide="refresh-cw"></i>
          Try Again
        </button>
        <button class="error-action-btn" onclick="backToLanding()">
          <i data-lucide="home"></i>
          Back to Home
        </button>
      </div>
    `;
  }

  resultsSection.style.display = "block";
  
  // Clear the grid and switch to block display for full width error
  resultsGrid.innerHTML = "";
  resultsGrid.style.display = "block";
  resultsGrid.style.gridTemplateColumns = "none";
  
  const errorElement = document.createElement("div");
  errorElement.className = "error-state";
  errorElement.innerHTML = `
    <div class="error-icon">
      <i data-lucide="${errorIcon}"></i>
    </div>
    <div class="error-title">${errorTitle}</div>
    <div class="error-message">${message}</div>
    ${actionButtons}
  `;
  
  resultsGrid.appendChild(errorElement);
  
  // Re-initialize icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Helper function to show console instructions
function showConsoleInstructions() {
  const consoleSection = document.querySelector('.console-instructions');
  if (consoleSection) {
    consoleSection.scrollIntoView({ behavior: 'smooth' });
    consoleSection.style.animation = 'pulse 2s';
    setTimeout(() => {
      consoleSection.style.animation = '';
    }, 2000);
  }
}

// Helper function to check connection
function checkConnection() {
  const testUrl = 'https://www.google.com';
  fetch(testUrl, { method: 'HEAD', mode: 'no-cors' })
    .then(() => {
      showCopyFeedback('Connection is working. Try analyzing a different website.');
    })
    .catch(() => {
      showCopyFeedback('No internet connection detected. Please check your network.');
    });
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
    
    // Generate favicon URL
    try {
      const domain = new URL(item.url).hostname;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      historyItem.style.setProperty('--favicon-url', `url("${faviconUrl}")`);
    } catch (e) {
      // Use default icon if URL parsing fails
    }
    
    historyItem.innerHTML = `
      <div class="url-history-content">
        <div class="url-text">${item.url}</div>
        <div class="url-date">Analyzed: ${new Date(
          item.timestamp
        ).toLocaleDateString()}</div>
      </div>
      <button class="url-history-remove" onclick="removeFromHistory('${item.url}', event)" title="Remove from history">
        <i data-lucide="x"></i>
      </button>
    `;

    // Add click handler to the main content area (not the remove button)
    const contentArea = historyItem.querySelector('.url-history-content');
    contentArea.onclick = () => {
      urlInput.value = item.url;
      urlHistoryDropdown.style.display = "none";
      // Optionally auto-analyze the selected URL
      // analyzeByURL();
    };

    urlHistoryDropdown.appendChild(historyItem);
  });

  urlHistoryDropdown.style.display = "block";
  
  // Re-initialize Lucide icons for the newly added remove buttons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
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

// Function to remove URL from history
function removeFromHistory(url, event) {
  // Prevent event bubbling to avoid triggering the item click
  event.stopPropagation();
  
  try {
    const history = JSON.parse(localStorage.getItem("websiteAnalyzerHistory") || "[]");
    const filteredHistory = history.filter(item => item.url !== url);
    
    localStorage.setItem("websiteAnalyzerHistory", JSON.stringify(filteredHistory));
    
    // Refresh the dropdown to show updated history
    showUrlHistory();
    
    // Re-initialize icons after updating the DOM
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  } catch (error) {
    console.error("Failed to remove URL from history:", error);
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

// Function to fetch GitHub stars count
async function fetchGitHubStars() {
  try {
    const response = await fetch('https://api.github.com/repos/Rajek88/stylescope');
    if (response.ok) {
      const data = await response.json();
      const starsCount = data.stargazers_count || 0;
      
      // Update the stars count display
      const starsCountElement = document.querySelector('.stars-count');
      const starsBadge = document.querySelector('.stars-badge');
      
      if (starsCountElement && starsBadge) {
        const currentCount = parseInt(starsCountElement.textContent) || 0;
        
        // Only update if count changed
        if (currentCount !== starsCount) {
          starsCountElement.textContent = starsCount;
          
          // Add animation for count change
          starsBadge.classList.add('updated');
          setTimeout(() => {
            starsBadge.classList.remove('updated');
          }, 600);
          
          // Add special styling for non-zero stars
          if (starsCount > 0) {
            starsBadge.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
            starsBadge.style.color = 'white';
            starsBadge.style.borderColor = '#f59e0b';
            
            // Ensure star icon and count are visible
            const starIcon = starsBadge.querySelector('.star-icon');
            const starsCount = starsBadge.querySelector('.stars-count');
            if (starIcon) {
              starIcon.style.color = '#92400e';
              starIcon.style.fill = '#92400e';
              starIcon.style.stroke = '#92400e';
            }
            if (starsCount) {
              starsCount.style.color = 'white';
            }
          } else {
            // Reset to default styling for zero stars
            starsBadge.style.background = '';
            starsBadge.style.color = '';
            starsBadge.style.borderColor = '';
            
            // Reset star icon and count to default colors
            const starIcon = starsBadge.querySelector('.star-icon');
            const starsCount = starsBadge.querySelector('.stars-count');
            if (starIcon) {
              starIcon.style.color = '';
              starIcon.style.fill = '';
              starIcon.style.stroke = '';
            }
            if (starsCount) {
              starsCount.style.color = '';
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('Could not fetch GitHub stars:', error);
    // Keep the default 0 if API call fails
  }
}

// Function to initialize GitHub stars
function initializeGitHubStars() {
  // Fetch stars count when page loads
  fetchGitHubStars();
  
  // Refresh stars count every 5 minutes
  setInterval(fetchGitHubStars, 5 * 60 * 1000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
  
  // Initialize GitHub stars
  initializeGitHubStars();
});
