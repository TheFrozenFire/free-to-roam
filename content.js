let injected = false;

function injectScript() {
  if (injected) return;
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject.js");
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
  injected = true;
}

function removeOverrides() {
  document.dispatchEvent(new CustomEvent("free-to-roam-cleanup"));
  injected = false;
}

function dispatchMouseMove() {
  const x = 300 + Math.random() * 200;
  const y = 300 + Math.random() * 200;
  document.dispatchEvent(
    new MouseEvent("mousemove", {
      bubbles: true,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
    })
  );
}

function activate() {
  injectScript();
}

function deactivate() {
  removeOverrides();
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "toggle") {
    if (message.enabled) {
      activate();
    } else {
      deactivate();
    }
  } else if (message.type === "tick") {
    dispatchMouseMove();
  }
});

// Check initial state on load
chrome.storage.local.get("freeToRoamEnabled", (result) => {
  if (result.freeToRoamEnabled === true) {
    activate();
  }
});
