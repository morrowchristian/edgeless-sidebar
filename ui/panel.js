// ui/panel.js

document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const tower = document.getElementById('appTower');
  const pinBtn = document.getElementById('pinBtn');
  const view = document.getElementById('viewport');
  const scratchpad = document.getElementById('scratchpad');
  const widgetTabs = document.querySelectorAll('.widget-tab');
  const calculator = document.getElementById('calculator');
  const calcDisplay = document.getElementById('calcDisplay');

  // ============================================
  // 1. PERSISTENT NOTES LOGIC
  // ============================================
  
  // Load saved notes
  chrome.storage.local.get(['edgelessNotes'], (result) => {
    if (result.edgelessNotes) {
      scratchpad.value = result.edgelessNotes;
    }
  });

  // Auto-save notes on every keystroke
  scratchpad.oninput = () => {
    chrome.storage.local.set({ edgelessNotes: scratchpad.value });
  };

  // ============================================
  // 2. APP ICON MANAGEMENT
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
    img.onerror = () => {
      img.remove();
      const textLetter = document.createElement('span');
      textLetter.innerText = domainLetter;
      iconWrapper.appendChild(textLetter);
    };
    
    iconWrapper.appendChild(img);
    
    // Click to load in viewport
    iconWrapper.onclick = () => { 
      if (view) view.src = targetUrl; 
    };
    
    // Add delete button
    addDeleteButton(iconWrapper);
    
    // Insert before pin button
    tower.insertBefore(iconWrapper, pinBtn);
    
    // Save to storage
    savePinnedApps();
  }

  // Add delete button to app icons
  function addDeleteButton(iconWrapper) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.setAttribute('aria-label', 'Remove pinned app');
    deleteBtn.onclick = (e) => {
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
    icons.forEach(icon => {
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
    chrome.storage.local.get(['edgelessPinnedApps'], (result) => {
      if (result.edgelessPinnedApps && Array.isArray(result.edgelessPinnedApps)) {
        result.edgelessPinnedApps.forEach(app => {
          // Check if already exists to prevent duplicates
          const exists = Array.from(tower.querySelectorAll('.edgeless-app-icon'))
            .some(icon => icon.dataset.url === app.url);
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
    icons.forEach(icon => {
      icon.remove();
    });
    savePinnedApps();
  }

  // ============================================
  // 3. PIN BUTTON ACTION
  // ============================================
  
  pinBtn.onclick = async () => {
    chrome.runtime.sendMessage({ action: "get-active-tab" }, (response) => {
      if (response && response.url) {
        // Check if already pinned
        const existingIcons = tower.querySelectorAll('.edgeless-app-icon');
        let alreadyPinned = false;
        existingIcons.forEach(icon => {
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
  // 4. CLEAR ALL BUTTON
  // ============================================
  
  function addClearButton() {
    const clearBtn = document.createElement('button');
    clearBtn.className = 'edgeless-pin-btn';
    clearBtn.textContent = '✕';
    clearBtn.style.backgroundColor = '#dc3545';
    clearBtn.title = 'Clear All Pinned Apps';
    clearBtn.onclick = clearAllApps;
    tower.appendChild(clearBtn);
  }

  // ============================================
  // 5. WIDGET TRAY MANAGEMENT
  // ============================================
  
  // Widget tab switching
  widgetTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      widgetTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show/hide widgets
      const widgetType = tab.dataset.widget;
      document.querySelectorAll('.widget-content > *').forEach(content => {
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
  // 6. CALCULATOR LOGIC
  // ============================================
  
  let calcExpression = '';
  
  function updateCalcDisplay() {
    calcDisplay.value = calcExpression || '0';
  }

  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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
  calcDisplay.addEventListener('keydown', (e) => {
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
  // 7. CONTEXT AWARENESS
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
      
      if (targetUrl && view) {
        view.src = targetUrl;
      }
    } catch(e) {
      // Invalid URL, ignore
    }
  }

  // Listen for context updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "active-tab-changed") {
      updateContextView(message.url, message.title);
    }
  });

  // Load initial context
  chrome.storage.local.get(['activeTabUrl', 'activeTabTitle'], (result) => {
    if (result.activeTabUrl) {
      updateContextView(result.activeTabUrl, result.activeTabTitle);
    }
  });

  // ============================================
  // 8. INITIALIZATION
  // ============================================
  
  // Load default apps
  const defaultApps = [
    { url: 'https://notion.so', title: 'Notion' },
    { url: 'https://youtube.com', title: 'YouTube' }
  ];
  
  defaultApps.forEach(app => {
    createAppIcon(app.url, app.title);
  });
  
  // Load saved pinned apps
  loadPinnedApps();
  
  // Add clear button
  addClearButton();
  
  // Show notes widget by default
  scratchpad.style.display = 'block';
  calculator.style.display = 'none';
});