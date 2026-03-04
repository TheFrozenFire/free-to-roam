// Runs in MAIN world — overrides visibility APIs that Roam uses to detect background tabs
(function () {
  const originalAddEventListener = Document.prototype.addEventListener;
  const suppressedListeners = new Set();

  // Override document.hidden
  Object.defineProperty(document, "hidden", {
    configurable: true,
    get: () => false,
  });

  // Override document.visibilityState
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => "visible",
  });

  // Intercept visibilitychange listeners to suppress them
  Document.prototype.addEventListener = function (type, listener, options) {
    if (type === "visibilitychange") {
      suppressedListeners.add(listener);
      return;
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // Cleanup handler — restore originals when extension is disabled
  document.addEventListener("free-to-roam-cleanup", function onCleanup() {
    document.removeEventListener("free-to-roam-cleanup", onCleanup);

    // Restore original addEventListener
    Document.prototype.addEventListener = originalAddEventListener;

    // Restore original property descriptors
    delete document.hidden;
    delete document.visibilityState;

    suppressedListeners.clear();
  });
})();
