(function() {
  // If the host container already exists, destroy it and reset margins
  const activeHost = document.getElementById('edgeless-host');
  if (activeHost) {
    activeHost.remove();
    document.body.style.marginRight = '0px';
    document.body.style.marginLeft = '0px';
    return;
  }

  const config = {
    alignment: 'right',
    mode: 'split',
    panelWidth: 420
  };

  // 1. Create a bulletproof host wrapper
  const host = document.createElement('div');
  host.id = 'edgeless-host';
  
  // Enforce isolation rules via style forcing directly on the host node
  Object.assign(host.style, {
    position: 'fixed',
    top: '0',
    height: '100vh',
    width: `${config.panelWidth}px`,
    zIndex: '2147483647',
    boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
    transition: 'transform 0.3s ease'
  });
  host.style[config.alignment] = '0';

  // 2. Open a secure Shadow DOM gate
  const shadowRoot = host.attachShadow({ mode: 'open' });

  // 3. Inject the isolated style sheets safely inside the shadow gate
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('ui/sidebar.css');
  shadowRoot.appendChild(styleLink);

  // 4. Build the primary frame container
  const root = document.createElement('div');
  root.id = 'edgeless-root';
  root.style.width = '100%';
  root.style.height = '100%';
  root.style.display = 'flex';

  // Shift host webpage if split layout layout is chosen
  if (config.mode === 'split') {
    document.body.style.transition = 'margin 0.3s ease';
    if (config.alignment === 'right') {
      document.body.style.marginRight = `${config.panelWidth}px`;
    } else {
      document.body.style.marginLeft = `${config.panelWidth}px`;
    }
  }

  // 5. Construct structural zones
  const tower = document.createElement('div');
  tower.className = 'edgeless-app-tower';

  // Create the main panel workspace to the right of the icon tower
  const mainPanel = document.createElement('div');
  mainPanel.className = 'edgeless-main-panel';

  // Build the Top-Locked Widget Deck
  const widgetDeck = document.createElement('div');
  widgetDeck.className = 'edgeless-widget-deck';
  
  // Inject a live local scratchpad widget into the deck
  const scratchpad = document.createElement('textarea');
  scratchpad.className = 'edgeless-scratchpad';
  scratchpad.placeholder = 'Edgeless Quick Notes... (Locked)';
  chrome.storage.local.get(['edgelessNotes'], (result) => {
    if (result.edgelessNotes) {
      scratchpad.value = result.edgelessNotes;
    }
  })
  
  scratchpad.oninput = () => {
    chrome.storage.local.set({ edgelessNotes: scratchpad.value});
  };
  
  widgetDeck.appendChild(scratchpad);

  // Build the Web App Viewport Container
  const viewportContainer = document.createElement('div');
  viewportContainer.className = 'edgeless-viewport-container';

  const view = document.createElement('iframe');
  view.className = 'edgeless-viewport';
  view.style.width = '100%';
  view.style.height = '100%';
  view.src = 'https://notion.so';
  viewportContainer.appendChild(view);

  // Assemble the multi-tier panel hierarchy
  mainPanel.appendChild(widgetDeck);
  mainPanel.appendChild(viewportContainer);

  const pinBtn = document.createElement('button');
  pinBtn.className = 'edgeless-pin-btn';
  pinBtn.innerText = '＋';

  pinBtn.onclick = () => {
    const targetUrl = window.location.href;
    const targetTitle = document.title;
    const faviconUrl = `https://google.com{window.location.hostname}`;
    createAppIcon(faviconUrl, targetUrl, targetTitle);
  };

  function createAppIcon(iconUrl, targetUrl, title) {
    const iconWrapper = document.createElement('button');
    iconWrapper.className = 'edgeless-app-icon';
    iconWrapper.title = title;

    const img = document.createElement('img');
    img.className = 'edgeless-app-img';
    img.src = iconUrl;

    iconWrapper.appendChild(img);
    iconWrapper.onclick = () => { 
      view.src = targetUrl; 
    };
    tower.insertBefore(iconWrapper, pinBtn);
  }

  // Align internal structural groups based on side settings
  tower.style.order = config.alignment === 'right' ? '0' : '0';
  mainPanel.style.order = config.alignment === 'right' ? '1' : '-1';

  // 6. Build the structural tree and mount it to the main page body
  tower.appendChild(pinBtn);
  root.appendChild(tower);
  root.appendChild(mainPanel);
  shadowRoot.appendChild(root);
  document.body.appendChild(host);

  // Load sample starter setups
  createAppIcon('https://google.com', 'https://notion.so', 'Notion');
  createAppIcon('https://google.com', 'https://youtube.com', 'YouTube');
})();
