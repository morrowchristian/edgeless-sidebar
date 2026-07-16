// ui/panel.js — Sidebar UI Logic

document.addEventListener("DOMContentLoaded", () => {

  // DOM
  const viewport = document.getElementById("viewport");
  const urlBar = document.getElementById("urlBar");
  const goBtn = document.getElementById("goBtn");
  const backBtn = document.getElementById("backBtn");
  const reloadBtn = document.getElementById("reloadBtn");
  const toggleModeBtn = document.getElementById("toggleModeBtn");

  const scratchpad = document.getElementById("scratchpad");
  const calculator = document.getElementById("calculator");
  const calcDisplay = document.getElementById("calcDisplay");

  const resizeHandle = document.getElementById("resizeHandle");

  // ============================================================
  // URL LOADING
  // ============================================================

  function loadUrl(url) {
    if (!url) return;

    url = url.trim();
    if (!url.startsWith("http")) url = "https://" + url;

    viewport.src = url;
    urlBar.value = url;

    chrome.runtime.sendMessage({ action: "viewport-url-changed", url });
  }

  goBtn.onclick = () => loadUrl(urlBar.value);
  urlBar.onkeydown = (e) => e.key === "Enter" && loadUrl(urlBar.value);

  backBtn.onclick = () => {
    try {
      viewport.contentWindow.history.back();
    } catch {
      viewport.src = viewport.src;
    }
  };

  reloadBtn.onclick = () => viewport.src = viewport.src;

  // ============================================================
  // MODE TOGGLE
  // ============================================================

  toggleModeBtn.onclick = () => {
    chrome.runtime.sendMessage({ action: "toggle-sidebar-mode" });
  };

  // ============================================================
  // RESIZE HANDLE
  // ============================================================

  let resizing = false;

  resizeHandle.addEventListener("mousedown", () => resizing = true);
  document.addEventListener("mouseup", () => resizing = false);

  document.addEventListener("mousemove", (e) => {
    if (!resizing) return;

    const newWidth = window.innerWidth - e.clientX;

    window.parent.postMessage({
      type: "SIDEBAR_RESIZE",
      width: newWidth
    }, "*");
  });

  // ============================================================
  // NOTES
  // ============================================================

  chrome.storage.local.get(["edgelessNotes"], (res) => {
    scratchpad.value = res.edgelessNotes || "";
  });

  scratchpad.oninput = () => {
    chrome.storage.local.set({ edgelessNotes: scratchpad.value });
  };

  // ============================================================
  // CALCULATOR
  // ============================================================

  let calcExpression = "";

  function updateCalcDisplay() {
    calcDisplay.value = calcExpression || "0";
  }

  document.querySelectorAll(".calc-btn").forEach((btn) => {
    btn.onclick = () => {
      const v = btn.dataset.value;

      if (v === "C") {
        calcExpression = "";
        return updateCalcDisplay();
      }

      if (v === "=") {
        try {
          calcExpression = eval(calcExpression).toString();
        } catch {
          calcExpression = "Error";
        }
        return updateCalcDisplay();
      }

      calcExpression += v;
      updateCalcDisplay();
    };
  });

  // ============================================================
  // WIDGET SWITCHING
  // ============================================================

  document.querySelectorAll(".widget-tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".widget-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const type = tab.dataset.widget;

      scratchpad.style.display = type === "notes" ? "block" : "none";
      calculator.style.display = type === "calculator" ? "block" : "none";
    };
  });

  // ============================================================
  // VIEWPORT INITIALIZATION
  // ============================================================

  window.addEventListener("message", (event) => {
    if (event.data.type === "UPDATE_VIEWPORT") {
      loadUrl(event.data.url);
    }
  });

  chrome.storage.local.get(["viewportUrl"], (res) => {
    const url = res.viewportUrl || "https://notion.so";
    loadUrl(url);
  });

});
