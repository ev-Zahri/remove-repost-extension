document.addEventListener('DOMContentLoaded', () => {
  const btnStart = document.getElementById('btn-start');
  const btnStop = document.getElementById('btn-stop');
  const statusBadge = document.getElementById('status-badge');
  const removedCount = document.getElementById('removed-count');
  const failedCount = document.getElementById('failed-count');
  const statusMsg = document.getElementById('status-msg');

  // Fetch initial state from background
  const updateUI = () => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
      if (state) {
        removedCount.textContent = state.removedCount;
        failedCount.textContent = state.failedCount;
        statusMsg.textContent = state.statusMessage;

        if (state.isRunning) {
          btnStart.disabled = true;
          btnStop.disabled = false;
          statusBadge.textContent = 'Running';
          statusBadge.className = 'status-badge running';
        } else {
          btnStart.disabled = false;
          btnStop.disabled = true;
          statusBadge.textContent = 'Ready';
          statusBadge.className = 'status-badge';
        }
      }
    });
  };

  // Poll state quickly to keep UI updated in real-time
  setInterval(updateUI, 300);
  updateUI();

  btnStart.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'START_AUTOMATION',
      backgroundMode: true
    });
    updateUI();
  });

  btnStop.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
    updateUI();
  });
});
