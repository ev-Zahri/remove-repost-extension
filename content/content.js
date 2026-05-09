// Main entry point for the content script
(() => {

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
