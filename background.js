const ALARM_NAME = "free-to-roam-tick";
const STORAGE_KEY = "freeToRoamEnabled";

async function isEnabled() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] === true;
}

async function setEnabled(enabled) {
  await chrome.storage.local.set({ [STORAGE_KEY]: enabled });
}

async function updateBadge(enabled) {
  await chrome.action.setBadgeText({ text: enabled ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
}

async function notifyContentScripts(enabled) {
  const tabs = await chrome.tabs.query({ url: "*://*.ro.am/*" });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: "toggle", enabled }).catch(() => {});
  }
}

function manageAlarm(enabled) {
  if (enabled) {
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 0.5 });
  } else {
    chrome.alarms.clear(ALARM_NAME);
  }
}

// Toggle on icon click
chrome.action.onClicked.addListener(async () => {
  const enabled = !(await isEnabled());
  await setEnabled(enabled);
  await updateBadge(enabled);
  manageAlarm(enabled);
  await notifyContentScripts(enabled);
});

// Alarm tick — tell content scripts to dispatch mouse events
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  const tabs = await chrome.tabs.query({ url: "*://*.ro.am/*" });
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: "tick" }).catch(() => {});
  }
});

// Update badge when navigating to a tab
chrome.tabs.onActivated.addListener(async () => {
  await updateBadge(await isEnabled());
});

// Restore state on service worker startup
(async () => {
  const enabled = await isEnabled();
  await updateBadge(enabled);
  manageAlarm(enabled);
})();
