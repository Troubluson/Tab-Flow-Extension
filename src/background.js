let activeSession = null;
const lastPageByTab = new Map();

const openerTabByTab = new Map(); // tabId → openerTabId

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
    [getSessionKey(id)]: [],
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

/* Get which tab spawned another tab */
browser.tabs.onCreated.addListener((tab) => {
  if (tab.openerTabId != null) {
    openerTabByTab.set(tab.id, tab.openerTabId);
  }
  console.log(tab.id, tab.openerTabId);
});

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

  /* same-tab navigation */
  if (lastPageByTab.has(tabId)) {
    sourcePageId = lastPageByTab.get(tabId);
  }

  /* new-tab navigation (from opener) */
  const openerTabId = openerTabByTab.get(tabId);
  if (openerTabId != null) {
    const openerPageId = lastPageByTab.get(openerTabId);
    if (openerPageId) {
      sourcePageId = openerPageId;
    }
  }
  console.log(details);
  const event = {
    type: "page",
    pageId,
    sourcePageId,
    tabId,
    url: details.url,
    title: tab.title ?? details.url,
    favicon: tab.favIconUrl ?? null,
    timestamp,
  };
  console.log(`opened ${details.url} from ${tabId}`);

  lastPageByTab.set(tabId, pageId);
  openerTabByTab.delete(tabId);

  await logEvent(event);
});

// Fetch favicon if wasn't available before
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!activeSession) return;
  if (changeInfo.favIconUrl) {
    const pageId = lastPageByTab.get(tabId);
    if (!pageId) return;

    updateFavicon(pageId, changeInfo.favIconUrl);
  }
  if (changeInfo.title) {
    const pageId = lastPageByTab.get(tabId);
    if (!pageId) return;
    updateTitle(pageId, changeInfo.title);
  }
  return;
});

async function updateFavicon(pageId, faviconUrl) {
  const key = getSessionKey(activeSession);
  const { [key]: events = [] } = await browser.storage.local.get(key);

  const event = events.find((e) => e.pageId === pageId);
  if (!event) return;

  if (event.favicon) return; // don't overwrite

  event.favicon = faviconUrl;
  await browser.storage.local.set({ [key]: events });
}

async function updateTitle(pageId, title) {
  const key = getSessionKey(activeSession);
  const { [key]: events = [] } = await browser.storage.local.get(key);

  const event = events.find((e) => e.pageId === pageId);
  if (!event) return;

  if (event.title) return; // don't overwrite

  event.title = title;
  await browser.storage.local.set({ [key]: events });
}

/* ---------------- UI ---------------- */

browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({
    url: browser.runtime.getURL("dist/viewer.html"),
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
