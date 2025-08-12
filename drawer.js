/**
 * Drawer - Multi-instance sliding drawer component
 */
class Drawer {
    static instances = new Map();
    static activeDrawer = null;

    constructor(element, options = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        
        if (!this.element) {
            throw new Error(`Drawer element not found: ${element}`);
        }

        // Prevent duplicate instances
        if (Drawer.instances.has(this.element)) {
            return Drawer.instances.get(this.element);
        }

        this.id = this.element.id || `drawer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.options = {
            backdrop: true,
            keyboard: true,
            swipeThreshold: 100,
            animationDuration: 300,
            autoFocus: true,
            showOnLoad: false,
            ...options
        };

        // Instance state
        this.isShown = false;
        this.isDragging = false;
        this.startY = 0;
        this.currentY = 0;
        this.initialTransform = '';
        this.isTransitioning = false;

        // Bound methods for event cleanup
        this._boundMethods = {};

        this._init();
        Drawer.instances.set(this.element, this);

        // Auto-show on load if option is enabled
        if (this.options.showOnLoad) {
            // Delay to ensure DOM is fully ready
            setTimeout(() => this.show(), 100);
        }
    }

    // Public API
    show() {
        if (this.isShown || this.isTransitioning) return;

        // Close any other active drawer
        if (Drawer.activeDrawer && Drawer.activeDrawer !== this) {
            Drawer.activeDrawer.hide();
        }

        const showEvent = this._createEvent('show.bs.drawer');
        this.element.dispatchEvent(showEvent);
        if (showEvent.defaultPrevented) return;

        this.isTransitioning = true;
        this.isShown = true;
        Drawer.activeDrawer = this;

        // DOM updates
        document.body.classList.add('drawer-open');
        this.overlay.classList.add('show');
        
        // Enhanced autoFocus with better element selection
        if (this.options.autoFocus) {
            this._setFocus();
        }

        // Complete transition
        setTimeout(() => {
            this.isTransitioning = false;
            const shownEvent = this._createEvent('shown.bs.drawer');
            this.element.dispatchEvent(shownEvent);
        }, this.options.animationDuration);
    }

    hide() {
        if (!this.isShown || this.isTransitioning) return;

        const hideEvent = this._createEvent('hide.bs.drawer');
        this.element.dispatchEvent(hideEvent);
        if (hideEvent.defaultPrevented) return;

        this.isTransitioning = true;
        this.isShown = false;
        
        if (Drawer.activeDrawer === this) {
            Drawer.activeDrawer = null;
        }

        // DOM updates
        document.body.classList.remove('drawer-open');
        this.overlay.classList.remove('show');
        this._resetTransform();

        // Return focus to trigger element if available
        this._restoreFocus();

        // Complete transition
        setTimeout(() => {
            this.isTransitioning = false;
            const hiddenEvent = this._createEvent('hidden.bs.drawer');
            this.element.dispatchEvent(hiddenEvent);
        }, this.options.animationDuration);
    }

    toggle() {
        this.isShown ? this.hide() : this.show();
    }

    dispose() {
        this._removeEventListeners();
        this.element.removeAttribute('data-bs-drawer');
        Drawer.instances.delete(this.element);
        
        if (Drawer.activeDrawer === this) {
            Drawer.activeDrawer = null;
        }
        
        delete this.element.drawerInstance;
    }

    handleFormSubmit(callback) {
        if (this.form) {
            this.form.addEventListener('submit', callback);
        }
    }

    // Private methods
    _init() {
        this._setElements();
        this._addEventListeners();
        this.element.drawerInstance = this;
        this.element.setAttribute('data-bs-drawer', this.id);
    }

    _setElements() {
        this.overlay = this.element.closest('.drawer-overlay') || this.element.parentElement;
        this.handle = this.element.querySelector('.drawer-handle');
        this.closeBtn = this.element.querySelector('[data-bs-dismiss="drawer"], .btn-close');
        this.form = this.element.querySelector('form');
        
        // Focusable element selection
        this.focusableElements = this.element.querySelectorAll(
            'input:not([disabled]):not([type="hidden"]), ' +
            'select:not([disabled]), ' +
            'textarea:not([disabled]), ' +
            'button:not([disabled]):not([data-bs-dismiss="drawer"]), ' +
            '[tabindex]:not([tabindex="-1"]):not([disabled]), ' +
            'a[href]:not([disabled])'
        );
    }

    _addEventListeners() {
        // Bind methods to maintain context
        this._boundMethods = {
            handleKeydown: this._handleKeydown.bind(this),
            handleTouchStart: this._handleTouchStart.bind(this),
            handleDrawerTouchStart: this._handleDrawerTouchStart.bind(this),
            handleTouchMove: this._handleTouchMove.bind(this),
            handleTouchEnd: this._handleTouchEnd.bind(this),
            handleResize: this._handleResize.bind(this),
            handleBackdropClick: this._handleBackdropClick.bind(this),
            handleCloseClick: this._handleCloseClick.bind(this)
        };

        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', this._boundMethods.handleCloseClick);
        }

        // Backdrop click
        if (this.options.backdrop) {
            this.overlay.addEventListener('click', this._boundMethods.handleBackdropClick);
        }

        // Keyboard events
        if (this.options.keyboard) {
            document.addEventListener('keydown', this._boundMethods.handleKeydown);
        }

        // Touch events
        if (this.handle) {
            this.handle.addEventListener('touchstart', this._boundMethods.handleTouchStart, { passive: false });
        }
        
        this.element.addEventListener('touchstart', this._boundMethods.handleDrawerTouchStart, { passive: false });
        document.addEventListener('touchmove', this._boundMethods.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this._boundMethods.handleTouchEnd);

        // Window resize
        window.addEventListener('resize', this._boundMethods.handleResize);
    }

    _removeEventListeners() {
        Object.entries(this._boundMethods).forEach(([key, method]) => {
            if (key === 'handleKeydown') {
                document.removeEventListener('keydown', method);
            } else if (key === 'handleTouchMove') {
                document.removeEventListener('touchmove', method);
            } else if (key === 'handleTouchEnd') {
                document.removeEventListener('touchend', method);
            } else if (key === 'handleResize') {
                window.removeEventListener('resize', method);
            }
        });

        if (this.closeBtn) {
            this.closeBtn.removeEventListener('click', this._boundMethods.handleCloseClick);
        }
        
        if (this.overlay) {
            this.overlay.removeEventListener('click', this._boundMethods.handleBackdropClick);
        }
    }

    _handleKeydown(e) {
        if (e.key === 'Escape' && this.isShown && Drawer.activeDrawer === this) {
            this.hide();
        }
        
        // Tab trapping for accessibility
        if (e.key === 'Tab' && this.isShown && Drawer.activeDrawer === this) {
            this._trapFocus(e);
        }
    }

    _handleCloseClick() {
        this.hide();
    }

    _handleBackdropClick(e) {
        if (e.target === this.overlay && this.isShown) {
            this.hide();
        }
    }

    _handleTouchStart(e) {
        if (!this._isMobile() || !this.isShown || this.isTransitioning) return;
        
        this.startY = e.touches[0].clientY;
        this.currentY = this.startY;
        this.isDragging = true;
        this.element.style.transition = 'none';
        this.initialTransform = this.element.style.transform || '';
    }

    _handleDrawerTouchStart(e) {
        if (!this._isMobile() || !this.isShown || this.isTransitioning) return;
        
        const rect = this.element.getBoundingClientRect();
        const touchY = e.touches[0].clientY;
        const headerHeight = 80;
        
        if (touchY - rect.top < headerHeight) {
            this._handleTouchStart(e);
        }
    }

    _handleTouchMove(e) {
        if (!this.isDragging || !this._isMobile() || !this.isShown || Drawer.activeDrawer !== this) return;
        
        e.preventDefault();
        this.currentY = e.touches[0].clientY;
        const deltaY = Math.max(0, this.currentY - this.startY);
        
        this.element.style.transform = `translateY(${deltaY}px)`;
    }

    _handleTouchEnd() {
        if (!this.isDragging || !this._isMobile()) return;
        
        this.isDragging = false;
        this.element.style.transition = `transform ${this.options.animationDuration}ms ease-out`;

        const deltaY = this.currentY - this.startY;
        
        if (deltaY > this.options.swipeThreshold) {
            this.hide();
        } else {
            this._resetTransform();
        }
    }

    _handleResize() {
        if (!this._isMobile() && this.isDragging) {
            this.isDragging = false;
            this._resetTransform();
        }
    }

    _resetTransform() {
        this.element.style.transform = '';
        this.element.style.transition = '';
    }

    // Enhanced focus management
    _setFocus() {
        if (this.focusableElements.length > 0) {
            // Store current focus for restoration
            this.previouslyFocused = document.activeElement;
            
            // Focus first focusable element
            setTimeout(() => {
                this.focusableElements[0].focus();
            }, this.options.animationDuration);
        }
    }

    // Restore focus when closing
    _restoreFocus() {
        if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function') {
            this.previouslyFocused.focus();
            this.previouslyFocused = null;
        }
    }

    // Tab trapping for accessibility
    _trapFocus(e) {
        if (this.focusableElements.length === 0) return;

        const firstElement = this.focusableElements[0];
        const lastElement = this.focusableElements[this.focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    _createEvent(type, detail = {}) {
        return new CustomEvent(type, {
            bubbles: true,
            cancelable: true,
            detail
        });
    }

    _isMobile() {
        return window.innerWidth < 768;
    }

    // Static methods
    static getInstance(element) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        return Drawer.instances.get(el) || null;
    }

    static getOrCreateInstance(element, config = {}) {
        return Drawer.getInstance(element) || new Drawer(element, config);
    }

    static closeAll() {
        Drawer.instances.forEach(drawer => {
            if (drawer.isShown) drawer.hide();
        });
    }
}

// Auto-initialization following your MVC pattern
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all drawers with data-bs-toggle="drawer"
    document.querySelectorAll('[data-bs-toggle="drawer"]').forEach(trigger => {
        const target = trigger.getAttribute('data-bs-target') || trigger.getAttribute('href');
        if (target) {
            const drawer = Drawer.getOrCreateInstance(target);
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                drawer.show();
            });
        }
    });
});

// Global exposure
window.Drawer = Drawer;
