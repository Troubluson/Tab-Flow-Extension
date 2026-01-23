let activeSession = null;
const lastPageByTab = new Map();

const getSessionKey = (id) => `events_${id}`;

/* ---------------- storage helpers ---------------- */

async function logEvent(event) {
  if (!activeSession) return;

  const key = getSessionKey(activeSession);
  const { [key]: events = [] } = await browser.storage.local.get(key);
  events.push(event);
  await browser.storage.local.set({ [key]: events });
}

async function startSession() {
  const id = `session_${Date.now()}`;
  activeSession = id;
  lastPageByTab.clear();

  await browser.storage.local.set({
    activeSession: id,
    [getSessionKey(id)]: []
  });

  return id;
}

async function endSession() {
  activeSession = null;
  lastPageByTab.clear();
  await browser.storage.local.remove("activeSession");
}

async function getActiveSession() {
  const { activeSession } = await browser.storage.local.get("activeSession");
  return activeSession ?? null;
}

/* ---------------- navigation → page ---------------- */

browser.webNavigation.onCommitted.addListener(async (details) => {
  if (!activeSession) return;
  if (details.frameId !== 0) return;
  if (!details.url || details.url.startsWith("about:")) return;

  const tabId = details.tabId;
  const pageId = crypto.randomUUID();
  const timestamp = Date.now();

  let tab;
  try {
    tab = await browser.tabs.get(tabId);
  } catch {
    return;
  }

  let sourcePageId = null;

  // Same-tab navigation
  if (lastPageByTab.has(tabId)) {
    sourcePageId = lastPageByTab.get(tabId);
  }

  // New tab opened from another tab
  if (details.openerTabId != null) {
    const openerPage = lastPageByTab.get(details.openerTabId);
    if (openerPage) {
      sourcePageId = openerPage;
    }
  }

  const event = {
    type: "page",
    pageId,
    sourcePageId,
    tabId,
    url: details.url,
    title: tab.title ?? details.url,
    favicon: tab.favIconUrl ?? null,
    timestamp
  };

  lastPageByTab.set(tabId, pageId);
  await logEvent(event);
});

/* ---------------- UI ---------------- */

browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({
    url: browser.runtime.getURL("dist/viewer.html")
  });
});

/* ---------------- messaging ---------------- */

browser.runtime.onMessage.addListener(async (msg) => {
  switch (msg.type) {
    case "START_SESSION":
      return await startSession();

    case "END_SESSION":
      await endSession();
      return true;

    case "GET_ACTIVE_SESSION":
      return await getActiveSession();

    case "GET_EVENTS": {
      const id = await getActiveSession();
      if (!id) return [];
      const key = getSessionKey(id);
      const { [key]: events = [] } = await browser.storage.local.get(key);
      return events;
    }
  }
});
