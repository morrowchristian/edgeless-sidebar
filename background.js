// Listen for the user clicking our Edgeless extension action icon
chrome.action.onClicked.addListener((tab) => {
  // Prevent execution on default blank browser system pages
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
    return;
  }

  // Inject our structural UI layout script straight into the live tab context
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['ui/sidebar.js']
  });
});
