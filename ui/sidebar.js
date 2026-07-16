// ui/sidebar.js — Injected Sidebar Engine (Docked + Floating)

(function () {
  if (window.edgelessInjected) return;
  window.edgelessInjected = true;

  console.log("🚀 Edgeless Sidebar injected into tab");

  // Persistent state
  let isSidebarOpen = false;
  let currentAlignment = "right";
  let sidebarMode = "docked"; // docked | floating
  let sidebarWidth = 420;
  let currentViewportUrl = "https://notion.so";

  let hostElement = null;

  // Load persistent settings
  chrome.storage.local.get(
    ["alignmentMode", "sidebarMode", "sidebarWidth", "viewportUrl"],
    (res) => {
      currentAlignment = res.alignmentMode || "right";
      sidebarMode = res.sidebarMode || "docked";
      sidebarWidth = res.sidebarWidth || 420;
      currentViewportUrl = res.viewportUrl || "https://notion.so";
    }
  );

  // ============================================================
  // MESSAGE HANDLER
  // ============================================================

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggle-sidebar") {
      isSidebarOpen ? removeSidebar() : buildSidebar();
    }

    if (msg.action === "toggle-sidebar-mode") {
      sidebarMode = sidebarMode === "docked" ? "floating" : "docked";
      chrome.storage.local.set({ sidebarMode });
      if (isSidebarOpen) buildSidebar();
    }

    if (msg.action === "update-viewport") {
      currentViewportUrl = msg.url;
      updateViewport(currentViewportUrl);
    }
  });

  // ============================================================
  // BUILD SIDEBAR
  // ============================================================

  function buildSidebar() {
    if (hostElement) {
      hostElement.remove();
    }

    hostElement = document.createElement("iframe");
    hostElement.id = "edgeless-host-frame";
    hostElement.src = chrome.runtime.getURL("ui/panel.html");

    hostElement.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      border: none;
      background: #1a1a1e;
      transition: all 0.3s ease;
      width: ${sidebarWidth}px;
    `;

    applyModeStyles();

    hostElement.onload = () => {
      setTimeout(() => updateViewport(currentViewportUrl), 300);
    };

    document.body.appendChild(hostElement);
    isSidebarOpen = true;
  }

  // ============================================================
  // APPLY MODE STYLES (Docked / Floating)
  // ============================================================

  function applyModeStyles() {
    if (!hostElement) return;

    if (sidebarMode === "docked") {
      hostElement.style.top = "0";
      hostElement.style.height = "100vh";
      hostElement.style.borderRadius = "0";

      if (currentAlignment === "right") {
        hostElement.style.right = "0";
        hostElement.style.left = "auto";
        hostElement.style.boxShadow = "-5px 0 25px rgba(0,0,0,0.3)";
        document.body.style.marginRight = sidebarWidth + "px";
        document.body.style.marginLeft = "0px";
      } else {
        hostElement.style.left = "0";
        hostElement.style.right = "auto";
        hostElement.style.boxShadow = "5px 0 25px rgba(0,0,0,0.3)";
        document.body.style.marginLeft = sidebarWidth + "px";
        document.body.style.marginRight = "0px";
      }
    }

    if (sidebarMode === "floating") {
      document.body.style.marginRight = "0px";
      document.body.style.marginLeft = "0px";

      hostElement.style.top = "50px";
      hostElement.style.height = "calc(100vh - 100px)";
      hostElement.style.borderRadius = "12px";
      hostElement.style.boxShadow = "0 8px 30px rgba(0,0,0,0.35)";

      if (currentAlignment === "right") {
        hostElement.style.right = "20px";
        hostElement.style.left = "auto";
      } else {
        hostElement.style.left = "20px";
        hostElement.style.right = "auto";
      }
    }
  }

  // ============================================================
  // UPDATE VIEWPORT URL
  // ============================================================

  function updateViewport(url) {
    if (!hostElement) return;

    try {
      hostElement.contentWindow.postMessage(
        { type: "UPDATE_VIEWPORT", url },
        "*"
      );
    } catch (e) {}

    chrome.storage.local.set({ viewportUrl: url });
  }

  // ============================================================
  // RESIZE SUPPORT
  // ============================================================

  window.addEventListener("message", (event) => {
    if (event.data.type === "SIDEBAR_RESIZE") {
      sidebarWidth = event.data.width;
      chrome.storage.local.set({ sidebarWidth });
      applyModeStyles();
    }
  });

  // ============================================================
  // REMOVE SIDEBAR
  // ============================================================

  function removeSidebar() {
    if (hostElement) hostElement.remove();
    document.body.style.marginRight = "0px";
    document.body.style.marginLeft = "0px";
    isSidebarOpen = false;
  }

})();
