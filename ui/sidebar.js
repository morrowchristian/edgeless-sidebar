(function() {
  // If the panel already exists, destroy it and reset the webpage margins (Toggle Behavior)
  const activeSidebar = document.getElementById('edgeless-root');
  if (activeSidebar) {
    activeSidebar.remove();
    document.body.style.marginRight = '0px';
    document.body.style.marginLeft = '0px';
    return;
  }

  // --- INTERFACE SETTINGS CHASSIS ---
  const config = {
    alignment: 'right',     // Placement target: 'left' or 'right'
    mode: 'split',         // Behavior layout: 'split' (squeezes page) or 'floating' (drawer over page)
    panelWidth: 420        // Base layout width in pixels
  };

  // 1. Inject the extension style sheets cleanly into the webpage header
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('ui/sidebar.css');
  document.head.appendChild(styleLink);

  // 2. Build the primary frame structure
  const root = document.createElement('div');
  root.id = 'edgeless-root';
  root.style.width = `${config.panelWidth}px`;

  // Apply chosen edge alignments 
  if (config.alignment === 'right') {
    root.style.right = '0';
  } else {
    root.style.left = '0';
  }

  // 3. Shift the host webpage body layout if split mode is selected
  if (config.mode === 'split') {
    document.body.style.transition = 'margin 0.3s ease';
    if (config.alignment === 'right') {
      document.body.style.marginRight = `${config.panelWidth}px`;
    } else {
      document.body.style.marginLeft = `${config.panelWidth}px`;
    }
  }

  // 4. Construct internal container zones
  const tower = document.createElement('div');
  tower.className = 'edgeless-app-tower';

  const view = document.createElement('iframe');
  view.className = 'edgeless-viewport';
  view.src = 'https://notion.so'; // Starting default frame app

  // Handle visual element sorting based on left/right preferences
  tower.style.order = config.alignment === 'right' ? '0' : '0';
  view.style.order = config.alignment === 'right' ? '1' : '-1';

  // Assemble the UI nodes together onto the screen
  root.appendChild(tower);
  root.appendChild(view);
  document.body.appendChild(root);
})();
