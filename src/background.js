// In-memory tab graph
// tabId -> { url, openerTabId }

let activeSession = null;

const getSessionKey = (id) => {
  return `events_${id}`;
};

const logEvent = async (event) => {
  if (!activeSession) {
    return;
  }
  const key = await getActiveSession();
  if (!key) return;
  const { [key]: events = [] } = await browser.storage.local.get(key);
  events.push(event);
  await browser.storage.local.set({ [key]: events });
};

async function startSession() {
  const id = `session_${Date.now()}`;
  activeSession = id;
  await browser.storage.local.set({
    activeSession: id,
    [sessionKey(id)]: [],
  });
  return id;
}

const endSession = async () => {
  console.log(`Session ended ${activeSession}`);
  activeSession = null;
  await browser.storage.local.remove("activeSession");
};

browser.tabs.onCreated.addListener((tab) => {
  logEvent({
    id: crypto.randomUUID(),
    type: "tab-created",
    tabId: tab.id,
    openerTabId: tab.openerTabId ?? null,
    url: tab.url ?? null,
    timestamp: Date.now(),
  });
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    logEvent({
      id: crypto.randomUUID(),
      type: "tab-updated",
      tabId,
      url: changeInfo.url,
      timestamp: Date.now(),
    });
  }
});

// Track URL changes (navigation)
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    logEvent({
      id: crypto.randomUUID(),
      type: "tab-updated",
      tabId,
      url: changeInfo.url,
      timestamp: Date.now(),
    });
  }
});

browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({
    url: browser.runtime.getURL("dist/viewer.html"),
  });
});

const getActiveSession = async () => {
  const { activeSession } = await browser.storage.local.get("activeSession");
  return activeSession ?? null;
};

/** Messaging */

browser.runtime.onMessage.addListener((msg, sender) => {
  switch (msg.type) {
    case "START_SESSION":
      startSession(msg.sessionId);
      return true;
    case "END_SESSION":
      endSession();
      return true;
    case "GET_ACTIVE_SESSION":
      return getActiveSession();
    case "GET_EVENTS":
      if (!activeSession) return [];
      return getActiveSession().then(async (id) => {
        if (!id) return [];
        const key = getSessionKey(id);
        const { [key]: events = [] } = await browser.storage.local.get(key);
        return events;
      });
  }
});
