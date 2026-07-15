// background.js - Side Panel API Version with Network Rules

console.log('🚀 Edgeless Sidebar Background Starting...');

// ============================================
// 1. SIDE PANEL STATE
// ============================================

let isSidePanelOpen = false;

// ============================================
// 2. EXTENSION INSTALLATION
// ============================================

chrome.runtime.onInstalled.addListener(function() {
  console.log('✅ Edgeless Sidebar installed successfully');
  
  chrome.storage.local.set({
    edgelessNotes: '',
    edgelessPinnedApps: [
      { url: 'https://notion.so', title: 'Notion' },
      { url: 'https://youtube.com', title: 'YouTube' }
    ],
    viewportUrl: 'https://notion.so'
  });
  
  // Set default side panel behavior
  chrome.sidePanel.setOptions({
    enabled: true,
    path: 'ui/panel.html'
  });
  
  // Apply network rules for iframe embedding
  applyNetworkRules();
});

// ============================================
// 3. NETWORK RULES FOR IFRAME EMBEDDING
// ============================================

function applyNetworkRules() {
  // Remove existing rules first
  chrome.declarativeNetRequest.getDynamicRules(function(rules) {
    const ruleIds = rules.map(rule => rule.id);
    
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: [
        {
          id: 1,
          priority: 1,
          action: {
            type: "modifyHeaders",
            responseHeaders: [
              { header: "X-Frame-Options", operation: "remove" },
              { header: "x-frame-options", operation: "remove" },
              { header: "Content-Security-Policy", operation: "remove" },
              { header: "content-security-policy", operation: "remove" },
              { header: "Frame-Options", operation: "remove" }
            ]
          },
          condition: {
            urlFilter: "*",
            resourceTypes: ["sub_frame", "main_frame"]
          }
        },
        {
          id: 2,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              { 
                header: "User-Agent", 
                operation: "set", 
                value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
              }
            ]
          },
          condition: {
            urlFilter: "*",
            resourceTypes: ["sub_frame", "main_frame"]
          }
        }
      ]
    }, function() {
      if (chrome.runtime.lastError) {
        console.warn('⚠️ Failed to apply network rules:', chrome.runtime.lastError);
      } else {
        console.log('✅ Network proxy rules applied successfully');
      }
    });
  });
}

// ============================================
// 4. TOGGLE SIDE PANEL
// ============================================

chrome.action.onClicked.addListener(function(tab) {
  console.log('🖱️ Extension icon clicked');
  toggleSidePanel(tab.windowId);
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === "toggle-sidebar") {
    chrome.windows.getCurrent(function(window) {
      toggleSidePanel(window.id);
    });
  }
});

function toggleSidePanel(windowId) {
  isSidePanelOpen = !isSidePanelOpen;
  console.log(`📊 Side panel toggled: ${isSidePanelOpen ? 'OPEN' : 'CLOSED'}`);
  
  if (isSidePanelOpen) {
    // Open the side panel
    chrome.sidePanel.open({ windowId: windowId });
  } else {
    // Close the side panel
    chrome.sidePanel.setOptions({
      enabled: false,
      path: 'ui/panel.html'
    });
    
    setTimeout(function() {
      chrome.sidePanel.setOptions({
        enabled: true,
        path: 'ui/panel.html'
      });
    }, 100);
  }
}

// ============================================
// 5. MESSAGE HANDLING
// ============================================

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "get-active-tab") {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
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
    return true;
  }
  
  if (request.action === "is-sidebar-open") {
    sendResponse({ isOpen: isSidePanelOpen });
    return true;
  }
  
  if (request.action === "viewport-url-changed") {
    chrome.storage.local.set({ viewportUrl: request.url });
    return true;
  }
  
  if (request.action === "get-viewport-url") {
    chrome.storage.local.get(['viewportUrl'], function(result) {
      sendResponse({ url: result.viewportUrl || 'https://notion.so' });
    });
    return true;
  }
  
  return false;
});

// ============================================
// 6. TAB CONTEXT AWARENESS
// ============================================

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab && tab.url) {
      chrome.storage.local.set({
        activeTabUrl: tab.url,
        activeTabTitle: tab.title,
        activeTabId: tab.id
      });
    }
  });
});

console.log('✅ Edgeless Sidebar Ready (Side Panel Mode)');