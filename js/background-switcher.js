/**
 * Background Image Switcher
 * Creates a smooth transition between background images
 * Author: Jory Pestorious (calmhive)
 */

// Configuration for image sets
const BackgroundSwitcher = {
    // Image sets for different screen sizes
    IMAGE_SETS: {
        desktop: ["bg.jpg", "bg2.jpg", "bg3.jpg"],
        mobileLandscape: ["bg_mobile.jpg", "bg_mobile2.jpg", "bg_mobile3.jpg"],
        mobilePortrait: ["bg_mobilev.jpg", "bg_mobilev2.jpg", "bg_mobilev3.jpg"]
    },
    
    // Media query definitions
    mediaQueries: {
        desktop: window.matchMedia("(min-width: 741px)"),
        mobileLandscape: window.matchMedia("(orientation: landscape) and (max-width: 740px)"),
        mobilePortrait: window.matchMedia("(orientation: portrait) and (max-width: 740px)")
    },
    
    // State variables
    currentImageIndex: 0,
    activeBackground: 1,
    
    // DOM elements (will be set during initialization)
    bg1: null,
    bg2: null,
    changeButton: null,
    
    // Base path for images (can be overridden for subdirectories)
    imagePath: 'jpg/',
    
    /**
     * Initialize the background switcher
     * @param {Object} options - Configuration options
     * @param {string} options.containerId - ID of the container element (default: "bg-container")
     * @param {string} options.buttonId - ID of the button span element (default: "changeSpan")
     * @param {string} options.imagePath - Path to the images directory (default: "jpg/")
     * @param {boolean} options.useContainer - Whether to use the container-based approach (default: true)
     */
    init: function(options = {}) {
        // Set default options
        const defaults = {
            containerId: "bg-container",
            buttonId: "changeSpan",
            imagePath: "/jpg/",
            useContainer: true
        };
        
        // Merge options with defaults
        const config = { ...defaults, ...options };
        
        // Set the image path
        this.imagePath = config.imagePath;
        
        // Get the button element
        this.changeButton = document.getElementById(config.buttonId);
        
        if (config.useContainer) {
            // Get container-based elements
            const container = document.getElementById(config.containerId);
            this.bg1 = container.querySelector('.bg:nth-child(1)');
            this.bg2 = container.querySelector('.bg:nth-child(2)');
            
            // Ensure the bg divs have the necessary classes
            this.bg1.classList.add('active');
            this.bg1.classList.add('initial');
            this.bg2.classList.remove('active');
            
            // Set initial background for bg1
            const initialImageSet = this.getCurrentImageSet();
            this.bg1.style.backgroundImage = `url(${this.imagePath}${initialImageSet[0]})`;
        } else {
            // Single background div approach
            this.bg = document.getElementById('bg');
            
            // Set initial background
            const initialImageSet = this.getCurrentImageSet();
            if (this.bg.style.backgroundImage) {
                // If the background image is already set, make sure it uses the correct path
                this.bg.style.backgroundImage = this.bg.style.backgroundImage.replace(
                    /url\(['"](.*?)['"]\)/,
                    `url('${this.imagePath}${initialImageSet[0]}')`
                );
            } else {
                this.bg.style.backgroundImage = `url(${this.imagePath}${initialImageSet[0]})`;
            }
        }
        
        // Add event listener to the button
        if (this.changeButton) {
            this.changeButton.addEventListener("click", () => this.changeBackground());
            this.changeButton.addEventListener("keypress", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    this.changeBackground();
                }
            });
        }
        
        // Add resize event listener
        window.addEventListener("resize", () => this.handleResize());
        
        // Preload next images
        this.preloadNextImages();
    },
    
    /**
     * Get the current image set based on screen size
     * @returns {Array} The current image set
     */
    getCurrentImageSet: function() {
        if (this.mediaQueries.desktop.matches) return this.IMAGE_SETS.desktop;
        if (this.mediaQueries.mobileLandscape.matches) return this.IMAGE_SETS.mobileLandscape;
        if (this.mediaQueries.mobilePortrait.matches) return this.IMAGE_SETS.mobilePortrait;
        return this.IMAGE_SETS.desktop;
    },
    
    /**
     * Load an image asynchronously
     * @param {string} src - The image source
     * @returns {Promise} A promise that resolves when the image is loaded
     */
    loadImage: async function(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    },
    
    /**
     * Change the background image
     */
    changeBackground: async function() {
        try {
            // Clear any text selection
            window.getSelection()?.removeAllRanges();
            
            // Update image index
            this.currentImageIndex = (this.currentImageIndex + 1) % this.getCurrentImageSet().length;
            const imageSet = this.getCurrentImageSet();
            const imageName = imageSet[this.currentImageIndex];
            
            if (this.bg1 && this.bg2) {
                // Container-based approach with two background divs
                const inactiveBg = this.activeBackground === 1 ? this.bg2 : this.bg1;
                const activeBg = this.activeBackground === 1 ? this.bg1 : this.bg2;
                
                // Load the new image
                await this.loadImage(`${this.imagePath}${imageName}`);
                
                // Set the background image on the inactive div
                inactiveBg.style.backgroundImage = `url(${this.imagePath}${imageName})`;
                
                // Swap the active/inactive classes
                inactiveBg.classList.remove('inactive');
                inactiveBg.classList.add('active');
                
                activeBg.classList.remove('active');
                activeBg.classList.add('inactive');
                
                // Toggle the active background
                this.activeBackground = this.activeBackground === 1 ? 2 : 1;
            } else if (this.bg) {
                // Single background div approach
                this.bg.classList.add('loading');
                
                // Load the new image
                await this.loadImage(`${this.imagePath}${imageName}`);
                
                // Set the background image
                this.bg.style.backgroundImage = `url(${this.imagePath}${imageName})`;
                
                // Remove the loading class
                this.bg.classList.remove('loading');
            }
        } catch (error) {
            console.error('Error changing background:', error);
            
            // Fallback to the default image
            const defaultImage = this.getCurrentImageSet()[0];
            
            if (this.bg1 && this.bg2) {
                if (this.activeBackground === 1) {
                    this.bg1.style.backgroundImage = `url(${this.imagePath}${defaultImage})`;
                } else {
                    this.bg2.style.backgroundImage = `url(${this.imagePath}${defaultImage})`;
                }
            } else if (this.bg) {
                this.bg.style.backgroundImage = `url(${this.imagePath}${defaultImage})`;
            }
        }
    },
    
    /**
     * Handle window resize
     */
    handleResize: async function() {
        try {
            // Get the current image set
            const imageSet = this.getCurrentImageSet();
            const imageName = imageSet[this.currentImageIndex];
            
            if (this.bg1 && this.bg2) {
                // Container-based approach
                const activeBg = this.activeBackground === 1 ? this.bg1 : this.bg2;
                
                // Load the image
                await this.loadImage(`${this.imagePath}${imageName}`);
                
                // Set the background image
                activeBg.style.backgroundImage = `url(${this.imagePath}${imageName})`;
            } else if (this.bg) {
                // Single background div approach
                this.bg.classList.add('loading');
                
                // Load the image
                await this.loadImage(`${this.imagePath}${imageName}`);
                
                // Set the background image
                this.bg.style.backgroundImage = `url(${this.imagePath}${imageName})`;
                
                // Remove the loading class
                this.bg.classList.remove('loading');
            }
            
            // Preload next images
            this.preloadNextImages();
        } catch (error) {
            console.error('Error handling resize:', error);
        }
    },
    
    /**
     * Preload the next images
     */
    preloadNextImages: async function() {
        try {
            const imageSet = this.getCurrentImageSet();
            const nextIndex = (this.currentImageIndex + 1) % imageSet.length;
            const nextImage = imageSet[nextIndex];
            
            await this.loadImage(`${this.imagePath}${nextImage}`);
        } catch (error) {
            console.error('Error preloading images:', error);
        }
    }
};
