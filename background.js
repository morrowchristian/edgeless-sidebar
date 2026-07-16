console.log("🚀 Edgeless Sidebar Background Starting...");

// Toggle sidebar injection
chrome.action.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    // Guard against restricted or undefined URLs
    if (!tab || !tab.id || !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://")) {
      console.warn("Sidebar cannot run on this page");
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: "toggle-sidebar" });
  });
});

// Keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-sidebar") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (!tab || !tab.id || !tab.url ||
          tab.url.startsWith("chrome://") ||
          tab.url.startsWith("chrome-extension://")) {
        console.warn("Sidebar cannot run on this page");
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: "toggle-sidebar" });
    });
  }
});

// Handle messages from panel.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get-active-tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (!tab || !tab.url) {
        sendResponse({ url: null, title: null, id: null });
        return;
      }

      sendResponse({
        url: tab.url,
        title: tab.title,
        id: tab.id
      });
    });
    return true;
  }

  if (request.action === "viewport-url-changed") {
    chrome.storage.local.set({ viewportUrl: request.url });
    return true;
  }

  return false;
});

// Track active tab context
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!tab || !tab.url ||
        tab.url.startsWith("chrome://") ||
        tab.url.startsWith("chrome-extension://")) {
      return;
    }

    chrome.storage.local.set({
      activeTabUrl: tab.url,
      activeTabTitle: tab.title,
      activeTabId: tab.id
    });
  });
});

console.log("✅ Edgeless Sidebar Ready (Injected Mode)");
