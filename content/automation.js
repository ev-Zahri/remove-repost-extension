(() => {
const { randomDelay, log, error, updateBackgroundState } = window.TTRemoverUtils;
const Selectors = window.TTRemoverSelectors;

window.TTRemoverAutomation = {
  isRunning: false,
  removedCount: 0,
  failedCount: 0,
  processedUrls: new Set(),

  start: async function() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.processedUrls.clear(); // Reset on start
    log("Automation started.");
    updateBackgroundState({ statusMessage: 'Starting automation...', isRunning: true });
    
    this.injectShield();
    
    // Aggressive interval to prevent videos from playing or making noise
    this.muteInterval = setInterval(() => {
      document.querySelectorAll('video').forEach(v => {
        v.muted = true;
        v.volume = 0;
        if (!v.paused) v.pause();
      });
    }, 500);
    
    await this.loop();
  },

  stop: function(customMessage = 'Stopped by user') {
    this.isRunning = false;
    if (this.muteInterval) clearInterval(this.muteInterval);
    log("Automation stopped.");
    this.removeShield();
    updateBackgroundState({ statusMessage: customMessage, isRunning: false });
  },

  injectShield: function() {
    if (document.getElementById('tt-remover-shield')) return;
    
    const shield = document.createElement('div');
    shield.id = 'tt-remover-shield';
    shield.style.position = 'fixed';
    shield.style.top = '0';
    shield.style.left = '0';
    shield.style.width = '100vw';
    shield.style.height = '100vh';
    shield.style.backgroundColor = 'rgba(15, 23, 42, 0.95)'; // Dark, solid slate color
    shield.style.zIndex = '2147483647'; // Max z-index
    shield.style.display = 'flex';
    shield.style.flexDirection = 'column';
    shield.style.alignItems = 'center';
    shield.style.justifyContent = 'center';
    shield.style.color = '#fff';
    shield.style.fontFamily = 'Inter, system-ui, sans-serif';
    shield.style.userSelect = 'none';
    shield.style.cursor = 'not-allowed';
    
    shield.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 20px;">🤖</div>
      <div style="font-size: 28px; font-weight: bold; margin-bottom: 12px; color: #ef4444;">BOT IS WORKING</div>
      <div style="font-size: 18px; margin-bottom: 8px;">Please do not click or interact with this window.</div>
      <div style="font-size: 15px; color: #94a3b8; text-align: center; max-width: 400px; line-height: 1.5;">
        Interfering with this window may cause the Remove Repost automation to fail or skip items.
        <br><br>
        You may safely minimize this window or click "Stop" in the extension popup.
      </div>
    `;
    
    // Intercept and prevent all user interactions
    const blockEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    shield.addEventListener('click', blockEvent, true);
    shield.addEventListener('mousedown', blockEvent, true);
    shield.addEventListener('mouseup', blockEvent, true);
    shield.addEventListener('keydown', blockEvent, true);
    shield.addEventListener('wheel', blockEvent, { passive: false, capture: true });
    shield.addEventListener('touchmove', blockEvent, { passive: false, capture: true });
    shield.addEventListener('contextmenu', blockEvent, true);
    
    (document.body || document.documentElement).appendChild(shield);
  },

  removeShield: function() {
    const shield = document.getElementById('tt-remover-shield');
    if (shield) {
      shield.remove();
    }
  },

  loop: async function() {
    while (this.isRunning) {
      updateBackgroundState({ statusMessage: 'Scanning for reposts...' });
      
      // Wait for the page to fully render tabs if we don't see any repost items yet
      let retries = 5;
      while (document.querySelectorAll('[role="tab"]').length === 0 && retries > 0) {
        if (!this.isRunning) break;
        updateBackgroundState({ statusMessage: 'Waiting for profile to load...' });
        await randomDelay(1500, 2000);
        retries--;
      }

      const reposts = document.querySelectorAll(Selectors.repostItem);
      
      let targetItem = null;
      let targetUrl = null;
      
      for (const item of reposts) {
         const link = item.querySelector('a');
         const url = link && link.href ? link.href.split('?')[0] : null; 
         
         if (url && !this.processedUrls.has(url)) {
            targetItem = item;
            targetUrl = url;
            this.processedUrls.add(url);
            break;
         } else if (!url && !item.hasAttribute('data-fallback-processed')) {
            targetItem = item;
            item.setAttribute('data-fallback-processed', 'true');
            break;
         }
      }

      if (!targetItem) {
        // Attempt to find and click the "Reposts" tab if we're on the profile but the tab isn't active
        let clickedTab = false;
        
        let repostTab = document.querySelector('[data-e2e="repost-tab"], [data-e2e="profile-repost-tab"], [data-e2e="user-repost-tab"]');
        
        // Fallback if data-e2e is missing
        if (!repostTab) {
          const allElements = document.querySelectorAll('p, span, div, [role="tab"]');
          for (const el of allElements) {
            if (el.textContent && el.textContent.trim().toLowerCase() === 'reposts') {
              // Ensure we click the clickable parent if needed
              repostTab = el.closest('[role="tab"], p, div') || el;
              break;
            }
          }
        }

        if (repostTab && repostTab.getAttribute('aria-selected') !== 'true') {
           updateBackgroundState({ statusMessage: 'Navigating to Repost tab...' });
           // Simulate a more realistic click for React
           repostTab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
           repostTab.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
           repostTab.click();
           clickedTab = true;
           await randomDelay(3000, 4500); // Wait longer for tab to switch and network request to finish
        }
        
        if (clickedTab) continue; // Re-evaluate reposts after clicking the tab

        // Option 1: Scroll down to load more
        window.scrollBy(0, 800);
        document.documentElement.scrollTop += 800; // Fallback for inactive tabs
        
        // Force layout/IntersectionObserver updates in background tabs
        window.dispatchEvent(new Event('resize'));
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new CustomEvent('ForceTTIntersect')); // Safely trigger our modified observer
        
        // Wait and check multiple times (up to 10 seconds) for network requests to finish
        let found = false;
        for (let retry = 0; retry < 5; retry++) {
           await randomDelay(1500, 2000);
           if (!this.isRunning) break;
           
           // Check if there are any NEW unprocessed items
           const currentReposts = document.querySelectorAll(Selectors.repostItem);
           for (const item of currentReposts) {
               const link = item.querySelector('a');
               const url = link && link.href ? link.href.split('?')[0] : null;
               if (url && !this.processedUrls.has(url)) {
                   found = true;
                   break;
               } else if (!url && !item.hasAttribute('data-fallback-processed')) {
                   found = true;
                   break;
               }
           }
           if (found) break;
        }
        
        if (!found && this.isRunning) {
           log("No reposts found. Stopping.");
           this.stop('Finished: No more reposts found.');
           break;
        }
        continue;
      }

      try {
        updateBackgroundState({ statusMessage: 'Processing item...' });
        
        // 1. Click the item to open it (find the <a> tag inside)
        const videoLink = targetItem.querySelector('a');
        if (videoLink) {
          videoLink.click();
        } else {
          targetItem.click();
        }
        
        // Wait for the video page/modal to load
        updateBackgroundState({ statusMessage: 'Waiting for video modal...' });
        let removeBtn = null;
        let shareBtn = null;
        
        // Poll for up to 6 seconds to find the remove button
        for (let i = 0; i < 12; i++) {
          if (!this.isRunning) break;
          
          await randomDelay(400, 600); // wait ~500ms per iteration
          
          removeBtn = document.querySelector(Selectors.removeRepostButton);
          if (removeBtn) break; // Found it!
        }

        if (!this.isRunning) break;

        // If not found directly, maybe we need to click the share button first
        if (!removeBtn) {
          // Find the share button (get the last one in case there are multiple, as the modal is usually appended last)
          const shareBtns = document.querySelectorAll(Selectors.shareMenuButton);
          shareBtn = shareBtns.length > 0 ? shareBtns[shareBtns.length - 1] : null;
          
          if (shareBtn) {
            shareBtn.click();
            await randomDelay(1000, 2000);
            removeBtn = document.querySelector(Selectors.removeRepostButton);
          }
        }

        // 3. Click "Remove repost" button
        if (removeBtn) {
          const btnText = removeBtn.innerText ? removeBtn.innerText.toLowerCase() : '';
          const isSafeToClick = !btnText || btnText.includes('remove') || btnText.includes('hapus') || btnText.includes('undo') || btnText.includes('batal');
          
          if (isSafeToClick) {
            removeBtn.click();
            this.removedCount++;
            updateBackgroundState({ 
              removedCount: this.removedCount,
              statusMessage: 'Repost removed.'
            });
            log(`Removed repost #${this.removedCount}`);
            await randomDelay(3000, 4500); // Slightly longer delay to respect TikTok's rate limits
          } else {
            log(`Button says "${btnText}", skipping to prevent accidental repost.`);
            this.failedCount++;
            updateBackgroundState({ failedCount: this.failedCount, statusMessage: 'Skipped: Already removed' });
            await randomDelay(1000, 1500);
          }
        } else {
          log("Remove button not found for this item. Skipping.");
          this.failedCount++;
          updateBackgroundState({ failedCount: this.failedCount });
        }

        // 4. Close modal / go back
        const closeBtns = document.querySelectorAll(Selectors.closeModalButton);
        const closeBtn = closeBtns.length > 0 ? closeBtns[closeBtns.length - 1] : null;
        if (closeBtn) {
          closeBtn.click();
          await randomDelay(1500, 2500);
        } else {
          // Fallback if no close button: try navigating back (SPA history back)
          log("No close button found. Attempting history.back()");
          window.history.back();
          await randomDelay(2000, 3000);
        }
      } catch (err) {
        error("Error processing item:", err);
        this.failedCount++;
        updateBackgroundState({ failedCount: this.failedCount });
      }

      // Final delay before next iteration
      await randomDelay(1500, 2500);
    }
  }
};
})();
