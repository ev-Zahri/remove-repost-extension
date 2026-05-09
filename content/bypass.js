(() => {
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

    // 3. Force IntersectionObserver to trigger (TikTok relies on this for lazy loading posts)
    const OriginalObserver = window.IntersectionObserver;
    window.IntersectionObserver = class extends OriginalObserver {
       constructor(callback, options) {
          super(callback, options);
          this._cb = callback;
       }
       observe(element) {
          super.observe(element);
          // Force trigger immediately and periodically so lazy-loaded elements always load
          const trigger = () => {
             if (document.hidden !== undefined) {
               this._cb([{ isIntersecting: true, intersectionRatio: 1, target: element }], this);
             }
          };
          trigger();
          setInterval(trigger, 3000);
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
