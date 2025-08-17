/**
 * Website Color and Font Analyzer Library
 * Core analysis functionality for extracting color schemes and typography
 */

class WebsiteAnalyzer {
    constructor() {
        this.colors = {
            background: null,
            primaryFont: null,
            primaryButton: null,
            secondaryFont: null,
            secondaryButton: null
        };
        this.font = null;
        this.colorFrequency = new Map();
    }

    /**
     * Main function to analyze the website
     * @returns {Object} Analysis results as JSON
     */
    analyzeWebsite() {
        try {
            this.extractBackgroundColor();
            this.extractFontColors();
            this.extractButtonColors();
            this.extractWebsiteFont();
            
            return this.formatResults();
        } catch (error) {
            console.error('Error analyzing website:', error);
            return {
                error: 'Failed to analyze website',
                details: error.message
            };
        }
    }

    /**
     * Extract background color from various sources
     */
    extractBackgroundColor() {
        // Priority 1: Check for hero sections, headers, and top components
        const topElements = this.findTopBackgroundElements();
        if (topElements.length > 0) {
            // Get the most prominent background from top elements
            const topBackground = this.getMostProminentBackground(topElements);
            if (topBackground) {
                this.colors.background = topBackground;
                return;
            }
        }
        
        // Priority 2: Check body background
        const bodyStyle = window.getComputedStyle(document.body);
        const bodyBg = bodyStyle.background || bodyStyle.backgroundColor;
        
        // Priority 3: Check html background
        const htmlStyle = window.getComputedStyle(document.documentElement);
        const htmlBg = htmlStyle.background || htmlStyle.backgroundColor;
        
        // Priority 4: Check for CSS custom properties
        const cssVars = this.getCSSCustomProperties();
        
        // Priority: CSS vars > body > html > default
        if (cssVars.background) {
            this.colors.background = this.normalizeColor(cssVars.background);
        } else if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)' && bodyBg !== 'transparent' && bodyBg !== 'none') {
            this.colors.background = this.normalizeColor(bodyBg);
        } else if (htmlBg && htmlBg !== 'rgba(0, 0, 0, 0)' && htmlBg !== 'transparent' && htmlBg !== 'none') {
            this.colors.background = this.normalizeColor(htmlBg);
        } else {
            // Look for background in style tags
            const styleTags = document.querySelectorAll('style');
            for (let styleTag of styleTags) {
                const cssText = styleTag.textContent;
                const bgMatch = cssText.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*([^;]+)/i);
                if (bgMatch) {
                    this.colors.background = this.normalizeColor(bgMatch[1].trim());
                    break;
                }
            }
            
            if (!this.colors.background) {
                this.colors.background = '#ffffff'; // Default white
            }
        }
    }

    /**
     * Find top-level elements that likely have background colors
     */
    findTopBackgroundElements() {
        const selectors = [
            // Hero sections and main banners
            'header', '.header', '#header', '.hero', '.hero-section', '.banner', '.main-banner',
            // Navigation and top bars
            'nav', '.nav', '.navigation', '.navbar', '.top-bar', '.topbar',
            // Main content areas
            'main', '.main', '.main-content', '.content-wrapper', '.page-header',
            // Common hero/header classes
            '.jumbotron', '.hero-banner', '.page-banner', '.section-hero',
            // First visible sections
            'section:first-child', '.section:first-child', '.first-section',
            // Top containers
            '.container:first-child', '.wrapper:first-child', '.top-container'
        ];
        
        const elements = [];
        selectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                found.forEach(el => {
                    if (this.isElementVisible(el) && this.hasBackgroundColor(el)) {
                        elements.push(el);
                    }
                });
            } catch (e) {
                // Skip invalid selectors
            }
        });
        
        return elements;
    }

    /**
     * Check if element is visible and has a background
     */
    isElementVisible(element) {
        try {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            // Check if element is visible
            return rect.width > 0 && 
                   rect.height > 0 && 
                   style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0';
        } catch (e) {
            return false;
        }
    }

    /**
     * Check if element has a background color
     */
    hasBackgroundColor(element) {
        try {
            const style = window.getComputedStyle(element);
            const bg = style.background || style.backgroundColor;
            
            return bg && 
                   bg !== 'rgba(0, 0, 0, 0)' && 
                   bg !== 'transparent' && 
                   bg !== 'none' && 
                   bg !== 'initial' && 
                   bg !== 'inherit';
        } catch (e) {
            return false;
        }
    }

    /**
     * Get the most prominent background color from top elements
     */
    getMostProminentBackground(elements) {
        const backgroundScores = new Map();
        
        elements.forEach(element => {
            try {
                const rect = element.getBoundingClientRect();
                const style = window.getComputedStyle(element);
                const bg = style.background || style.backgroundColor;
                
                if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'none') {
                    const normalizedColor = this.normalizeColor(bg);
                    
                    // Score based on element size and position
                    let score = rect.width * rect.height; // Area
                    
                    // Bonus for top-positioned elements
                    if (rect.top < 200) { // Within 200px of top
                        score *= 2;
                    }
                    
                    // Bonus for header-like elements
                    if (element.tagName === 'HEADER' || element.classList.contains('header') || element.classList.contains('hero')) {
                        score *= 1.5;
                    }
                    
                    // Bonus for elements with high z-index (likely overlays)
                    const zIndex = parseInt(style.zIndex) || 0;
                    if (zIndex > 0) {
                        score *= 1.2;
                    }
                    
                    backgroundScores.set(normalizedColor, (backgroundScores.get(normalizedColor) || 0) + score);
                }
            } catch (e) {
                // Skip elements with errors
            }
        });
        
        // Return the color with the highest score
        if (backgroundScores.size > 0) {
            const sortedColors = Array.from(backgroundScores.entries())
                .sort((a, b) => b[1] - a[1]);
            return sortedColors[0][0];
        }
        
        return null;
    }

    /**
     * Extract font colors from various text elements
     */
    extractFontColors() {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th');
        const colorFrequency = new Map();
        
        textElements.forEach(element => {
            const color = this.getComputedColor(element, 'color');
            
            if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
                colorFrequency.set(color, (colorFrequency.get(color) || 0) + 1);
            }
        });

        // Sort by frequency and get primary and secondary colors
        const sortedColors = Array.from(colorFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        if (sortedColors.length > 0) {
            this.colors.primaryFont = sortedColors[0];
            this.colors.secondaryFont = sortedColors.length > 1 ? sortedColors[1] : sortedColors[0];
        }
    }

    /**
     * Extract button colors
     */
    extractButtonColors() {
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"], .btn, [class*="button"]');
        const buttonColors = new Map();
        
        buttons.forEach(button => {
            const bgColor = this.getComputedColor(button, 'backgroundColor');
            
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                buttonColors.set(bgColor, (buttonColors.get(bgColor) || 0) + 1);
            }
        });

        // Sort by frequency
        const sortedButtonColors = Array.from(buttonColors.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        if (sortedButtonColors.length > 0) {
            this.colors.primaryButton = sortedButtonColors[0];
            this.colors.secondaryButton = sortedButtonColors.length > 1 ? sortedButtonColors[1] : sortedButtonColors[0];
        } else {
            // Fallback to font colors if no button colors found
            this.colors.primaryButton = this.colors.primaryFont;
            this.colors.secondaryButton = this.colors.secondaryFont;
        }
    }

    /**
     * Extract website font family
     */
    extractWebsiteFont() {
        const bodyStyle = window.getComputedStyle(document.body);
        const htmlStyle = window.getComputedStyle(document.documentElement);
        
        // Check CSS custom properties first
        const cssVars = this.getCSSCustomProperties();
        
        if (cssVars.fontFamily) {
            this.font = cssVars.fontFamily;
        } else if (bodyStyle.fontFamily) {
            this.font = bodyStyle.fontFamily;
        } else if (htmlStyle.fontFamily) {
            this.font = htmlStyle.fontFamily;
        } else {
            this.font = 'Arial, sans-serif'; // Default fallback
        }
    }

    /**
     * Get CSS custom properties (CSS variables)
     */
    getCSSCustomProperties() {
        const root = document.documentElement;
        const computedStyle = window.getComputedStyle(root);
        const cssVars = {};
        
        // Common CSS variable names for colors and fonts
        const colorVars = [
            '--primary-color', '--secondary-color', '--background-color', '--text-color', '--accent-color',
            '--bg-color', '--main-bg', '--body-bg', '--surface-color', '--base-color'
        ];
        const fontVars = ['--font-family', '--primary-font', '--body-font', '--main-font'];
        
        colorVars.forEach(varName => {
            const value = computedStyle.getPropertyValue(varName);
            if (value && value.trim()) {
                const normalizedValue = this.normalizeColor(value.trim());
                if (normalizedValue) {
                    cssVars[varName.replace('--', '').replace(/-/g, '')] = normalizedValue;
                }
            }
        });
        
        fontVars.forEach(varName => {
            const value = computedStyle.getPropertyValue(varName);
            if (value && value.trim()) {
                cssVars[varName.replace('--', '').replace(/-/g, '')] = value.trim();
            }
        });
        
        // Also check for any CSS variables that might contain background-related values
        const allVars = Array.from(computedStyle).filter(prop => prop.startsWith('--'));
        allVars.forEach(varName => {
            if (varName.includes('background') || varName.includes('bg') || varName.includes('color')) {
                const value = computedStyle.getPropertyValue(varName);
                if (value && value.trim()) {
                    const normalizedValue = this.normalizeColor(value.trim());
                    if (normalizedValue) {
                        cssVars[varName.replace('--', '').replace(/-/g, '')] = normalizedValue;
                    }
                }
            }
        });
        
        return cssVars;
    }

    /**
     * Normalize color values to hex format or meaningful representation
     */
    normalizeColor(color) {
        if (!color) return null;
        
        // Clean up the color string first
        color = color
            .replace(/\s*!important\s*/gi, '')
            .replace(/\s*;.*$/g, '')
            .trim();
            
        if (!color) return null;
        
        // Remove extra spaces and convert to lowercase for processing
        const processedColor = color.replace(/\s+/g, ' ').toLowerCase();
        
        // Handle CSS keywords that need to be resolved to actual values
        if (processedColor === 'initial' || processedColor === 'inherit' || processedColor === 'unset' || processedColor === 'currentcolor') {
            return this.resolveCSSKeyword(processedColor);
        }
        
        // Skip transparent and invalid values
        if (processedColor === 'transparent' || processedColor === 'rgba(0,0,0,0)' || processedColor === 'rgba(0, 0, 0, 0)') {
            return null;
        }
        
        // Handle gradients and complex backgrounds
        if (color.includes('linear-gradient')) {
            return this.extractGradientColors(color, 'linear');
        } else if (color.includes('radial-gradient')) {
            return this.extractGradientColors(color, 'radial');
        } else if (color.includes('conic-gradient')) {
            return this.extractGradientColors(color, 'conic');
        } else if (color.includes('repeating-linear-gradient')) {
            return this.extractGradientColors(color, 'repeating-linear');
        } else if (color.includes('repeating-radial-gradient')) {
            return this.extractGradientColors(color, 'repeating-radial');
        }
        
        // If already hex, return as is
        if (color.startsWith('#')) {
            return color;
        }
        
        // Convert rgb/rgba to hex
        if (color.startsWith('rgb')) {
            const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
            if (rgbMatch) {
                const r = parseInt(rgbMatch[1]);
                const g = parseInt(rgbMatch[2]);
                const b = parseInt(rgbMatch[3]);
                return this.rgbToHex(r, g, b);
            }
        }
        
        // Convert named colors to hex
        const namedColors = {
            'black': '#000000',
            'white': '#ffffff',
            'red': '#ff0000',
            'green': '#00ff00',
            'blue': '#0000ff',
            'yellow': '#ffff00',
            'cyan': '#00ffff',
            'magenta': '#ff00ff',
            'gray': '#808080',
            'grey': '#808080',
            'orange': '#ffa500',
            'purple': '#800080',
            'brown': '#a52a2a',
            'pink': '#ffc0cb',
            'lime': '#00ff00',
            'navy': '#000080',
            'teal': '#008080',
            'silver': '#c0c0c0',
            'gold': '#ffd700',
            'indigo': '#4b0082',
            'violet': '#ee82ee',
            'maroon': '#800000',
            'olive': '#808000',
            'aqua': '#00ffff',
            'fuchsia': '#ff00ff'
        };
        
        return namedColors[color] || color;
    }

    /**
     * Resolve CSS keywords to their actual computed color values
     * @param {string} keyword - CSS keyword like 'initial', 'inherit', etc.
     * @returns {string} Actual color value
     */
    resolveCSSKeyword(keyword) {
        try {
            // Create a temporary element to get computed styles
            const tempElement = document.createElement('div');
            tempElement.style.color = keyword;
            document.body.appendChild(tempElement);
            
            // Get the computed color value
            const computedStyle = window.getComputedStyle(tempElement);
            const actualColor = computedStyle.color;
            
            // Clean up
            document.body.removeChild(tempElement);
            
            // If we got a meaningful color, normalize it
            if (actualColor && actualColor !== 'rgba(0, 0, 0, 0)' && actualColor !== 'transparent') {
                return this.normalizeColor(actualColor);
            }
            
            // Fallback for when keyword resolution fails
            return '#000000'; // Default black
            
        } catch (error) {
            console.warn(`Failed to resolve CSS keyword '${keyword}':`, error);
            return '#000000'; // Default black
        }
    }

    /**
     * Extract colors from gradient backgrounds
     * @param {string} gradient - CSS gradient string
     * @param {string} type - Gradient type
     * @returns {string} Representation of the gradient
     */
    extractGradientColors(gradient, type) {
        try {
            // Extract color stops from gradient
            const colorStops = [];
            
            // First, let's clean up the gradient string to remove direction/angle values
            let cleanGradient = gradient;
            
            // Remove common direction keywords and angle values
            cleanGradient = cleanGradient.replace(/(to\s+(top|right|bottom|left|top\s+right|top\s+left|bottom\s+right|bottom\s+left)|-?\d+(?:\.\d+)?(?:deg|rad|grad|turn))/gi, '');
            
            // More comprehensive regex to match color values in gradients
            // This handles hex, rgb, rgba, hsl, hsla, and named colors
            const colorRegex = /(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|transparent|currentColor|inherit|initial|unset|black|white|red|green|blue|yellow|cyan|magenta|gray|grey|orange|purple|brown|pink|lime|navy|teal|silver|gold|indigo|violet|maroon|olive|aqua|fuchsia)/gi;
            
            const colorMatches = cleanGradient.match(colorRegex);
            
            if (colorMatches) {
                colorMatches.forEach(match => {
                    // Skip transparent and other non-color values
                    if (match.toLowerCase() === 'transparent' || 
                        match.toLowerCase() === 'inherit' || 
                        match.toLowerCase() === 'unset') {
                        return;
                    }
                    
                    // Handle currentcolor specially - resolve it to actual color
                    if (match.toLowerCase() === 'currentcolor') {
                        const resolvedColor = this.resolveCSSKeyword('currentcolor');
                        if (resolvedColor && !colorStops.includes(resolvedColor)) {
                            colorStops.push(resolvedColor);
                        }
                        return;
                    }
                    
                    // Normalize the color and add to our list
                    const normalizedColor = this.normalizeColor(match);
                    
                    if (normalizedColor && !normalizedColor.includes('gradient') && !colorStops.includes(normalizedColor)) {
                        colorStops.push(normalizedColor);
                    }
                });
            }
            
            if (colorStops.length > 0) {
                // Return the actual CSS gradient syntax
                if (type === 'linear') {
                    return `linear-gradient(to right, ${colorStops.join(', ')})`;
                } else if (type === 'radial') {
                    return `radial-gradient(circle, ${colorStops.join(', ')})`;
                } else if (type === 'conic') {
                    return `conic-gradient(${colorStops.join(', ')})`;
                } else {
                    return `${type}-gradient(${colorStops.join(', ')})`;
                }
            }
            
            // Fallback for complex gradients - try to extract any color-like values
            const fallbackColors = cleanGradient.match(/(#[0-9a-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\))/gi);
            if (fallbackColors && fallbackColors.length > 0) {
                const firstColor = this.normalizeColor(fallbackColors[0]);
                if (fallbackColors.length === 1) {
                    return `linear-gradient(to right, ${firstColor})`;
                } else {
                    return `linear-gradient(to right, ${fallbackColors.map(c => this.normalizeColor(c)).join(', ')})`;
                }
            }
            
            // Final fallback - return a default gradient
            return 'linear-gradient(to right, #ffffff, #f0f0f0)';
            
        } catch (error) {
            console.warn('Error parsing gradient:', error);
            return 'linear-gradient(to right, #ffffff, #f0f0f0)';
        }
    }

    /**
     * Convert RGB values to hex
     */
    rgbToHex(r, g, b) {
        const toHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return '#' + toHex(r) + toHex(g) + toHex(b);
    }

    /**
     * Format results as JSON
     */
    formatResults() {
        return {
            background_color: this.colors.background,
            primary_color_font: this.colors.primaryFont,
            primary_color_button: this.colors.primaryButton,
            secondary_color_font: this.colors.secondaryFont,
            secondary_color_button: this.colors.secondaryButton,
            font: this.font,
            analysis_timestamp: new Date().toISOString(),
            url: window.location.href
        };
    }

    /**
     * Get computed color value from an element, resolving CSS keywords
     * @param {Element} element - DOM element
     * @param {string} property - CSS property to get (e.g., 'color', 'backgroundColor')
     * @returns {string} Resolved color value
     */
    getComputedColor(element, property) {
        try {
            const computedStyle = window.getComputedStyle(element);
            let colorValue = computedStyle[property];
            
            // Clean up the color value by removing !important and other CSS artifacts
            if (colorValue) {
                colorValue = colorValue
                    .replace(/\s*!important\s*/gi, '')
                    .replace(/\s*;.*$/g, '')
                    .trim();
            }
            
            // If it's a CSS keyword, resolve it
            if (colorValue === 'initial' || colorValue === 'inherit' || colorValue === 'unset' || colorValue === 'currentcolor') {
                return this.resolveCSSKeyword(colorValue);
            }
            
            // Skip invalid or empty values
            if (!colorValue || colorValue === 'rgba(0, 0, 0, 0)' || colorValue === 'transparent') {
                return null;
            }
            
            // Otherwise, normalize the color
            return this.normalizeColor(colorValue);
            
        } catch (error) {
            console.warn(`Failed to get computed color for ${property}:`, error);
            return null;
        }
    }
}

/**
 * Function to analyze the current website
 * @returns {Object} Analysis results
 */
function analyzeWebsiteColors() {
    const analyzer = new WebsiteAnalyzer();
    const results = analyzer.analyzeWebsite();
    
    // Console log the results for easy viewing
    console.log('🎨 Website Analysis Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 URL:', results.url || window.location.href);
    console.log('📅 Analysis Time:', new Date(results.analysis_timestamp).toLocaleString());
    console.log('');
    console.log('🎨 COLORS:');
    console.log('  🖼️  Background Color:', results.background_color || 'Not detected');
    console.log('  ✏️  Primary Font Color:', results.primary_color_font || 'Not detected');
    console.log('  🔘 Primary Button Color:', results.primary_color_button || 'Not detected');
    console.log('  ✏️  Secondary Font Color:', results.secondary_color_font || 'Not detected');
    console.log('  🔘 Secondary Button Color:', results.secondary_color_button || 'Not detected');
    console.log('');
    console.log('🔤 TYPOGRAPHY:');
    console.log('  📝 Website Font:', results.font || 'Not detected');
    console.log('');
    console.log('📋 JSON Output:');
    console.log(JSON.stringify(results, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return results;
}

/**
 * Function to analyze a specific website (for use in console or external scripts)
 * @param {string} url - URL of the website to analyze
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeWebsiteByURL(url) {
    try {
        // Method 1: Try to fetch the website content (works with CORS-enabled sites)
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                return analyzeHTMLContent(html, url);
            }
        } catch (fetchError) {
            console.log('Fetch method failed, trying alternative approach...');
        }

        // Method 2: Create a proxy request through a CORS proxy service
        try {
            const corsProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const response = await fetch(corsProxyUrl);
            
            if (response.ok) {
                const data = await response.json();
                if (data.contents) {
                    return analyzeHTMLContent(data.contents, url);
                }
            }
        } catch (proxyError) {
            console.log('Proxy method failed, trying iframe approach...');
        }

        // Method 3: Try iframe approach (limited but might work for some sites)
        return new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            // Add cache-busting parameter
            const separator = url.includes('?') ? '&' : '?';
            iframe.src = url + separator + '_cacheBust=' + Date.now();
            
            iframe.onload = () => {
                try {
                    // Try to access iframe content (will fail due to same-origin policy)
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    const analyzer = new WebsiteAnalyzer();
                    const results = analyzer.analyzeWebsite();
                    results.url = url;
                    document.body.removeChild(iframe);
                    resolve(results);
                } catch (iframeError) {
                    document.body.removeChild(iframe);
                    reject(new Error(`Cannot analyze external website due to security restrictions. Try using the browser console on the target website instead.`));
                }
            };
            
            iframe.onerror = () => {
                document.body.removeChild(iframe);
                reject(new Error('Failed to load website'));
            };
            
            document.body.appendChild(iframe);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                reject(new Error('Website analysis timed out'));
            }, 10000);
        });
        
    } catch (error) {
        throw new Error(`Failed to analyze website: ${error.message}`);
    }
}

/**
 * Analyze HTML content string (for external websites)
 * @param {string} html - HTML content as string
 * @param {string} url - Original URL
 * @returns {Object} Analysis results
 */
function analyzeHTMLContent(html, url) {
    try {
        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Create a temporary analyzer that works with the parsed document
        const tempAnalyzer = new WebsiteAnalyzer();
        
        // Override the analyzer's methods to work with parsed HTML
        tempAnalyzer.extractBackgroundColor = function() {
            const body = doc.querySelector('body');
            const html = doc.querySelector('html');
            
            if (body && body.style.background) {
                this.colors.background = this.normalizeColor(body.style.background);
            } else if (body && body.style.backgroundColor) {
                this.colors.background = this.normalizeColor(body.style.backgroundColor);
            } else if (html && html.style.background) {
                this.colors.background = this.normalizeColor(html.style.background);
            } else if (html && html.style.backgroundColor) {
                this.colors.background = this.normalizeColor(html.style.backgroundColor);
            } else {
                // Look for background in style tags
                const styleTags = doc.querySelectorAll('style');
                for (let styleTag of styleTags) {
                    const cssText = styleTag.textContent;
                    const bgMatch = cssText.match(/body\s*\{[^}]*background(?:-color)?\s*:\s*([^;]+)/i);
                    if (bgMatch) {
                        this.colors.background = this.normalizeColor(bgMatch[1].trim());
                        break;
                    }
                }
                
                if (!this.colors.background) {
                    this.colors.background = '#ffffff';
                }
            }
        };
        
        tempAnalyzer.extractFontColors = function() {
            const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th');
            const colorFrequency = new Map();
            
            textElements.forEach(element => {
                if (element.style && element.style.color) {
                    const color = element.style.color;
                    if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
                        const normalizedColor = this.normalizeColor(color);
                        colorFrequency.set(normalizedColor, (colorFrequency.get(normalizedColor) || 0) + 1);
                    }
                }
            });
            
            // Also check style tags for CSS rules
            const styleTags = doc.querySelectorAll('style');
            for (let styleTag of styleTags) {
                const cssText = styleTag.textContent;
                const colorMatches = cssText.match(/color\s*:\s*([^;]+)/gi);
                if (colorMatches) {
                    colorMatches.forEach(match => {
                        const color = match.replace(/color\s*:\s*/i, '').trim();
                        if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
                            const normalizedColor = this.normalizeColor(color);
                            colorFrequency.set(normalizedColor, (colorFrequency.get(normalizedColor) || 0) + 1);
                        }
                    });
                }
            }
            
            const sortedColors = Array.from(colorFrequency.entries())
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);
            
            if (sortedColors.length > 0) {
                this.colors.primaryFont = sortedColors[0];
                this.colors.secondaryFont = sortedColors.length > 1 ? sortedColors[1] : sortedColors[0];
            } else {
                this.colors.primaryFont = '#000000';
                this.colors.secondaryFont = '#333333';
            }
        };
        
        tempAnalyzer.extractButtonColors = function() {
            const buttons = doc.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"], .btn, [class*="button"]');
            const buttonColors = new Map();
            
            buttons.forEach(button => {
                if (button.style && button.style.backgroundColor) {
                    const bgColor = button.style.backgroundColor;
                    if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                        const normalizedColor = this.normalizeColor(bgColor);
                        buttonColors.set(normalizedColor, (buttonColors.get(normalizedColor) || 0) + 1);
                    }
                }
            });
            
            // Check CSS for button styles
            const styleTags = doc.querySelectorAll('style');
            for (let styleTag of styleTags) {
                const cssText = styleTag.textContent;
                const buttonMatches = cssText.match(/(?:button|\.btn|\[class\*="button"\])\s*\{[^}]*background(?:-color)?\s*:\s*([^;]+)/gi);
                if (buttonMatches) {
                    buttonMatches.forEach(match => {
                        const bgMatch = match.match(/background(?:-color)?\s*:\s*([^;]+)/i);
                        if (bgMatch) {
                            const color = bgMatch[1].trim();
                            if (color && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
                                const normalizedColor = this.normalizeColor(color);
                                buttonColors.set(normalizedColor, (buttonColors.get(normalizedColor) || 0) + 1);
                            }
                        }
                    });
                }
            }
            
            const sortedButtonColors = Array.from(buttonColors.entries())
                .sort((a, b) => b[1] - a[1])
                .map(entry => entry[0]);
            
            if (sortedButtonColors.length > 0) {
                this.colors.primaryButton = sortedButtonColors[0];
                this.colors.secondaryButton = sortedButtonColors.length > 1 ? sortedButtonColors[1] : sortedButtonColors[0];
            } else {
                this.colors.primaryButton = this.colors.primaryFont;
                this.colors.secondaryButton = this.colors.secondaryFont;
            }
        };
        
        tempAnalyzer.extractWebsiteFont = function() {
            const body = doc.querySelector('body');
            const html = doc.querySelector('html');
            
            if (body && body.style.fontFamily) {
                this.font = body.style.fontFamily;
            } else if (html && html.style.fontFamily) {
                this.font = html.style.fontFamily;
            } else {
                // Check style tags for font-family
                const styleTags = doc.querySelectorAll('style');
                for (let styleTag of styleTags) {
                    const cssText = styleTag.textContent;
                    const fontMatch = cssText.match(/font-family\s*:\s*([^;]+)/i);
                    if (fontMatch) {
                        this.font = fontMatch[1].trim();
                        break;
                    }
                }
                
                if (!this.font) {
                    this.font = 'Arial, sans-serif';
                }
            }
        };
        
        // Run the analysis
        tempAnalyzer.analyzeWebsite();
        
        // Add URL to results
        const results = tempAnalyzer.formatResults();
        results.url = url;
        
        return results;
        
    } catch (error) {
        throw new Error(`Failed to analyze HTML content: ${error.message}`);
    }
}

// Export for use in different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WebsiteAnalyzer, analyzeWebsiteColors, analyzeWebsiteByURL, analyzeHTMLContent };
} else if (typeof window !== 'undefined') {
    window.WebsiteAnalyzer = WebsiteAnalyzer;
    window.analyzeWebsiteColors = analyzeWebsiteColors;
    window.analyzeWebsiteByURL = analyzeWebsiteByURL;
    window.analyzeHTMLContent = analyzeHTMLContent;
}
