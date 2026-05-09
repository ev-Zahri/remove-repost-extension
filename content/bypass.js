(() => {
    // ONLY run if this is our automated bot tab!
    // TikTok servers return 404 if we use query parameters on /profile, so we use a hash fragment instead.
    if (window.location.hash === '#ttbot') {
        try { sessionStorage.setItem('ttbot_active', 'true'); } catch (e) {}
    }
    
    let isBot = false;
    try { isBot = sessionStorage.getItem('ttbot_active') === 'true'; } catch (e) {}
    
    if (!isBot && window.location.hash !== '#ttbot') {
        return; // Exit immediately, do not interfere with normal TikTok usage
    }

    // 1. Force document to always appear visible and focused to React/SPA
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { get: () => false });
    document.hasFocus = () => true;

    // 1.5 Force window dimensions to prevent mobile layout in 0x0 background tabs
    Object.defineProperty(window, 'innerWidth', { get: () => 1920 });
    Object.defineProperty(window, 'innerHeight', { get: () => 1080 });
    Object.defineProperty(window, 'outerWidth', { get: () => 1920 });
    Object.defineProperty(window, 'outerHeight', { get: () => 1080 });

    // 2. Prevent requestAnimationFrame from freezing in background tabs
    window.requestAnimationFrame = function(callback) {
        return window.setTimeout(() => callback(performance.now()), 16);
    };

    // 3. Force IntersectionObserver to trigger WITHOUT spamming (which causes TikTok to terminate session)
    const OriginalObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends OriginalObserver {
       constructor(callback, options) {
          super(callback, options);
          this._cb = callback;
          this._observed = new Set();
          
          window.addEventListener('ForceTTIntersect', () => {
             if (this._observed.size === 0) return;
             const entries = Array.from(this._observed).map(el => ({
                 isIntersecting: true,
                 intersectionRatio: 1,
                 target: el
             }));
             this._cb(entries, this);
          });
       }
       observe(element) {
          super.observe(element);
          this._observed.add(element);
          // Only trigger once upon observation to load initial items
          setTimeout(() => {
             this._cb([{ isIntersecting: true, intersectionRatio: 1, target: element }], this);
          }, 500);
       }
       unobserve(element) {
          super.unobserve(element);
          this._observed.delete(element);
       }
       disconnect() {
          super.disconnect();
          this._observed.clear();
       }
    };

    // 4. Disable video autoplay completely
    const originalPlay = HTMLVideoElement.prototype.play;
    HTMLVideoElement.prototype.play = function() {
      this.muted = true;
      this.volume = 0;
      // Return a pending promise so the SPA thinks it's loading/playing without actually playing
      return new Promise(() => {}); 
    };
    
    console.log("[RemoveRepost] CSP-Bypassed Anti-Throttling script injected successfully in MAIN world!");
})();
