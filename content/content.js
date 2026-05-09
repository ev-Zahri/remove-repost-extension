// Main entry point for the content script
(() => {
  // Inject a script into the page context to completely disable video autoplay and bypass background throttling
  const bypassScript = document.createElement('script');
  bypassScript.textContent = `
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
  `;
  // At document_start, head might not exist yet, so we use documentElement as fallback
  (document.head || document.documentElement).appendChild(bypassScript);

  const Automation = window.TTRemoverAutomation;
  const { log } = window.TTRemoverUtils;

  log("Content script injected successfully.");

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_AUTOMATION') {
      Automation.start();
    } else if (message.type === 'STOP_AUTOMATION') {
      Automation.stop();
    }
  });

  // Optionally notify background that content script is ready
  chrome.runtime.sendMessage({ type: 'UPDATE_STATE', payload: { statusMessage: 'Ready' } });
})();
