// ui/sidebar.js

(function() {
  if (window.edgelessInjected) return;
  window.edgelessInjected = true;

  let isSidebarOpen = false;
  let currentAlignment = 'right';
  const panelWidth = 420;
  let hostElement = null;

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle-sidebar") {
      if (isSidebarOpen) removeSidebar(); else buildSidebar();
    } else if (message.action === "toggle-alignment") {
      if (!isSidebarOpen) return;
      currentAlignment = currentAlignment === 'right' ? 'left' : 'right';
      chrome.storage.local.set({ alignmentMode: currentAlignment }, () => {
        removeSidebar(); 
        setTimeout(buildSidebar, 100); // Small delay for cleanup
      });
    }
  });

  function buildSidebar() {
    // Check if sidebar already exists
    if (document.getElementById('edgeless-host-frame')) {
      return;
    }

    chrome.storage.local.get(['alignmentMode'], (res) => {
      currentAlignment = res.alignmentMode || 'right';
      
      hostElement = document.createElement('iframe');
      hostElement.id = 'edgeless-host-frame';
      hostElement.src = chrome.runtime.getURL('ui/panel.html');
      hostElement.style.position = 'fixed';
      hostElement.style.top = '0';
      hostElement.style.height = '100vh';
      hostElement.style.width = panelWidth + 'px';
      hostElement.style.zIndex = '2147483647';
      hostElement.style.border = 'none';
      hostElement.style.background = '#1a1a1e';
      hostElement.style.boxShadow = currentAlignment === 'right' ? '-5px 0 25px rgba(0,0,0,0.3)' : '5px 0 25px rgba(0,0,0,0.3)';
      hostElement.style.transition = 'transform 0.3s ease';
      hostElement.style[currentAlignment] = '0';

      document.body.style.transition = 'margin 0.3s ease';
      document.body.style[currentAlignment === 'right' ? 'marginRight' : 'marginLeft'] = panelWidth + 'px';
      document.body.style.overflowX = 'hidden';

      document.body.appendChild(hostElement);
      isSidebarOpen = true;
    });
  }

  function removeSidebar() {
    const host = document.getElementById('edgeless-host-frame');
    if (host) {
      host.remove();
      hostElement = null;
    }
    document.body.style.marginRight = '0px';
    document.body.style.marginLeft = '0px';
    document.body.style.overflowX = '';
    isSidebarOpen = false;
  }

  // Listen for tab updates to handle context awareness
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      // Notify sidebar of active tab change
      chrome.runtime.sendMessage({ 
        action: "active-tab-changed", 
        url: tab.url, 
        title: tab.title 
      });
    }
  });
})();