/**
 * Background Service Worker
 * Mengelola state global agar jika popup ditutup, status running tetap terjaga.
 */

let extensionState = {
  isRunning: false,
  removedCount: 0,
  failedCount: 0,
  totalFound: 0,
  statusMessage: 'Idle'
};

let activeBotTabId = null;
let activeBotWindowId = null;
let isBackgroundTabCreated = false;

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    sendResponse(extensionState);
  } else if (message.type === 'UPDATE_STATE') {
    extensionState = { ...extensionState, ...message.payload };
    
    // Auto-close background window if automation finishes naturally
    if (message.payload.hasOwnProperty('isRunning') && message.payload.isRunning === false && activeBotWindowId && isBackgroundTabCreated) {
      chrome.windows.remove(activeBotWindowId).catch(() => {});
      activeBotTabId = null;
      activeBotWindowId = null;
      isBackgroundTabCreated = false;
    }
    
    sendResponse({ success: true });
  } else if (message.type === 'START_AUTOMATION') {
    extensionState.isRunning = true;
    extensionState.statusMessage = 'Starting...';
    
    if (message.backgroundMode) {
      startInBackgroundTab();
    } else {
      sendMessageToActiveTab({ type: 'START_AUTOMATION' });
    }
    sendResponse({ success: true });
  } else if (message.type === 'STOP_AUTOMATION') {
    extensionState.isRunning = false;
    extensionState.statusMessage = 'Stopped by user';
    
    if (activeBotTabId) {
      if (isBackgroundTabCreated && activeBotWindowId) {
        chrome.windows.remove(activeBotWindowId).catch(() => {});
        activeBotTabId = null;
        activeBotWindowId = null;
        isBackgroundTabCreated = false;
      } else {
        chrome.tabs.sendMessage(activeBotTabId, { type: 'STOP_AUTOMATION' }).catch(() => console.log("Tab already closed"));
      }
    } else {
      sendMessageToActiveTab({ type: 'STOP_AUTOMATION' });
    }
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async responses if needed
});

async function startInBackgroundTab() {
  extensionState.statusMessage = 'Opening TikTok...';
  
  try {
    // Create a new minimized window. This bypasses Chrome's strict background tab limitations.
    chrome.windows.create({
      url: 'https://www.tiktok.com/profile#ttbot',
      state: 'minimized',
      type: 'normal'
    }, (win) => {
      activeBotWindowId = win.id;
      activeBotTabId = win.tabs[0].id;
      isBackgroundTabCreated = true;
      
      // Mute the tab so it makes absolutely no noise
      chrome.tabs.update(activeBotTabId, { muted: true }).catch(() => {});
      
      // Fallback just in case onUpdated misses the event
      setTimeout(() => {
        if (extensionState.isRunning && activeBotTabId) {
          chrome.tabs.sendMessage(activeBotTabId, { type: 'START_AUTOMATION' }).catch(() => {});
        }
      }, 10000);
    });
  } catch (err) {
    console.error("Error creating background window:", err);
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeBotTabId && extensionState.isRunning && changeInfo.status === 'complete') {
    extensionState.statusMessage = 'Page loaded, starting script...';
    // Give TikTok's SPA a moment to render the DOM
    setTimeout(() => {
      if (extensionState.isRunning && activeBotTabId === tabId) {
        chrome.tabs.sendMessage(tabId, { type: 'START_AUTOMATION' }).catch((err) => {
          console.error("Could not send start command after load:", err);
        });
      }
    }, 3000);
  }
});

async function sendMessageToActiveTab(msg) {
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      activeBotTabId = tab.id;
      chrome.tabs.sendMessage(tab.id, msg);
    }
  } catch (error) {
    console.error("Error sending message to tab:", error);
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeBotTabId) {
    if (extensionState.isRunning) {
      extensionState.isRunning = false;
      extensionState.statusMessage = 'Background window closed.';
    }
    activeBotTabId = null;
    activeBotWindowId = null;
    isBackgroundTabCreated = false;
  }
});
