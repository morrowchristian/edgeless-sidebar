// ui/panel.js - With URL Bar Support

document.addEventListener('DOMContentLoaded', function() {
  // ============================================
  // DOM REFERENCES
  // ============================================
  
  const tower = document.getElementById('appTower');
  const pinBtn = document.getElementById('pinBtn');
  const view = document.getElementById('viewport');
  const scratchpad = document.getElementById('scratchpad');
  const widgetTabs = document.querySelectorAll('.widget-tab');
  const calculator = document.getElementById('calculator');
  const calcDisplay = document.getElementById('calcDisplay');
  
  // URL Bar elements
  const urlBar = document.getElementById('urlBar');
  const goBtn = document.getElementById('goBtn');
  const backBtn = document.getElementById('backBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  
  // ============================================
  // URL BAR FUNCTIONALITY
  // ============================================
  
  function loadUrl(url) {
    if (!url) return;
    
    // Clean up the URL
    url = url.trim();
    
    // If no protocol, add https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log('🌐 Loading URL:', url);
    view.src = url;
    urlBar.value = url;
    
    // Save to storage
    chrome.storage.local.set({ viewportUrl: url });
    chrome.runtime.sendMessage({
      action: "viewport-url-changed",
      url: url
    });
  }
  
  // Go button
  goBtn.addEventListener('click', function() {
    loadUrl(urlBar.value);
  });
  
  // Enter key in URL bar
  urlBar.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      loadUrl(urlBar.value);
    }
  });
  
  // Back button
  backBtn.addEventListener('click', function() {
    try {
      // Try to go back in iframe history
      view.contentWindow.history.back();
    } catch (e) {
      // If cross-origin, reload the current URL
      console.log('Cannot navigate back in iframe, reloading');
      view.src = view.src;
    }
  });
  
  // Reload button
  reloadBtn.addEventListener('click', function() {
    view.src = view.src;
  });
  
  // ============================================
  // PERSISTENT NOTES LOGIC
  // ============================================
  
  // Load saved notes
  chrome.storage.local.get(['edgelessNotes'], function(result) {
    if (result.edgelessNotes) {
      scratchpad.value = result.edgelessNotes;
    }
  });

  // Auto-save notes on every keystroke
  scratchpad.oninput = function() {
    chrome.storage.local.set({ edgelessNotes: scratchpad.value });
  };

  // ============================================
  // APP ICON MANAGEMENT
  // ============================================
  
  function createAppIcon(targetUrl, title) {
    if (!targetUrl) return;
    
    const iconWrapper = document.createElement('button');
    iconWrapper.className = 'edgeless-app-icon';
    iconWrapper.title = title || targetUrl;
    iconWrapper.dataset.url = targetUrl;

    // Extract domain letter for fallback avatar
    let domainLetter = "★";
    try {
      const urlObj = new URL(targetUrl);
      domainLetter = urlObj.hostname.replace('www.', '').charAt(0).toUpperCase();
    } catch(e) {
      if (title) domainLetter = title.charAt(0).toUpperCase();
    }

    // Create image with favicon
    const img = document.createElement('img');
    img.className = 'edgeless-app-img';
    img.alt = title || 'App icon';
    
    try {
      const urlObj = new URL(targetUrl);
      img.src = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
    } catch(e) {
      img.src = '';
    }

    // Fallback to text avatar if favicon fails
    img.onerror = function() {
      img.remove();
      const textLetter = document.createElement('span');
      textLetter.innerText = domainLetter;
      iconWrapper.appendChild(textLetter);
    };
    
    iconWrapper.appendChild(img);
    
    // Click to load in viewport
    iconWrapper.onclick = function() { 
      loadUrl(targetUrl);
    };
    
    // Add delete button
    addDeleteButton(iconWrapper);
    
    // Insert before pin button
    tower.insertBefore(iconWrapper, pinBtn);
    
    savePinnedApps();
  }

  // Add delete button to app icons
  function addDeleteButton(iconWrapper) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', 'Remove pinned app');
    deleteBtn.onclick = function(e) {
      e.stopPropagation();
      iconWrapper.remove();
      savePinnedApps();
    };
    iconWrapper.appendChild(deleteBtn);
  }

  // Save pinned apps to chrome.storage
  function savePinnedApps() {
    const icons = tower.querySelectorAll('.edgeless-app-icon');
    const apps = [];
    icons.forEach(function(icon) {
      const url = icon.dataset.url;
      if (url) {
        apps.push({ 
          url: url, 
          title: icon.title || url 
        });
      }
    });
    chrome.storage.local.set({ edgelessPinnedApps: apps });
  }

  // Load pinned apps from chrome.storage
  function loadPinnedApps() {
    chrome.storage.local.get(['edgelessPinnedApps'], function(result) {
      if (result.edgelessPinnedApps && Array.isArray(result.edgelessPinnedApps)) {
        result.edgelessPinnedApps.forEach(function(app) {
          // Check if already exists to prevent duplicates
          const exists = Array.from(tower.querySelectorAll('.edgeless-app-icon'))
            .some(function(icon) { return icon.dataset.url === app.url; });
          if (!exists) {
            createAppIcon(app.url, app.title);
          }
        });
      }
    });
  }

  // Clear all pinned apps
  function clearAllApps() {
    const icons = tower.querySelectorAll('.edgeless-app-icon');
    icons.forEach(function(icon) {
      icon.remove();
    });
    savePinnedApps();
  }

  // ============================================
  // PIN BUTTON ACTION
  // ============================================
  
  pinBtn.onclick = function() {
    chrome.runtime.sendMessage({ action: "get-active-tab" }, function(response) {
      if (response && response.url) {
        // Check if already pinned
        const existingIcons = tower.querySelectorAll('.edgeless-app-icon');
        let alreadyPinned = false;
        existingIcons.forEach(function(icon) {
          if (icon.dataset.url === response.url) {
            alreadyPinned = true;
          }
        });
        
        if (!alreadyPinned) {
          createAppIcon(response.url, response.title || "Pinned Page");
        }
      }
    });
  };

  // ============================================
  // CLEAR ALL BUTTON
  // ============================================
  
  function addClearButton() {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'edgeless-pin-btn clear-all';
    clearBtn.textContent = '✕';
    clearBtn.title = 'Clear All Pinned Apps';
    clearBtn.onclick = clearAllApps;
    tower.appendChild(clearBtn);
  }

  // ============================================
  // WIDGET TRAY MANAGEMENT
  // ============================================
  
  // Widget tab switching
  widgetTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      // Update active tab
      widgetTabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      
      // Show/hide widgets
      const widgetType = tab.dataset.widget;
      document.querySelectorAll('.widget-content > *').forEach(function(content) {
        content.style.display = 'none';
      });
      
      if (widgetType === 'notes') {
        scratchpad.style.display = 'block';
      } else if (widgetType === 'calculator') {
        calculator.style.display = 'block';
      }
    });
  });

  // ============================================
  // CALCULATOR LOGIC
  // ============================================
  
  let calcExpression = '';
  
  function updateCalcDisplay() {
    calcDisplay.value = calcExpression || '0';
  }

  document.querySelectorAll('.calc-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const value = btn.dataset.value;
      
      if (value === '=') {
        try {
          calcExpression = eval(calcExpression).toString();
        } catch(e) {
          calcExpression = 'Error';
        }
        updateCalcDisplay();
        return;
      }
      
      if (value === 'C') {
        calcExpression = '';
        updateCalcDisplay();
        return;
      }
      
      calcExpression += value;
      updateCalcDisplay();
    });
  });

  // Keyboard support for calculator
  calcDisplay.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      try {
        calcExpression = eval(calcExpression).toString();
      } catch(e) {
        calcExpression = 'Error';
      }
      updateCalcDisplay();
      e.preventDefault();
    }
  });

  // ============================================
  // CONTEXT AWARENESS
  // ============================================
  
  function updateContextView(url, title) {
    if (!url) return;
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Smart URL detection and auto-switching
      let targetUrl = null;
      
      if (domain.includes('notion')) {
        targetUrl = 'https://notion.so';
      } else if (domain.includes('youtube')) {
        targetUrl = 'https://youtube.com';
      } else if (domain.includes('whatsapp') || domain.includes('wa.me')) {
        targetUrl = 'https://web.whatsapp.com';
      } else if (domain.includes('github')) {
        targetUrl = 'https://github.com';
      } else if (domain.includes('gmail') || domain.includes('mail.google')) {
        targetUrl = 'https://mail.google.com';
      } else if (domain.includes('calendar') || domain.includes('calendar.google')) {
        targetUrl = 'https://calendar.google.com';
      } else if (domain.includes('drive') || domain.includes('drive.google')) {
        targetUrl = 'https://drive.google.com';
      } else if (domain.includes('docs') || domain.includes('docs.google')) {
        targetUrl = 'https://docs.google.com';
      }
      
      if (targetUrl) {
        loadUrl(targetUrl);
      }
    } catch(e) {
      // Invalid URL, ignore
    }
  }

  // Listen for context updates from background
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === "active-tab-changed") {
      updateContextView(message.url, message.title);
    }
  });

  // Load initial context
  chrome.storage.local.get(['activeTabUrl', 'activeTabTitle'], function(result) {
    if (result.activeTabUrl) {
      updateContextView(result.activeTabUrl, result.activeTabTitle);
    }
  });

  // ============================================
  // LOAD SAVED VIEWPORT URL
  // ============================================
  
  chrome.storage.local.get(['viewportUrl'], function(result) {
    if (result.viewportUrl) {
      view.src = result.viewportUrl;
      urlBar.value = result.viewportUrl;
    }
  });

  // ============================================
  // INITIALIZATION
  // ============================================
  
  // Load default apps
  const defaultApps = [
    { url: 'https://google.com', title: 'Google' },
    { url: 'https://github.com', title: 'GitHub' }
  ];
  
  defaultApps.forEach(function(app) {
    createAppIcon(app.url, app.title);
  });
  
  // Load saved pinned apps
  loadPinnedApps();
  
  // Add clear button
  addClearButton();
  
  // Show notes widget by default
  scratchpad.style.display = 'block';
  calculator.style.display = 'none';
  
  console.log('✅ Edgeless Sidebar Panel ready');
});