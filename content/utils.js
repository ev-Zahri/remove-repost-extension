window.TTRemoverUtils = {
  randomDelay: (min, max) => {
    const ms = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  log: (...args) => {
    console.log("[RemoveRepost]", ...args);
  },
  
  error: (...args) => {
    console.error("[RemoveRepost Error]", ...args);
  },

  updateBackgroundState: (payload) => {
    chrome.runtime.sendMessage({ type: 'UPDATE_STATE', payload });
  }
};
