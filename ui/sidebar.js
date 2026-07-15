// ui/sidebar.js

(function() {
  if (window.edgelessInjected) {
    // If already injected, just handle messages
    setupMessageListener();
    return;
  }
  window.edgelessInjected = true;

  let isSidebarOpen = false;
  let currentAlignment = 'right';
  const panelWidth = 420;
  let hostElement = null;

  // ============================================
  // 1. SETUP MESSAGE LISTENER
  // ============================================

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener(function(message) {
      if (message.action === "open-sidebar-global") {
        currentAlignment = message.alignment || 'right';
        if (!isSidebarOpen) {
          buildSidebar();
        } else {
          updateAlignment(currentAlignment);
        }
      } else if (message.action === "close-sidebar-global") {
        if (isSidebarOpen) {
          removeSidebar();
        }
      } else if (message.action === "update-alignment-global") {
        currentAlignment = message.alignment || 'right';
        if (isSidebarOpen) {
          updateAlignment(currentAlignment);
        }
      } else if (message.action === "check-sidebar") {
        return true;
      } else if (message.action === "toggle-alignment") {
        if (isSidebarOpen) {
          currentAlignment = currentAlignment === 'right' ? 'left' : 'right';
          chrome.storage.local.set({ alignmentMode: currentAlignment }, function() {
            updateAlignment(currentAlignment);
          });
        }
      }
    });
  }

  // ============================================
  // 2. BUILD SIDEBAR
  // ============================================

  function buildSidebar() {
    if (document.getElementById('edgeless-host-frame')) {
      return;
    }

    chrome.storage.local.get(['alignmentMode'], function(res) {
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
      hostElement.style.transition = 'transform 0.3s ease';
      hostElement.style.pointerEvents = 'auto';
      
      setSidebarPosition(currentAlignment);
      
      document.body.style.transition = 'margin 0.3s ease';
      document.body.style[currentAlignment === 'right' ? 'marginRight' : 'marginLeft'] = panelWidth + 'px';
      document.body.style.overflowX = 'hidden';

      document.body.appendChild(hostElement);
      isSidebarOpen = true;
    });
  }

  // ============================================
  // 3. UPDATE ALIGNMENT
  // ============================================

  function updateAlignment(alignment) {
    currentAlignment = alignment;
    if (hostElement) {
      setSidebarPosition(alignment);
      // Update body margin
      document.body.style.marginRight = '0px';
      document.body.style.marginLeft = '0px';
      document.body.style[alignment === 'right' ? 'marginRight' : 'marginLeft'] = panelWidth + 'px';
    }
  }

  function setSidebarPosition(alignment) {
    if (!hostElement) return;
    
    hostElement.style.left = 'auto';
    hostElement.style.right = 'auto';
    
    if (alignment === 'right') {
      hostElement.style.right = '0';
      hostElement.style.boxShadow = '-5px 0 25px rgba(0,0,0,0.3)';
    } else {
      hostElement.style.left = '0';
      hostElement.style.boxShadow = '5px 0 25px rgba(0,0,0,0.3)';
    }
  }

  // ============================================
  // 4. REMOVE SIDEBAR
  // ============================================

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

  // ============================================
  // 5. INITIALIZATION
  // ============================================

  setupMessageListener();

  chrome.runtime.sendMessage({ action: "is-sidebar-open" }, function(response) {
    if (response && response.isOpen) {
      chrome.storage.local.get(['alignmentMode'], function(res) {
        currentAlignment = res.alignmentMode || 'right';
        buildSidebar();
      });
    }
  });

  console.log('Edgeless Sidebar injected (Global Mode)');
})();