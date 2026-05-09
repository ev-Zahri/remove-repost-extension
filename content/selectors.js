// This file centralizes selectors so it's easy to update when TikTok UI changes.
window.TTRemoverSelectors = {
  // Container for repost items. Usually, we're in the profile's repost tab.
  // A generic fallback is to find video items. We might need to refine this based on the exact DOM.
  repostItem: '[data-e2e="user-repost-item"]', 
  
  // The button on a video card/page that opens the share/action menu
  shareMenuButton: '[data-e2e="browse-share-group"] button[aria-label="Share"], [data-e2e="browser-share"]', 
  
  // The remove repost button inside the video modal.
  removeRepostButton: '[data-e2e="video-share-repost"], #icon-element-repost',
  
  // A generic way to find the close button of a modal if we opened one.
  closeModalButton: '[data-e2e="browse-close"], [data-e2e="modal-close-inner-button"], button[aria-label="Close"]'
};

// Helper to find button by text (case insensitive)
window.TTRemoverSelectors.findButtonByText = (text) => {
  const buttons = document.querySelectorAll('button, span, div');
  for (const btn of buttons) {
    if (btn.innerText && btn.innerText.toLowerCase().includes(text.toLowerCase())) {
      return btn;
    }
  }
  return null;
};
