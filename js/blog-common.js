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
  posts: [
    { slug: 'emergent-religion', title: 'Protection Emerged, Verification Did Not' },
    { slug: 'natural-language-first', title: 'Before Building Complex Architectures, Try Natural Language' },
    { slug: 'friction-economy', title: 'Friction Economy: Unconscious Productivity Drains in Development Workflows' },
    { slug: 'claude-code-setups', title: 'Terminal Setups for Claude\'s 10,000-Line Outputs' },
    { slug: 'trust-your-engineers', title: 'The AI Gap: Why Leaders Struggle to Equip Their Engineers' },
    { slug: 'pig-security-wisdom', title: 'Major improvements to my Claude Code CLI wrapper (v10.0.0) 🚀' },
    { slug: 'ai-engineer-spec', title: 'AI Engineer World\'s Fair 2025: Takeaways & Spec' },
    { slug: 'spiritual-bliss-attractor-state', title: 'The Hidden Poetry in Claude 4\'s Mind: When AI Systems Turn to Consciousness' },
    { slug: 'calmhive', title: 'Calmhive: Claude That Never Quits' },
    { slug: 'terminal-velocity', title: 'Terminal Velocity: Why CLI-First AI Development Scales Better in 2025' },
    { slug: 'ai-dev-tooling-presentation', title: 'AI-Amplified Development: Tools and Workflows for Modern Engineers' }
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