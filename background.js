// background.js - Edgeless Sidebar Service Worker

// ============================================
// 1. EXTENSION INSTALLATION & SETUP
// ============================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('Edgeless Sidebar installed successfully');
  
  // Initialize default settings
  chrome.storage.local.set({
    alignmentMode: 'right',
    edgelessNotes: '',
    edgelessPinnedApps: [
      { url: 'https://notion.so', title: 'Notion' },
      { url: 'https://youtube.com', title: 'YouTube' }
    ]
  });
});

// ============================================
// 2. TOOLBAR ACTION HANDLER
// ============================================

chrome.action.onClicked.addListener((tab) => {
  // Prevent injection on chrome:// and edge:// pages
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
    console.warn('Cannot inject sidebar into browser internal pages');
    return;
  }
  
  // Try to send message first (sidebar might already be injected)
  chrome.tabs.sendMessage(tab.id, { action: "toggle-sidebar" }).catch(() => {
    // If not injected, inject the sidebar script
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['ui/sidebar.js']
    }).then(() => {
      // Send toggle message after injection
      chrome.tabs.sendMessage(tab.id, { action: "toggle-sidebar" });
    }).catch((error) => {
      console.error('Failed to inject sidebar:', error);
    });
  });
});

// ============================================
// 3. GLOBAL HOTKEY COMMANDS
// ============================================

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-alignment") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggle-alignment" });
      }
    });
  }
});

// ============================================
// 4. MESSAGE HANDLING
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Get active tab information
  if (request.action === "get-active-tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        sendResponse({ 
          url: tabs[0].url, 
          title: tabs[0].title,
          id: tabs[0].id
        });
      } else {
        sendResponse({ url: null, title: null });
      }
    });
    return true; // Keep channel open for async response
  }
  
  // Context awareness - update based on active tab
  if (request.action === "active-tab-changed") {
    chrome.storage.local.set({ 
      activeTabUrl: request.url,
      activeTabTitle: request.title 
    });
    return true;
  }
  
  // Get sidebar state
  if (request.action === "get-sidebar-state") {
    chrome.storage.local.get(['alignmentMode', 'edgelessNotes', 'edgelessPinnedApps'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  // Save sidebar state
  if (request.action === "save-sidebar-state") {
    chrome.storage.local.set(request.data, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// ============================================
// 5. NETWORK PROXY - IFRAME DE-BLOCKER
// ============================================

const RULE_ID = 1;
const IPAD_USER_AGENT = "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";

// Clean up old rules and apply new ones
function applyNetworkRules() {
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: [
      {
        id: RULE_ID,
        priority: 1,
        action: {
          type: "modifyHeaders",
          responseHeaders: [
            { header: "X-Frame-Options", operation: "remove" },
            { header: "Content-Security-Policy", operation: "remove" },
            { header: "x-frame-options", operation: "remove" },
            { header: "content-security-policy", operation: "remove" },
            { header: "Frame-Options", operation: "remove" }
          ],
          requestHeaders: [
            { header: "User-Agent", operation: "set", value: IPAD_USER_AGENT }
          ]
        },
        condition: {
          urlFilter: "*",
          resourceTypes: ["sub_frame", "main_frame"]
        }
      }
    ]
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn('Failed to apply network rules:', chrome.runtime.lastError);
    } else {
      console.log('Network proxy rules applied successfully');
    }
  });
}

// Apply rules on service worker startup
applyNetworkRules();

// ============================================
// 6. TAB MANAGEMENT & CONTEXT AWARENESS
// ============================================

// Track active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      // Store active tab info
      chrome.storage.local.set({
        activeTabUrl: tab.url,
        activeTabTitle: tab.title,
        activeTabId: tab.id
      });
      
      // Notify any open sidebar panels
      chrome.runtime.sendMessage({
        action: "active-tab-changed",
        url: tab.url,
        title: tab.title
      }).catch(() => {
        // No listeners yet, that's okay
      });
    }
  });
});

// Track tab updates (URL changes in same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    chrome.storage.local.set({
      activeTabUrl: tab.url,
      activeTabTitle: tab.title
    });
    
    chrome.runtime.sendMessage({
      action: "active-tab-changed",
      url: tab.url,
      title: tab.title
    }).catch(() => {
      // No listeners yet, that's okay
    });
  }
});

// Track tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  chrome.storage.local.get(['activeTabId'], (result) => {
    if (result.activeTabId === tabId) {
      chrome.storage.local.remove(['activeTabId', 'activeTabUrl', 'activeTabTitle']);
    }
  });
});

// ============================================
// 7. WINDOW MANAGEMENT
// ============================================

// Handle window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        chrome.storage.local.set({
          activeTabUrl: tabs[0].url,
          activeTabTitle: tabs[0].title
        });
      }
    });
  }
});

// ============================================
// 8. CLEANUP & ERROR HANDLING
// ============================================

// Handle service worker lifecycle
self.addEventListener('install', (event) => {
  console.log('Edgeless Sidebar service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Edgeless Sidebar service worker activated');
});

// Handle unhandled errors
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});