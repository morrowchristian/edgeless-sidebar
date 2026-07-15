// background.js - Edgeless Sidebar Service Worker (Global Version)

// ============================================
// 1. STATE MANAGEMENT
// ============================================

let sidebarState = {
  isOpen: false,
  alignment: 'right',
  currentTabId: null
};

// ============================================
// 2. EXTENSION INSTALLATION & SETUP
// ============================================

chrome.runtime.onInstalled.addListener(function() {
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
// 3. TOOLBAR ACTION HANDLER - GLOBAL TOGGLE
// ============================================

chrome.action.onClicked.addListener(function(tab) {
  // Prevent injection on chrome:// and edge:// pages
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
    console.warn('Cannot inject sidebar into browser internal pages');
    return;
  }
  
  // Toggle sidebar state
  sidebarState.isOpen = !sidebarState.isOpen;
  sidebarState.currentTabId = tab.id;
  
  if (sidebarState.isOpen) {
    // Inject sidebar into ALL existing tabs
    injectSidebarIntoAllTabs();
  } else {
    // Remove sidebar from ALL tabs
    removeSidebarFromAllTabs();
  }
});

// ============================================
// 4. INJECT/REMOVE SIDEBAR IN ALL TABS
// ============================================

function injectSidebarIntoAllTabs() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      // Skip chrome:// and edge:// pages
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['ui/sidebar.js']
        }).then(function() {
          // Send open message after injection
          chrome.tabs.sendMessage(tab.id, { 
            action: "open-sidebar-global",
            alignment: sidebarState.alignment
          }).catch(function() {
            // Ignore errors - tab might not be ready
          });
        }).catch(function(error) {
          // Ignore errors for tabs that can't be injected
        });
      }
    });
  });
}

function removeSidebarFromAllTabs() {
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, { 
        action: "close-sidebar-global"
      }).catch(function() {
        // Ignore errors - tab might not have sidebar
      });
    });
  });
}

// ============================================
// 5. HANDLE NEW TABS - AUTO-INJECT SIDEBAR
// ============================================

chrome.tabs.onCreated.addListener(function(tab) {
  if (sidebarState.isOpen && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
    // Wait for tab to load before injecting
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['ui/sidebar.js']
        }).then(function() {
          chrome.tabs.sendMessage(tab.id, { 
            action: "open-sidebar-global",
            alignment: sidebarState.alignment
          }).catch(function() {
            // Ignore errors
          });
        }).catch(function() {
          // Ignore errors
        });
      }
    });
  }
});

// ============================================
// 6. HANDLE TAB UPDATES - RE-INJECT IF NEEDED
// ============================================

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && sidebarState.isOpen) {
    if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
      // Check if sidebar exists, if not inject it
      chrome.tabs.sendMessage(tabId, { action: "check-sidebar" }).catch(function() {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['ui/sidebar.js']
        }).then(function() {
          chrome.tabs.sendMessage(tabId, { 
            action: "open-sidebar-global",
            alignment: sidebarState.alignment
          }).catch(function() {
            // Ignore errors
          });
        }).catch(function() {
          // Ignore errors
        });
      });
    }
  }
});

// ============================================
// 7. GLOBAL HOTKEY COMMANDS
// ============================================

chrome.commands.onCommand.addListener(function(command) {
  if (command === "toggle-alignment") {
    // Toggle alignment
    sidebarState.alignment = sidebarState.alignment === 'right' ? 'left' : 'right';
    chrome.storage.local.set({ alignmentMode: sidebarState.alignment });
    
    // Update all tabs with new alignment
    if (sidebarState.isOpen) {
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(function(tab) {
          chrome.tabs.sendMessage(tab.id, { 
            action: "update-alignment-global",
            alignment: sidebarState.alignment
          }).catch(function() {
            // Ignore errors
          });
        });
      });
    }
  }
});

// ============================================
// 8. MESSAGE HANDLING
// ============================================

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Get active tab information
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
    chrome.storage.local.get(['alignmentMode', 'edgelessNotes', 'edgelessPinnedApps'], function(result) {
      sendResponse(result);
    });
    return true;
  }
  
  // Save sidebar state
  if (request.action === "save-sidebar-state") {
    chrome.storage.local.set(request.data, function() {
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Check if sidebar is open globally
  if (request.action === "is-sidebar-open") {
    sendResponse({ isOpen: sidebarState.isOpen });
    return true;
  }
  
  return false;
});

// ============================================
// 9. NETWORK PROXY - IFRAME DE-BLOCKER
// ============================================

var RULE_ID = 1;
var IPAD_USER_AGENT = "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";

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
  }, function() {
    if (chrome.runtime.lastError) {
      console.warn('Failed to apply network rules:', chrome.runtime.lastError);
    } else {
      console.log('Network proxy rules applied successfully');
    }
  });
}

applyNetworkRules();

// ============================================
// 10. TAB MANAGEMENT & CONTEXT AWARENESS
// ============================================

chrome.tabs.onActivated.addListener(function(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    if (tab && tab.url) {
      chrome.storage.local.set({
        activeTabUrl: tab.url,
        activeTabTitle: tab.title,
        activeTabId: tab.id
      });
      
      chrome.runtime.sendMessage({
        action: "active-tab-changed",
        url: tab.url,
        title: tab.title
      }).catch(function() {
        // No listeners yet
      });
    }
  });
});

console.log('Edgeless Sidebar background service worker loaded (Global Mode)');