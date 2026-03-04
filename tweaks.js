// Layout tweaks for ro.am — applied unconditionally when the extension is installed.
// Each tweak defines how to find target elements and what to do with them.
// A MutationObserver re-evaluates tweaks as the DOM changes.

const TWEAKS = [
  {
    name: "hide-download-mobile-app",
    // Find the button container wrapping the "Download Mobile App" text.
    // ancestors: 1 walks up one extra parent past the closest div match.
    find: () => findByText("Download Mobile App", "div", 1),
    action: "hide",
  },
  {
    name: "hide-get-verified-badge",
    // The verify badge button has no text — match by a unique prefix of the SVG path data.
    find: () => findBySvgPath("M6.016 2.029a2.775", "span"),
    action: "hide",
  },
  {
    name: "hide-stories-button",
    find: () => findByText("Stories", "span").concat(findByText("Add Story", "span")),
    action: "hide",
  },
  {
    name: "hide-monetization-button",
    find: () => findBySvgPath("M8 4a.5.5 0 0 1 .5.5V5H10", "span"),
    action: "hide",
  },
];

// --- Helpers ---

// Walk the DOM for elements containing exact text, return the closest ancestor matching `ancestorSelector`.
// `extraLevels` walks up additional matching ancestors (0 = closest match, 1 = one level up, etc.)
function findByText(text, ancestorSelector, extraLevels = 0) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const results = [];
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim() === text) {
      let ancestor = walker.currentNode.parentElement.closest(ancestorSelector);
      for (let i = 0; i < extraLevels && ancestor; i++) {
        ancestor = ancestor.parentElement?.closest(ancestorSelector);
      }
      if (ancestor && !results.includes(ancestor)) {
        results.push(ancestor);
      }
    }
  }
  return results;
}

// Find elements containing an SVG whose path `d` starts with `pathPrefix`,
// return the closest ancestor matching `ancestorSelector`.
function findBySvgPath(pathPrefix, ancestorSelector, extraLevels = 0) {
  const results = [];
  for (const path of document.querySelectorAll("svg path")) {
    if (path.getAttribute("d")?.startsWith(pathPrefix)) {
      let ancestor = path.closest(ancestorSelector);
      for (let i = 0; i < extraLevels && ancestor; i++) {
        ancestor = ancestor.parentElement?.closest(ancestorSelector);
      }
      if (ancestor && !results.includes(ancestor)) {
        results.push(ancestor);
      }
    }
  }
  return results;
}

// --- Engine ---

const applied = new Map(); // element -> Set<tweakName>

function applyTweaks() {
  for (const tweak of TWEAKS) {
    const elements = tweak.find();
    for (const el of elements) {
      if (applied.get(el)?.has(tweak.name)) continue;

      if (tweak.action === "hide") {
        el.style.setProperty("display", "none", "important");
      } else if (typeof tweak.action === "function") {
        tweak.action(el);
      }

      if (!applied.has(el)) applied.set(el, new Set());
      applied.get(el).add(tweak.name);
    }
  }
}

// Observe DOM mutations and reapply
const observer = new MutationObserver(() => applyTweaks());

if (document.body) {
  applyTweaks();
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener("DOMContentLoaded", () => {
    applyTweaks();
    observer.observe(document.body, { childList: true, subtree: true });
  });
}
