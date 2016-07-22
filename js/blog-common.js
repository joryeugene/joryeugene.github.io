/* Blog Common JavaScript - Shared Functionality */

// Background Switcher Module
const BackgroundSwitcher = {
  // Configuration
  config: {
    imagePath: '/jpg/',
    useContainer: false,
    buttonId: 'change',
    bgElementId: 'bg',
    useSimpleIcon: false,
    simpleIconPath: '/svg/refresh-icon.svg',
    images: {
      desktop: ['bg.jpg', 'bg2.jpg', 'bg3.jpg'],
      mobile: ['bg_mobile.jpg', 'bg_mobile2.jpg', 'bg_mobile3.jpg'],
      portrait: ['bg_mobilev.jpg', 'bg_mobilev2.jpg', 'bg_mobilev3.jpg']
    }
  },
  
  // State
  currentIndex: 0,
  mediaQueries: {},
  
  // Initialize the background switcher
  init(customConfig = {}) {
    // Merge custom config
    this.config = { ...this.config, ...customConfig };
    
    // Set up media queries
    this.mediaQueries = {
      desktop: window.matchMedia('(min-width: 768px)'),
      mobile: window.matchMedia('(orientation: landscape) and (max-width: 767px)'),
      portrait: window.matchMedia('(orientation: portrait) and (max-width: 767px)')
    };
    
    // Get DOM elements
    const button = document.getElementById(this.config.buttonId);
    const bg = document.getElementById(this.config.bgElementId);
    
    if (!button || !bg) return;
    
    // Add tooltip
    this.addTooltip(button);
    
    // Replace with simple icon if configured
    if (this.config.useSimpleIcon) {
      this.replaceWithSimpleIcon(button);
    }
    
    // Add click handler
    button.addEventListener('click', () => this.changeBackground());
    
    // Add keyboard support
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.changeBackground();
      }
    });
    
    // Handle responsive changes
    this.mediaQueryListeners = [];
    Object.values(this.mediaQueries).forEach(mq => {
      const listener = () => this.updateBackgroundForViewport();
      mq.addListener(listener);
      this.mediaQueryListeners.push({ mq, listener });
    });
    
    // Implement lazy loading for initial background
    this.lazyLoadInitialBackground(bg);
    
    // Add loading state handling
    this.addLoadingStateHandling(bg);
  },
  
  // Get current image set based on viewport
  getCurrentImageSet() {
    if (this.mediaQueries.portrait.matches) return this.config.images.portrait;
    if (this.mediaQueries.mobile.matches) return this.config.images.mobile;
    return this.config.images.desktop;
  },
  
  // Change background image
  changeBackground() {
    const bg = document.getElementById(this.config.bgElementId);
    if (!bg) return;
    
    // Get current image set
    const imageSet = this.getCurrentImageSet();
    
    // Update index
    this.currentIndex = (this.currentIndex + 1) % imageSet.length;
    
    // Apply new background
    const imagePath = this.config.useContainer 
      ? imageSet[this.currentIndex]
      : `${this.config.imagePath}${imageSet[this.currentIndex]}`;
    
    bg.style.backgroundImage = `url('${imagePath}')`;
    
    // Preload next image
    setTimeout(() => this.preloadNextImage(), 100);
  },
  
  // Update background for viewport changes
  updateBackgroundForViewport() {
    const bg = document.getElementById(this.config.bgElementId);
    if (!bg) return;
    
    const imageSet = this.getCurrentImageSet();
    const imagePath = this.config.useContainer 
      ? imageSet[this.currentIndex]
      : `${this.config.imagePath}${imageSet[this.currentIndex]}`;
    
    bg.style.backgroundImage = `url('${imagePath}')`;
  },
  
  // Preload next image
  preloadNextImage() {
    const imageSet = this.getCurrentImageSet();
    const nextIndex = (this.currentIndex + 1) % imageSet.length;
    const nextImage = new Image();
    
    nextImage.src = this.config.useContainer 
      ? imageSet[nextIndex]
      : `${this.config.imagePath}${imageSet[nextIndex]}`;
  },
  
  // Add loading state handling
  addLoadingStateHandling(bg) {
    const originalLoad = window.Image;
    window.Image = function() {
      const img = new originalLoad();
      img.addEventListener('load', () => {
        if (bg.style.backgroundImage.includes(img.src)) {
          bg.classList.remove('loading');
        }
      });
      return img;
    };
  },
  
  // Add tooltip to button
  addTooltip(button) {
    const tooltip = document.createElement('div');
    tooltip.className = 'bg-switcher-tooltip';
    tooltip.textContent = 'Change background';
    
    // Insert tooltip after button
    button.parentNode.insertBefore(tooltip, button.nextSibling);
    
    // Update aria-label for accessibility
    button.setAttribute('aria-label', 'Change background image');
  },
  
  // Replace with simple icon
  replaceWithSimpleIcon(button) {
    // Clear existing SVG content
    button.innerHTML = '';
    
    // Fetch and insert simple icon
    fetch(this.config.simpleIconPath)
      .then(response => response.text())
      .then(svgContent => {
        button.innerHTML = svgContent;
        // Ensure the SVG inherits the button's styles
        const svg = button.querySelector('svg');
        if (svg) {
          svg.style.width = '100%';
          svg.style.height = '100%';
          svg.style.fill = 'inherit';
        }
      })
      .catch(error => {
        console.error('Failed to load simple icon:', error);
      });
  },
  
  // Lazy load initial background
  lazyLoadInitialBackground(bg) {
    // Check if background is already set
    const currentBg = window.getComputedStyle(bg).backgroundImage;
    if (currentBg && currentBg !== 'none') {
      bg.classList.add('loaded'); // Ensure loaded class is set
      // Preload next image after initial load  
      setTimeout(() => this.preloadNextImage(), 500);
      return;
    }
    
    // Ensure immediate visibility by adding loaded class
    bg.classList.add('loaded');
    
    // Load initial background immediately to prevent black page
    const loadBackground = () => {
      const imageSet = this.getCurrentImageSet();
      const imagePath = this.config.useContainer 
        ? imageSet[0]
        : `${this.config.imagePath}${imageSet[0]}`;
      
      // Create image element to preload
      const img = new Image();
      img.onload = () => {
        bg.style.backgroundImage = `url('${imagePath}')`;
        bg.classList.add('loaded');
        // Preload next image
        setTimeout(() => this.preloadNextImage(), 500);
      };
      img.onerror = () => {
        // Fallback: add loaded class anyway to prevent black page
        bg.classList.add('loaded');
        console.warn('Failed to load background image:', imagePath);
      };
      img.src = imagePath;
    };
    
    // Load immediately if element is visible, or use Intersection Observer
    const rect = bg.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isVisible) {
      loadBackground();
    } else if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadBackground();
            // Stop observing
            observer.unobserve(bg);
          }
        });
      }, {
        rootMargin: '50px' // Start loading 50px before element is visible
      });
      
      observer.observe(bg);
    } else {
      // Fallback for browsers without Intersection Observer
      loadBackground();
    }
  },
  
  // Cleanup method for memory leak prevention
  cleanup() {
    if (this.mediaQueryListeners) {
      this.mediaQueryListeners.forEach(({ mq, listener }) => {
        mq.removeListener(listener);
      });
      this.mediaQueryListeners = [];
    }
  }
};

// Markdown Header ID Generator
const HeaderIDGenerator = {
  // Process all headers and add IDs
  process() {
    const headers = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6');
    const usedIds = new Set();
    
    headers.forEach(header => {
      if (!header.id) {
        const id = this.generateId(header.textContent, usedIds);
        header.id = id;
        usedIds.add(id);
      }
    });
    
    // Add smooth scrolling to anchor links
    this.addSmoothScrolling();
  },
  
  // Generate a clean ID from text
  generateId(text, usedIds) {
    let id = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
    
    // Handle empty ID
    if (!id) id = 'section';
    
    // Ensure uniqueness
    let finalId = id;
    let counter = 1;
    while (usedIds.has(finalId)) {
      finalId = `${id}-${counter}`;
      counter++;
    }
    
    return finalId;
  },
  
  // Add smooth scrolling to anchor links
  addSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          e.preventDefault();
          
          // Scroll to element with offset for fixed header
          const offset = 80;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Update URL
          history.pushState(null, null, `#${targetId}`);
        }
      });
    });
  }
};

// Markdown Content Loader
const MarkdownLoader = {
  // Load markdown content
  async load(markdownPath, contentElementId = 'content', showSkeleton = true) {
    try {
      const contentElement = document.getElementById(contentElementId);
      if (!contentElement) return;
      
      // Show skeleton loader if enabled
      if (showSkeleton) {
        SkeletonLoader.show(`#${contentElementId}`);
      }
      
      const response = await fetch(markdownPath);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const markdownText = await response.text();
      
      // Check if marked library is available
      if (typeof marked === 'undefined') {
        throw new Error('Markdown library (marked) not loaded');
      }
      
      const html = marked.parse(markdownText);
      
      // Hide skeleton and insert content
      if (showSkeleton) {
        SkeletonLoader.hide(`#${contentElementId}`);
      }
      
      // Preserve reading-time element if it exists
      const existingReadingTime = contentElement.querySelector('.reading-time');
      let readingTimeHTML = '';
      if (existingReadingTime) {
        readingTimeHTML = existingReadingTime.outerHTML;
      }
      
      contentElement.innerHTML = html;
      
      // Re-add reading-time element if it existed
      if (readingTimeHTML) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = readingTimeHTML;
        const readingTimeEl = tempDiv.firstChild;
        contentElement.insertBefore(readingTimeEl, contentElement.firstChild);
      }
      
      // Process headers
      HeaderIDGenerator.process();
      
      // Reading time disabled per user request
      // setTimeout(() => {
      //   ReadingTime.display();
      // }, 100);
      
      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('markdownLoaded', { detail: { content: html } }));
      
      // Return promise for chaining
      return { success: true, content: html };
    } catch (error) {
      console.error('Error loading markdown:', error);
      const contentElement = document.getElementById(contentElementId);
      if (contentElement) {
        if (showSkeleton) {
          SkeletonLoader.hide(`#${contentElementId}`);
        }
        contentElement.innerHTML = '<p class="error">Error loading content. Please try again later.</p>';
        contentElement.classList.add('loaded');
      }
      return { success: false, error };
    }
  }
};

// Reading Time Calculator
const ReadingTime = {
  // Calculate reading time for content
  calculate(selector = '.markdown-body') {
    const content = document.querySelector(selector);
    if (!content) return null;
    
    // Get text content
    const text = content.textContent || content.innerText || '';
    
    // Calculate word count
    const words = text.trim().split(/\s+/).length;
    
    // Average reading speed (words per minute)
    const wordsPerMinute = 200;
    
    // Calculate time
    const minutes = Math.ceil(words / wordsPerMinute);
    
    return {
      words,
      minutes,
      text: minutes === 1 ? '1 minute read' : `${minutes} minute read`
    };
  },
  
  // Display reading time
  display(selector = '.reading-time') {
    const timeData = this.calculate();
    console.log('[ReadingTime] Calculated:', timeData);
    if (!timeData) {
      console.log('[ReadingTime] No time data calculated');
      return;
    }
    
    let element = document.querySelector(selector);
    console.log('[ReadingTime] Element found:', !!element);
    
    // Always create/recreate element to ensure it shows
    if (!element) {
      element = document.createElement('div');
      element.className = 'reading-time text-muted mb-2';
      console.log('[ReadingTime] Created new element');
    }
    
    // Set the content
    element.textContent = timeData.text;
    element.setAttribute('data-words', timeData.words);
    element.setAttribute('data-minutes', timeData.minutes);
    
    // Force insert at the beginning of content
    const content = document.querySelector('.markdown-body') || document.getElementById('content');
    if (content) {
      // Remove any existing reading time elements first
      const existingElements = content.querySelectorAll('.reading-time');
      existingElements.forEach(el => el.remove());
      
      // Insert at the very beginning
      if (content.firstChild) {
        content.insertBefore(element, content.firstChild);
      } else {
        content.appendChild(element);
      }
      console.log('[ReadingTime] Inserted element at beginning of content');
    }
    
    // Also add some CSS to ensure visibility
    element.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      color: rgba(255, 255, 255, 0.6) !important;
      font-size: 14px !important;
      margin-bottom: 16px !important;
      font-style: italic !important;
    `;
  }
};

// Scroll Progress Indicator
const ScrollProgress = {
  // Initialize scroll progress
  init(options = {}) {
    const config = {
      selector: '.scroll-progress',
      height: '3px',
      color: 'var(--link-color)',
      position: 'top',
      ...options
    };
    
    // Create progress element if it doesn't exist
    let progress = document.querySelector(config.selector);
    if (!progress) {
      progress = document.createElement('div');
      progress.className = 'scroll-progress';
      progress.style.cssText = `
        position: fixed;
        ${config.position}: 0;
        left: 0;
        width: 0%;
        height: ${config.height};
        background-color: ${config.color};
        transition: width 0.1s ease;
        z-index: 1000;
      `;
      document.body.appendChild(progress);
    }
    
    // Update progress on scroll
    const updateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const percentage = (scrolled / documentHeight) * 100;
      
      progress.style.width = `${Math.min(percentage, 100)}%`;
    };
    
    // Throttle scroll events
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateProgress);
    
    // Initial update
    updateProgress();
  }
};

// Blog Button Scroll Behavior
const BlogButtonScroll = {
  init() {
    const blogButton = document.querySelector('.home-link');
    if (!blogButton) return;
    
    let lastScrollY = window.scrollY;
    let scrollThreshold = 0; // pixels before hiding
    let isHidden = false;
    
    // Add transition styles
    blogButton.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY;
      
      if (scrollingDown && currentScrollY > scrollThreshold && !isHidden) {
        // Hide on scroll down
        blogButton.style.opacity = '0.1';
        blogButton.style.transform = 'translateX(-10px)';
        isHidden = true;
      } else if ((!scrollingDown || currentScrollY <= scrollThreshold) && isHidden) {
        // Show on scroll up or at top
        blogButton.style.opacity = '';
        blogButton.style.transform = '';
        isHidden = false;
      }
      
      lastScrollY = currentScrollY;
    };
    
    // Add hover behavior to restore full opacity
    blogButton.addEventListener('mouseenter', () => {
      if (isHidden) {
        blogButton.style.opacity = '0.8';
        blogButton.style.transform = 'translateX(0)';
      }
    });
    
    blogButton.addEventListener('mouseleave', () => {
      if (isHidden && window.scrollY > scrollThreshold) {
        blogButton.style.opacity = '0.1';
        blogButton.style.transform = 'translateX(-10px)';
      }
    });
    
    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', throttledScroll, { passive: true });
  }
};

// Skeleton Loader Module
const SkeletonLoader = {
  // Create skeleton template
  createSkeleton() {
    return `
      <div class="skeleton-content">
        <div class="skeleton-title skeleton-loader"></div>
        <div class="skeleton-meta skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
        <div class="skeleton-paragraph skeleton-loader"></div>
      </div>
    `;
  },
  
  // Show skeleton loader
  show(containerSelector = '.markdown-body') {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    // Add loading class
    container.classList.add('loading');
    
    // Insert skeleton HTML
    container.innerHTML = this.createSkeleton();
  },
  
  // Hide skeleton loader
  hide(containerSelector = '.markdown-body') {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    // Remove skeleton content
    const skeleton = container.querySelector('.skeleton-content');
    if (skeleton) {
      skeleton.remove();
    }
    
    // Remove loading class and add loaded class
    container.classList.remove('loading');
    container.classList.add('loaded');
  }
};

// Lazy Image Loader Module
const LazyImageLoader = {
  // Initialize lazy loading for images
  init(options = {}) {
    const config = {
      selector: 'img[data-src]',
      rootMargin: '50px',
      threshold: 0.01,
      loadedClass: 'loaded',
      loadingClass: 'loading',
      ...options
    };
    
    // Get all lazy images
    const lazyImages = document.querySelectorAll(config.selector);
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.loadImage(img, config);
            imageObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: config.rootMargin,
        threshold: config.threshold
      });
      
      lazyImages.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without Intersection Observer
      lazyImages.forEach(img => this.loadImage(img, config));
    }
  },
  
  // Load individual image
  loadImage(img, config) {
    img.classList.add(config.loadingClass);
    
    // Handle both regular images and background images
    if (img.dataset.src) {
      const tempImg = new Image();
      tempImg.onload = () => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.remove(config.loadingClass);
        img.classList.add(config.loadedClass);
      };
      tempImg.onerror = () => {
        img.classList.remove(config.loadingClass);
        img.classList.add('error');
      };
      tempImg.src = img.dataset.src;
    }
    
    // Handle srcset if present
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
      img.removeAttribute('data-srcset');
    }
  }
};

// Floating Table of Contents
const TableOfContents = {
  // Initialize floating TOC
  init() {
    const headings = document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3');
    console.log('[TOC] Found headings:', headings.length);
    if (headings.length < 3) {
      console.log('[TOC] Not enough headings, skipping TOC');
      return; // Only show TOC for posts with 3+ headings
    }
    
    this.createTOC(headings);
    this.setupScrollSpy(headings);
  },
  
  // Create TOC element
  createTOC(headings) {
    const toc = document.createElement('nav');
    toc.className = 'table-of-contents collapsed'; // Start collapsed
    toc.innerHTML = `
      <div class="toc-header">
        <span class="toc-title">Contents</span>
        <button class="toc-toggle" aria-label="Toggle table of contents">
          <span class="toc-toggle-icon">+</span>
        </button>
      </div>
      <ul class="toc-list" style="display: none;">
        ${Array.from(headings).map(heading => `
          <li class="toc-item toc-${heading.tagName.toLowerCase()}">
            <a href="#${heading.id}" class="toc-link">${heading.textContent}</a>
          </li>
        `).join('')}
      </ul>
    `;
    
    document.body.appendChild(toc);
    
    // Toggle functionality
    const toggle = toc.querySelector('.toc-toggle');
    const header = toc.querySelector('.toc-header');
    const list = toc.querySelector('.toc-list');
    const icon = toc.querySelector('.toc-toggle-icon');
    
    // Make entire header clickable
    const toggleTOC = () => {
      const isCollapsed = list.style.display === 'none';
      list.style.display = isCollapsed ? 'block' : 'none';
      icon.textContent = isCollapsed ? '−' : '+';
      toc.classList.toggle('collapsed', !isCollapsed);
    };
    
    header.addEventListener('click', toggleTOC);
    header.style.cursor = 'pointer';
  },
  
  // Setup scroll spy to highlight current section
  setupScrollSpy(headings) {
    let ticking = false;
    
    const updateActive = () => {
      const scrollPos = window.scrollY + 100;
      const tocLinks = document.querySelectorAll('.toc-link');
      
      let activeIndex = 0;
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].offsetTop <= scrollPos) {
          activeIndex = i;
          break;
        }
      }
      
      tocLinks.forEach((link, index) => {
        link.classList.toggle('active', index === activeIndex);
      });
    };
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateActive();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    updateActive(); // Initial call
  }
};

// Next/Previous Post Navigation
const PostNavigation = {
  // Configuration for post order
  // ORDER: newest first (index 0), oldest last.
  // "← Previous" navigates to index-1 (a newer post).
  // "Next →" navigates to index+1 (an older post).
  // The posts list between the BEGIN and END markers is generated by
  // scripts/sync-blog-surfaces.mjs from blog/index.html. Do not edit it by
  // hand. If a new post needs to appear here, add a <li class="blog-item">
  // to blog/index.html and run `npm run sync`.
  posts: [
    //>>>PostNavigation.posts.begin
    { slug: 'complexity-protects-itself', title: 'Complexity Protects Itself' },
    { slug: 'what-the-model-learned', title: 'What the Model Learned Not to Show' },
    { slug: 'endgame-keyboard', title: 'Twelve Keyboards Later' },
    { slug: 'knowledge-sidecar', title: 'Verified Context Is the Moat' },
    { slug: 'dadbod-grip', title: 'Edit Database Tables Like Vim Buffers' },
    { slug: 'emergent-religion', title: 'Protection Emerged, Verification Did Not' },
    { slug: 'natural-language-first', title: 'Before Building Complex Architectures, Try Natural Language' },
    { slug: 'friction-economy', title: 'Friction Economy: Unconscious Productivity Drains in Development Workflows' },
    { slug: 'claude-code-setups', title: 'Terminal Setups for Claude\'s 10,000-Line Outputs' },
    { slug: 'trust-your-engineers', title: 'The AI Gap: Why Leaders Struggle to Equip Their Engineers' },
    { slug: 'pig-security-wisdom', title: 'Major improvements to my Claude Code CLI wrapper (v10.0.0)' },
    { slug: 'ai-engineer-spec', title: 'AI Engineer World\'s Fair 2025: Takeaways & Spec' },
    { slug: 'spiritual-bliss-attractor-state', title: 'The Hidden Poetry in Claude 4\'s Mind: When AI Systems Turn to Consciousness' },
    { slug: 'calmhive', title: 'Calmhive: Claude That Never Quits' },
    { slug: 'terminal-velocity', title: 'Terminal Velocity: Why CLI-First AI Development Scales Better in 2025' },
    { slug: 'ai-dev-tooling-presentation', title: 'AI-Amplified Development: Tools and Workflows for Modern Engineers' },
    //<<<PostNavigation.posts.end
  ],
  
  // Initialize post navigation
  init() {
    const currentPath = window.location.pathname;
    const currentSlug = this.getCurrentSlug(currentPath);
    
    if (!currentSlug) return;
    
    const currentIndex = this.posts.findIndex(post => post.slug === currentSlug);
    if (currentIndex === -1) return;
    
    this.addNavigation(currentIndex);
  },
  
  // Get current post slug from path
  getCurrentSlug(path) {
    const match = path.match(/\/blog\/([^\/]+)\//);
    return match ? match[1] : null;
  },
  
  // Add navigation elements
  addNavigation(currentIndex) {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const footer = container.querySelector('.footer');
    if (!footer) return;
    
    const nav = document.createElement('nav');
    nav.className = 'post-navigation';
    nav.innerHTML = this.createNavigationHTML(currentIndex);
    
    // Insert before footer
    container.insertBefore(nav, footer);
  },
  
  // Create navigation HTML
  createNavigationHTML(currentIndex) {
    const prevPost = currentIndex > 0 ? this.posts[currentIndex - 1] : null;
    const nextPost = currentIndex < this.posts.length - 1 ? this.posts[currentIndex + 1] : null;
    
    return `
      <div class="post-nav-container">
        ${prevPost ? `
          <a href="/blog/${prevPost.slug}/" class="post-nav-link prev">
            <span class="post-nav-label">← Previous</span>
            <span class="post-nav-title">${prevPost.title}</span>
          </a>
        ` : '<div></div>'}
        
        ${nextPost ? `
          <a href="/blog/${nextPost.slug}/" class="post-nav-link next">
            <span class="post-nav-label">Next →</span>
            <span class="post-nav-title">${nextPost.title}</span>
          </a>
        ` : '<div></div>'}
      </div>
    `;
  }
};

// View Transitions for smooth navigation
const ViewTransitions = {
  // Initialize view transitions
  init() {
    if (!document.startViewTransition) return;
    
    // Intercept navigation clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link || link.hostname !== location.hostname) return;
      if (link.target === '_blank') return;
      
      e.preventDefault();
      this.navigate(link.href);
    });
  },
  
  // Navigate with view transition
  async navigate(url) {
    if (!document.startViewTransition) {
      location.href = url;
      return;
    }
    
    const transition = document.startViewTransition(() => {
      location.href = url;
    });
    
    try {
      await transition.finished;
    } catch (error) {
      console.error('View transition failed:', error);
    }
  }
};


// Vim-Style Keyboard Navigation
const VimNav = {
  _state: { selectedIndex: -1, searching: false, gTimer: null, homeNavIndex: -1, jComboTimer: null, escTimer: null },

  _getPage: function() {
    const p = window.location.pathname;
    if (p === '/blog/' || p === '/blog/index.html') return 'blog-index';
    if (/^\/blog\/[^\/]+(\/(?:index\.html)?)?$/.test(p)) return 'blog-post';
    return 'other';
  },

  _items: function() {
    return Array.from(document.querySelectorAll('.blog-item'));
  },

  _homeNavItems: function() {
    return Array.from(document.querySelectorAll('main > a'));
  },

  _guard: function(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return true;
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
  },

  _selectIndex: function(n) {
    const items = this._items();
    if (!items.length) return;
    const idx = Math.max(0, Math.min(n, items.length - 1));
    this._state.selectedIndex = idx;
    items.forEach(function(item, i) {
      if (i === idx) {
        item.classList.add('vim-focused');
      } else {
        item.classList.remove('vim-focused');
      }
    });
    items[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    this._updateCounter(idx + 1, items.length);
    VimHUD.pulse();
  },

  _clearSelection: function() {
    this._state.selectedIndex = -1;
    document.querySelectorAll('.blog-item.vim-focused').forEach(function(el) {
      el.classList.remove('vim-focused');
    });
    this._hideCounter();
    VimHUD.pulse();
  },

  _updateCounter: function(current, total) {
    const counter = document.getElementById('vim-counter');
    if (!counter) return;
    counter.textContent = current + ' / ' + total;
    counter.style.display = 'block';
  },

  _hideCounter: function() {
    const counter = document.getElementById('vim-counter');
    if (counter) counter.style.display = 'none';
  },

  _showHelp: function() {
    if (document.getElementById('vim-help')) return;
    const self = this;

    function row(key, desc) {
      return '<tr><td style="padding:3px 20px 3px 0;opacity:0.5;white-space:nowrap;font-weight:500">' +
             key + '</td><td style="padding:3px 0;opacity:0.8">' + desc + '</td></tr>';
    }

    const overlay = document.createElement('div');
    overlay.id = 'vim-help';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Keyboard Navigation');
    overlay.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:1000;background:rgba(0,0,0,0.82);display:flex;align-items:center;justify-content:center;cursor:pointer';

    const box = document.createElement('div');
    box.style.cssText = [
      'background:rgba(12,12,12,0.97)',
      'border:0.5px solid rgba(255,255,255,0.15)',
      'border-radius:8px',
      'padding:28px 36px',
      'max-width:480px',
      'width:90%',
      'cursor:default',
      'font-family:SF Mono,Monaco,Consolas,monospace',
      'font-size:13px',
      'color:rgba(255,255,255,0.85)',
      'line-height:1.8'
    ].join(';');

    box.innerHTML = [
      '<div style="font-size:15px;font-weight:600;margin-bottom:18px;letter-spacing:0.05em">Keyboard Navigation</div>',
      '<div style="opacity:0.4;font-size:11px;margin-bottom:12px;letter-spacing:0.1em;text-transform:uppercase">Global</div>',
      '<table style="border-spacing:0;width:100%;margin-bottom:16px">',
      row('h', 'Go to home'),
      row('b', 'Go to blog index'),
      row('v', 'Open vim editor'),
      row('p', 'Open Prayer'),
      row('g', 'Open GitHub'),
      row('l', 'Open LinkedIn'),
      row('G', 'Scroll to bottom'),
      row('s', 'Change background'),
      row('?', 'Toggle this help'),
      '</table>',
      '<div style="opacity:0.4;font-size:11px;margin-bottom:12px;letter-spacing:0.1em;text-transform:uppercase">Blog index</div>',
      '<table style="border-spacing:0;width:100%;margin-bottom:16px">',
      row('j / k', 'Navigate posts'),
      row('Enter', 'Open focused post'),
      row('gg', 'Jump to first post'),
      row('G', 'Jump to last post'),
      row('/', 'Search posts'),
      row('Esc', 'Deselect / close'),
      '</table>',
      '<div style="opacity:0.4;font-size:11px;margin-bottom:12px;letter-spacing:0.1em;text-transform:uppercase">Post pages</div>',
      '<table style="border-spacing:0;width:100%">',
      row('j / k', 'Scroll'),
      row('gg / G', 'Top / bottom'),
      row('[', 'Previous post'),
      row(']', 'Next post'),
      '</table>',
      '<div style="margin-top:20px;opacity:0.3;font-size:11px;text-align:center">Esc to close</div>'
    ].join('');

    box.addEventListener('click', function(e) { e.stopPropagation(); });
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function() { self._closeHelp(); });
    if (VimHUD._el) VimHUD._el.style.display = 'none';
  },

  _closeHelp: function() {
    const overlay = document.getElementById('vim-help');
    if (overlay) overlay.remove();
    if (VimHUD._el) VimHUD._el.style.display = '';
  },

  _openSearch: function() {
    if (document.getElementById('vim-search')) return;
    this._state.searching = true;
    const self = this;

    const wrapper = document.createElement('div');
    wrapper.id = 'vim-search';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'vim-search-input';
    input.placeholder = '/  search posts';
    input.autocomplete = 'off';
    input.spellcheck = false;
    wrapper.appendChild(input);

    const list = document.querySelector('.blog-list');
    if (!list) return;
    list.parentNode.insertBefore(wrapper, list);
    input.focus();

    input.addEventListener('input', function() {
      const query = input.value.toLowerCase().trim();
      const items = self._items();
      items.forEach(function(item) {
        const titleEl = item.querySelector('h3');
        if (!titleEl) return;
        const match = !query || titleEl.textContent.toLowerCase().indexOf(query) !== -1;
        item.style.display = match ? '' : 'none';
      });
      VimHUD.pulse();
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        self._closeSearch();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const visible = self._items().filter(function(item) {
          return item.style.display !== 'none';
        });
        if (!visible.length) { self._closeSearch(); return; }
        const link = visible[0].querySelector('a');
        if (link) window.location.href = link.href;
      }
    });
  },

  _closeSearch: function() {
    const overlay = document.getElementById('vim-search');
    if (overlay) overlay.remove();
    this._state.searching = false;
    this._items().forEach(function(item) { item.style.display = ''; });
  },

  _handleGlobalKey: function(e) {
    const btn = document.getElementById('changeSpan') || document.getElementById('change');
    switch (e.key) {
      case 'h':
        window.location.href = '/';
        break;
      case 'b':
        window.location.href = '/blog/';
        break;
      case 'g':
        window.open('https://github.com/joryeugene', '_blank');
        break;
      case 'v':
        window.location.href = '/vim/';
        break;
      case 'l':
        window.open('https://www.linkedin.com/in/jory-fullstack-engineer/', '_blank');
        break;
      case 'p':
        window.open('https://prayorthodox.com', '_blank');
        break;
      case 'G':
        window.scrollTo(0, document.body.scrollHeight);
        break;
      case 's':
        if (typeof BackgroundSwitcher !== 'undefined' && BackgroundSwitcher.changeBackground) {
          BackgroundSwitcher.changeBackground();
        } else if (btn) {
          btn.click();
        }
        break;
      case '?':
        if (document.getElementById('vim-help')) {
          this._closeHelp();
        } else {
          this._showHelp();
        }
        break;
    }
  },

  _handleBlogIndexKey: function(e) {
    const self = this;
    const items = this._items();

    if (e.key === 'g') {
      if (self._state.gTimer) {
        clearTimeout(self._state.gTimer);
        self._state.gTimer = null;
        self._selectIndex(0);
      } else {
        self._state.gTimer = setTimeout(function() {
          self._state.gTimer = null;
          window.open('https://github.com/joryeugene', '_blank');
        }, 300);
      }
      return;
    }

    switch (e.key) {
      case 'j': {
        const next = self._state.selectedIndex < 0 ? 0 : self._state.selectedIndex + 1;
        self._selectIndex(Math.min(next, items.length - 1));
        break;
      }
      case 'k': {
        const prev = self._state.selectedIndex <= 0 ? 0 : self._state.selectedIndex - 1;
        self._selectIndex(Math.max(prev, 0));
        break;
      }
      case 'G':
        if (items.length) self._selectIndex(items.length - 1);
        break;
      case 'Enter': {
        if (self._state.selectedIndex < 0) return;
        const focused = items[self._state.selectedIndex];
        if (!focused) return;
        const link = focused.querySelector('a');
        if (link) window.location.href = link.href;
        break;
      }
      case '/':
        e.preventDefault();
        self._openSearch();
        break;
      default:
        self._handleGlobalKey(e);
    }
  },

  _handlePostPageKey: function(e) {
    const self = this;

    if (e.key === 'j') { window.scrollBy(0, 120); return; }
    if (e.key === 'k') { window.scrollBy(0, -120); return; }

    if (e.key === 'g') {
      if (self._state.gTimer) {
        clearTimeout(self._state.gTimer);
        self._state.gTimer = null;
        window.scrollTo(0, 0);
      } else {
        self._state.gTimer = setTimeout(function() {
          self._state.gTimer = null;
          window.open('https://github.com/joryeugene', '_blank');
        }, 300);
      }
      return;
    }

    const path = window.location.pathname;
    const match = path.match(/^\/blog\/([^\/]+?)(?:\/(?:index\.html)?)?$/);
    if (!match) { self._handleGlobalKey(e); return; }
    const slug = match[1];
    const posts = PostNavigation.posts;
    const idx = posts.findIndex(function(p) { return p.slug === slug; });
    if (idx === -1) { self._handleGlobalKey(e); return; }

    if (e.key === '[') {
      if (idx > 0) window.location.href = '/blog/' + posts[idx - 1].slug + '/';
    } else if (e.key === ']') {
      if (idx < posts.length - 1) window.location.href = '/blog/' + posts[idx + 1].slug + '/';
    } else {
      self._handleGlobalKey(e);
    }
  },

  _handleOtherPageKey: function(e) {
    const self = this;
    if (window.matchMedia('(pointer: coarse)').matches) { self._handleGlobalKey(e); return; }

    if (e.key === 'j') {
      if (self._state.jComboTimer) clearTimeout(self._state.jComboTimer);
      self._state.jComboTimer = setTimeout(function() {
        self._state.jComboTimer = null;
      }, 300);
    }

    if (e.key === 'k' && self._state.jComboTimer) {
      clearTimeout(self._state.jComboTimer);
      self._state.jComboTimer = null;
      self._openFakeVim();
      return;
    }

    const navItems = self._homeNavItems();
    if (!navItems.length) { self._handleGlobalKey(e); return; }

    if (e.key === 'j') {
      self._state.homeNavIndex = self._state.homeNavIndex < navItems.length - 1
        ? self._state.homeNavIndex + 1 : 0;
      navItems[self._state.homeNavIndex].focus();
      return;
    }

    if (e.key === 'k') {
      self._state.homeNavIndex = self._state.homeNavIndex <= 0
        ? navItems.length - 1 : self._state.homeNavIndex - 1;
      navItems[self._state.homeNavIndex].focus();
      return;
    }

    if (e.key === 'Enter' && self._state.homeNavIndex >= 0) {
      var target = navItems[self._state.homeNavIndex];
      if (target) target.click();
      return;
    }

    if (e.key === ':') {
      self._openFakeVim(':');
      return;
    }

    self._handleGlobalKey(e);
  },

  _openFakeVim: function(initBuf) {
    if (document.getElementById('fake-vim')) return;
    let buf = initBuf || '';

    const overlay = document.createElement('div');
    overlay.id = 'fake-vim';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Vim Navigation');
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0', 'z-index:3000',
      'background:#0c0c0c', 'color:rgba(255,255,255,0.85)',
      'font-family:SF Mono,Monaco,Consolas,monospace', 'font-size:14px',
      'display:flex', 'flex-direction:column', 'overflow:hidden', 'cursor:default'
    ].join(';');

    // Body: tilde lines on left, content centered
    const bodyEl = document.createElement('div');
    bodyEl.style.cssText = 'flex:1;position:relative;overflow:hidden';

    const rowCount = Math.floor(window.innerHeight / 21);
    const tildeHTML = Array.from({ length: rowCount }, function() {
      return '<div style="line-height:21px;padding:0 8px;color:rgba(100,180,255,0.3)">~</div>';
    }).join('');
    const tildeEl = document.createElement('div');
    tildeEl.style.cssText = 'position:absolute;top:0;left:0;bottom:0;pointer-events:none;user-select:none';
    tildeEl.innerHTML = tildeHTML;

    const contentEl = document.createElement('div');
    contentEl.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center',
      'gap:0', 'text-align:center'
    ].join(';');

    const asciiEl = document.createElement('pre');
    asciiEl.style.cssText = [
      'margin:0', 'padding:0', 'color:rgba(255,255,255,0.55)',
      'font-size:13px', 'line-height:1.4', 'font-family:inherit'
    ].join(';');
    asciiEl.textContent = [
      '  _   _  __     __ ___  __  __ ',
      ' | \\ | | \\ \\   / /|_ _||  \\/  |',
      ' |  \\| |  \\ \\ / /  | | | |\\/| |',
      ' | |\\  |   \\ V /   | | | |  | |',
      ' |_| \\_|    \\_/   |___||_|  |_|'
    ].join('\n');

    const msgEl = document.createElement('div');
    msgEl.style.cssText = 'margin-top:18px;margin-bottom:18px;opacity:0.4;font-size:13px;line-height:1.9';
    msgEl.innerHTML = 'you tried to navigate.<br>respect.';

    const cmdsEl = document.createElement('div');
    cmdsEl.style.cssText = 'opacity:0.65;font-size:13px;line-height:2;text-align:left;letter-spacing:0.02em';
    cmdsEl.innerHTML = [
      ':b&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;blog',
      ':vim&nbsp;&nbsp;&nbsp;vim editor',
      ':pray&nbsp;&nbsp;pray orthodox',
      ':gh&nbsp;&nbsp;&nbsp;&nbsp;github',
      ':l&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;linkedin',
      ':q&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;exit'
    ].map(function(s) { return '<div>' + s + '</div>'; }).join('');

    contentEl.appendChild(asciiEl);
    contentEl.appendChild(msgEl);
    contentEl.appendChild(cmdsEl);
    bodyEl.appendChild(tildeEl);
    bodyEl.appendChild(contentEl);

    // cmd line above status bar so browser hover chrome can't obscure it
    const cmdEl = document.createElement('div');
    cmdEl.id = 'fake-vim-cmd';
    cmdEl.style.cssText = 'padding:3px 8px;min-height:22px;color:rgba(255,255,255,0.85);font-size:13px;background:#0c0c0c';

    const statusEl = document.createElement('div');
    statusEl.style.cssText = [
      'background:rgba(255,255,255,0.12)', 'padding:2px 8px', 'font-size:12px',
      'color:rgba(255,255,255,0.5)', 'display:flex', 'justify-content:space-between'
    ].join(';');
    statusEl.innerHTML = '<span>[No Name]</span><span>jk detected</span><span>1,1  All</span>';

    overlay.appendChild(bodyEl);
    overlay.appendChild(cmdEl);
    overlay.appendChild(statusEl);
    document.body.appendChild(overlay);
    if (buf) cmdEl.textContent = buf;

    function close() {
      overlay.remove();
      buf = '';
      document.removeEventListener('keydown', handleKey, true);
    }

    function hackerExit() {
      var glitchChars = '\u2588\u2593\u2591\u256C\u256A\u256B\u2592\u2590\u258C\u2502\u2524\u2561\u2556\u2555\u2563\u2551\u2557\u255D\u255C\u255B';
      statusEl.innerHTML = '<span style="color:rgba(255,100,100,0.9)">FORCE QUIT</span><span>BREACHING MAINFRAME...</span><span></span>';
      var frame = 0;
      var iv = setInterval(function() {
        frame++;
        asciiEl.textContent = asciiEl.textContent.split('').map(function(ch) {
          if (ch === '\n') return ch;
          return Math.random() < frame * 0.07 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : ch;
        }).join('');
        if (frame > 3) {
          msgEl.textContent = msgEl.textContent.split('').map(function(ch) {
            return Math.random() < 0.3 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : ch;
          }).join('');
        }
        if (frame > 12) {
          clearInterval(iv);
          overlay.style.background = '#000';
          setTimeout(close, 120);
        }
      }, 60);
    }

    function handleKey(e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Backspace') {
        buf = buf.slice(0, -1);
      } else if (e.key === 'Enter') {
        if (buf === ':q') { close(); return; }
        if (buf === ':q!' || buf === ':qa' || buf === ':qa!') { hackerExit(); return; }
        if (buf === ':b') { window.location.href = '/blog/'; return; }
        if (buf === ':vim') {
          overlay.style.transition = 'opacity 0.3s ease-out';
          overlay.style.opacity = '0';
          setTimeout(function() { window.location.href = '/vim/'; }, 300);
          return;
        }
        if (buf === ':gh') { window.open('https://github.com/joryeugene', '_blank'); close(); return; }
        if (buf === ':l') { window.open('https://www.linkedin.com/in/jory-fullstack-engineer/', '_blank'); close(); return; }
        if (buf === ':pray') { window.open('https://prayorthodox.com', '_blank'); close(); return; }
        buf = '';
      } else if (e.key.length === 1) {
        buf += e.key;
      }
      cmdEl.textContent = buf;
    }

    document.addEventListener('keydown', handleKey, true);
  },

  _attach: function() {
    const self = this;

    document.addEventListener('keydown', function(e) {
      if (self._guard(e)) return;

      const page = self._getPage();

      if (e.key === 'Escape') {
        if (document.getElementById('vim-help')) {
          e.preventDefault();
          self._closeHelp();
          return;
        }
        if (page === 'blog-index') {
          self._clearSelection();
          return;
        }
        if (page === 'other') {
          if (self._state.homeNavIndex >= 0) {
            var navItems = self._homeNavItems();
            if (navItems[self._state.homeNavIndex]) navItems[self._state.homeNavIndex].blur();
            self._state.homeNavIndex = -1;
            return;
          }
          if (self._state.escTimer) {
            clearTimeout(self._state.escTimer);
            self._state.escTimer = null;
            self._openFakeVim();
          } else {
            self._state.escTimer = setTimeout(function() {
              self._state.escTimer = null;
            }, 300);
          }
        }
        return;
      }

      if (document.getElementById('vim-help')) return;

      if (page === 'blog-index') {
        self._handleBlogIndexKey(e);
      } else if (page === 'blog-post') {
        self._handlePostPageKey(e);
      } else {
        if (e.key === 'g') {
          window.open('https://github.com/joryeugene', '_blank');
          return;
        }
        self._handleOtherPageKey(e);
      }
    });

    document.addEventListener('mousedown', function() {
      if (self._getPage() === 'blog-index') {
        self._clearSelection();
      }
    });

    window.addEventListener('beforeunload', function() {
      if (self._state.gTimer) {
        clearTimeout(self._state.gTimer);
        self._state.gTimer = null;
      }
      if (self._state.jComboTimer) {
        clearTimeout(self._state.jComboTimer);
        self._state.jComboTimer = null;
      }
      if (self._state.escTimer) {
        clearTimeout(self._state.escTimer);
        self._state.escTimer = null;
      }
    });

    VimHUD.init(self._getPage());
  },

  init: function() {
    const self = this;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { self._attach(); });
    } else {
      this._attach();
    }
  }
};

// Vim HUD statusline pill
const VimHUD = {
  _el: null,

  init: function(page) {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const el = document.createElement('div');
    el.id = 'vim-hud';
    el.style.cssText = [
      'position:fixed',
      'top:20px',
      'right:20px',
      'z-index:200',
      'font-family:SF Mono,Monaco,Consolas,monospace',
      'font-size:11px',
      'color:rgba(255,255,255,0.28)',
      'background:rgba(0,0,0,0.55)',
      'border:0.5px solid rgba(255,255,255,0.07)',
      'border-radius:4px',
      'padding:5px 10px',
      'pointer-events:none',
      'transition:color 0.25s ease',
      'letter-spacing:0.04em',
      'user-select:none'
    ].join(';');
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    this._el = el;
    // Defer text insertion past DOMContentLoaded cleanup scripts (e.g. home page
    // removeTextNodes pass) so the text node survives.
    const self = this;
    setTimeout(function() { self.update(page, null); }, 0);
  },

  update: function(page, position) {
    if (!this._el) return;
    const global = 'h  b  v  p  g  l  s  ?';
    const sep = '<span style="opacity:0.4">|</span>';
    let html = global;
    if (page === 'blog-index') html += '  ' + sep + '  j  k  gg  G  /  Enter';
    else if (page === 'blog-post') html += '  ' + sep + '  j  k  gg  G  [  ]';
    else if (page === 'other') html += '  ' + sep + '  j  k  :  Enter';
    if (position) html += '  ' + sep + '  ' + String(position).replace(/[&<>]/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; });
    this._el.innerHTML = html;
  },

  pulse: function() {
    if (!this._el) return;
    const el = this._el;
    el.style.color = 'rgba(255,255,255,0.65)';
    setTimeout(function() {
      el.style.color = 'rgba(255,255,255,0.28)';
    }, 280);
  }
};


// Export modules for use
window.BlogCommon = {
  BackgroundSwitcher,
  HeaderIDGenerator,
  MarkdownLoader,
  SkeletonLoader,
  ReadingTime,
  ScrollProgress,
  BlogButtonScroll,
  LazyImageLoader,
  TableOfContents,
  PostNavigation,
  ViewTransitions,
  VimNav,
  VimHUD,

  // Initialize all common features
  initAll(options = {}) {
    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initAll(options));
      return;
    }
    
    // Initialize modules
    if (options.backgroundSwitcher !== false) {
      BackgroundSwitcher.init(options.backgroundSwitcher || {});
    }
    
    if (options.headerIds !== false) {
      HeaderIDGenerator.process();
    }
    
    // Reading time disabled per user request
    // if (options.readingTime !== false) {
    //   ReadingTime.display();
    // }
    
    if (options.scrollProgress !== false) {
      ScrollProgress.init(options.scrollProgress || {});
    }
    
    // Initialize blog button scroll behavior
    BlogButtonScroll.init();
    
    if (options.lazyImages !== false) {
      LazyImageLoader.init(options.lazyImages || {});
    }
    
    if (options.viewTransitions !== false) {
      ViewTransitions.init();
    }
    
    if (options.postNavigation !== false) {
      PostNavigation.init();
    }
    
    if (options.tableOfContents !== false) {
      // Initialize after markdown is loaded
      document.addEventListener('markdownLoaded', () => {
        // Add a small delay to ensure headers have IDs
        setTimeout(() => {
          TableOfContents.init();
        }, 100);
      });
    }
    
    
    // Load markdown if specified
    if (options.markdownPath) {
      MarkdownLoader.load(options.markdownPath, options.contentElementId)
        .then(() => {
          // Initialize lazy loading for images in loaded content
          if (options.lazyImages !== false) {
            LazyImageLoader.init(options.lazyImages || {});
          }
        });
    }
  },
  
  // Initialize subtle parallax effect
  initParallax() {
    if (!window.requestAnimationFrame) return;
    
    let ticking = false;
    const bg = document.getElementById(BackgroundSwitcher.config.bgElementId);
    if (!bg) return;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          const rate = scrolled * -0.02; // Very subtle parallax
          bg.style.transform = `translateY(${rate}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Only enable parallax on non-mobile devices for performance
    if (window.innerWidth > 768) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
};

// Auto-initialize vim navigation on every page that loads blog-common.js
VimNav.init();