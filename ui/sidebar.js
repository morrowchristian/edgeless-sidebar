// ui/sidebar.js

(function() {
  // Prevent multiple injections in same tab
  if (window.edgelessInjected) {
    console.log('Edgeless Sidebar already injected in this tab');
    setupMessageListener();
    return;
  }
  window.edgelessInjected = true;

  let isSidebarOpen = false;
  let currentAlignment = 'right';
  let currentViewportUrl = 'https://notion.so';
  const panelWidth = 420;
  let hostElement = null;

  console.log('Edgeless Sidebar content script loaded');

  // ============================================
  // 1. MESSAGE LISTENER
  // ============================================

  function setupMessageListener() {
    chrome.runtime.onMessage.removeListener(messageHandler);
    chrome.runtime.onMessage.addListener(messageHandler);
  }

  function messageHandler(message, sender, sendResponse) {
    console.log('Sidebar received message:', message.action);
    
    if (message.action === "ping-sidebar") {
      sendResponse({ exists: true });
      return true;
    }
    
    if (message.action === "open-sidebar") {
      if (message.alignment) {
        currentAlignment = message.alignment;
      }
      if (message.viewportUrl) {
        currentViewportUrl = message.viewportUrl;
      }
      if (!isSidebarOpen) {
        buildSidebar();
      } else {
        if (hostElement) {
          hostElement.style.display = 'block';
          document.body.style[currentAlignment === 'right' ? 'marginRight' : 'marginLeft'] = panelWidth + 'px';
        }
        updateAlignment(currentAlignment);
        // Update viewport with global URL
        updateViewport(currentViewportUrl);
      }
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === "close-sidebar") {
      if (isSidebarOpen) {
        removeSidebar();
      }
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === "update-alignment") {
      if (message.alignment) {
        currentAlignment = message.alignment;
        if (isSidebarOpen) {
          updateAlignment(currentAlignment);
        }
      }
      sendResponse({ success: true });
      return true;
    }
    
    // NEW: Handle viewport URL updates
    if (message.action === "update-viewport") {
      if (message.url) {
        currentViewportUrl = message.url;
        updateViewport(currentViewportUrl);
        console.log(`🌐 Viewport updated to: ${currentViewportUrl}`);
      }
      sendResponse({ success: true });
      return true;
    }
    
    // Legacy support
    if (message.action === "toggle-sidebar") {
      if (isSidebarOpen) {
        removeSidebar();
      } else {
        buildSidebar();
      }
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === "toggle-alignment") {
      if (isSidebarOpen) {
        currentAlignment = currentAlignment === 'right' ? 'left' : 'right';
        chrome.storage.local.set({ alignmentMode: currentAlignment });
        updateAlignment(currentAlignment);
        chrome.runtime.sendMessage({ 
          action: "alignment-changed", 
          alignment: currentAlignment 
        });
      }
      sendResponse({ success: true });
      return true;
    }
    
    return false;
  }

  // ============================================
  // 2. BUILD SIDEBAR
  // ============================================

  function buildSidebar() {
    if (document.getElementById('edgeless-host-frame')) {
      hostElement = document.getElementById('edgeless-host-frame');
      isSidebarOpen = true;
      console.log('Sidebar already exists in DOM, reusing');
      return;
    }

    chrome.storage.local.get(['alignmentMode', 'viewportUrl'], function(res) {
      currentAlignment = res.alignmentMode || 'right';
      currentViewportUrl = res.viewportUrl || 'https://notion.so';
      console.log('Building sidebar with alignment:', currentAlignment);
      
      hostElement = document.createElement('iframe');
      hostElement.id = 'edgeless-host-frame';
      hostElement.src = chrome.runtime.getURL('ui/panel.html');
      
      // IMPORTANT: NO SANDBOX ATTRIBUTE
      
      // Style the iframe
      hostElement.style.cssText = `
        position: fixed;
        top: 0;
        height: 100vh;
        width: ${panelWidth}px;
        z-index: 2147483647;
        border: none;
        background: #1a1a1e;
        transition: transform 0.3s ease;
        pointer-events: auto;
        box-shadow: ${currentAlignment === 'right' ? '-5px 0 25px rgba(0,0,0,0.3)' : '5px 0 25px rgba(0,0,0,0.3)'};
      `;
      
      if (currentAlignment === 'right') {
        hostElement.style.right = '0';
        hostElement.style.left = 'auto';
      } else {
        hostElement.style.left = '0';
        hostElement.style.right = 'auto';
      }
      
      hostElement.addEventListener('load', function() {
        console.log('✅ Sidebar iframe loaded successfully');
        // After iframe loads, set the viewport
        setTimeout(function() {
          updateViewport(currentViewportUrl);
        }, 500);
      });
      
      hostElement.addEventListener('error', function(e) {
        console.error('❌ Sidebar iframe failed to load:', e);
      });
      
      document.body.style.transition = 'margin 0.3s ease';
      document.body.style[currentAlignment === 'right' ? 'marginRight' : 'marginLeft'] = panelWidth + 'px';
      document.body.style.overflowX = 'hidden';

      document.body.appendChild(hostElement);
      isSidebarOpen = true;
      
      console.log('✅ Sidebar built successfully');
    });
  }

  // ============================================
  // 3. UPDATE VIEWPORT (NEW)
  // ============================================

  function updateViewport(url) {
    if (!url) return;
    
    console.log(`🌐 Updating viewport to: ${url}`);
    
    // Try to send message to panel.js inside the iframe
    try {
      if (hostElement && hostElement.contentWindow) {
        hostElement.contentWindow.postMessage({
          type: 'UPDATE_VIEWPORT',
          url: url
        }, '*');
        console.log('✅ Viewport update message sent to panel');
      } else {
        console.warn('⚠️ Cannot update viewport: iframe not ready');
      }
    } catch (e) {
      console.warn('⚠️ Failed to update viewport:', e);
    }
    
    // Also try direct DOM manipulation as fallback
    try {
      const viewport = hostElement?.contentDocument?.getElementById('viewport');
      if (viewport) {
        viewport.src = url;
        console.log('✅ Viewport updated directly');
      }
    } catch (e) {
      // Cross-origin error, ignore
    }
  }

  // ============================================
  // 4. UPDATE ALIGNMENT
  // ============================================

  function updateAlignment(alignment) {
    console.log('Updating alignment to:', alignment);
    currentAlignment = alignment;
    if (!hostElement) {
      console.warn('No host element to update');
      return;
    }
    
    if (alignment === 'right') {
      hostElement.style.right = '0';
      hostElement.style.left = 'auto';
      hostElement.style.boxShadow = '-5px 0 25px rgba(0,0,0,0.3)';
    } else {
      hostElement.style.left = '0';
      hostElement.style.right = 'auto';
      hostElement.style.boxShadow = '5px 0 25px rgba(0,0,0,0.3)';
    }
    
    document.body.style.marginRight = '0px';
    document.body.style.marginLeft = '0px';
    document.body.style[alignment === 'right' ? 'marginRight' : 'marginLeft'] = panelWidth + 'px';
    
    console.log('✅ Alignment updated to:', alignment);
  }

  // ============================================
  // 5. REMOVE SIDEBAR
  // ============================================

  function removeSidebar() {
    console.log('Closing sidebar...');
    if (hostElement) {
      hostElement.style.display = 'none';
    }
    document.body.style.marginRight = '0px';
    document.body.style.marginLeft = '0px';
    document.body.style.overflowX = '';
    isSidebarOpen = false;
    console.log('✅ Sidebar closed');
  }

  // ============================================
  // 6. INITIALIZATION
  // ============================================

  console.log('Setting up message listener...');
  setupMessageListener();

  chrome.runtime.sendMessage({ action: "is-sidebar-open" }, function(response) {
    console.log('Initial state check response:', response);
    if (response && response.isOpen) {
      console.log('Sidebar should be open, building...');
      chrome.storage.local.get(['alignmentMode', 'viewportUrl'], function(res) {
        currentAlignment = res.alignmentMode || 'right';
        currentViewportUrl = res.viewportUrl || 'https://notion.so';
        buildSidebar();
      });
    } else {
      console.log('Sidebar should be closed initially');
    }
  });

  console.log('✅ Edgeless Sidebar ready in tab');
})();