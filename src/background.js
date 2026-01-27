import { domainFromUrl } from "./utils";

/* =========================
   Session state
========================= */

let activeSession = null;

// tabId -> last pageId in that tab
const lastPageByTab = new Map();

// tabId -> openerTabId
const openerTabByTab = new Map();

const getSessionKey = (id) => `events_${id}`;

/* =========================
   Storage helpers
========================= */

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
  openerTabByTab.clear();

  await browser.storage.local.set({
    activeSession: id,
    [getSessionKey(id)]: [],
  });

  return id;
}

async function endSession() {
  activeSession = null;
  lastPageByTab.clear();
  openerTabByTab.clear();
  await browser.storage.local.remove("activeSession");
}

async function getActiveSession() {
  const { activeSession } = await browser.storage.local.get("activeSession");
  return activeSession ?? null;
}

/* =========================
   Tab creation (opener)
========================= */

browser.tabs.onCreated.addListener((tab) => {
  if (tab.openerTabId != null) {
    openerTabByTab.set(tab.id, tab.openerTabId);
  }
});

/* =========================
   Navigation → page event
========================= */

browser.webNavigation.onCommitted.addListener(async (details) => {
  if (!activeSession) return;
  if (details.frameId !== 0) return;
  if (!details.url || details.url.startsWith("about:")) return;

  const tabId = details.tabId;
  const timestamp = Date.now();
  const pageId = crypto.randomUUID();

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
  const openerTabId = openerTabByTab.get(tabId);
  if (openerTabId != null) {
    const openerPageId = lastPageByTab.get(openerTabId);
    if (openerPageId) {
      sourcePageId = openerPageId;
    }
  }

  const event = {
    type: "page",
    pageId,
    sourcePageId,
    tabId,
    url: details.url,
    domain: domainFromUrl(details.url),
    // Title is provisional at navigation time
    title: tab.title || null,
    titleProvisional: true,
    favicon: tab.favIconUrl ?? null,
    timestamp,
  };

  lastPageByTab.set(tabId, pageId);
  openerTabByTab.delete(tabId);

  await logEvent(event);
});

/* =========================
   Tab updates (title, favicon)
========================= */

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!activeSession) return;

  const pageId = lastPageByTab.get(tabId);
  if (!pageId) return;

  if (changeInfo.title) {
    updateTitle(pageId, changeInfo.title);
  }

  if (changeInfo.favIconUrl) {
    updateFavicon(pageId, changeInfo.favIconUrl);
  }
});

/* =========================
   Event updaters
========================= */

async function updateTitle(pageId, title) {
  const key = getSessionKey(activeSession);
  const { [key]: events = [] } = await browser.storage.local.get(key);

  const event = events.find((e) => e.pageId === pageId);
  if (!event) return;

  const now = Date.now();

  // Allow overwrite if:
  // - no title yet
  // - provisional title
  // - within short grace window (SPA safety)
  if (!event.title || event.titleProvisional || now - event.timestamp < 5000) {
    event.title = title;
    event.titleProvisional = false;
    event.titleUpdatedAt = now;
    await browser.storage.local.set({ [key]: events });
  }
}

async function updateFavicon(pageId, faviconUrl) {
  const key = getSessionKey(activeSession);
  const { [key]: events = [] } = await browser.storage.local.get(key);

  const event = events.find((e) => e.pageId === pageId);
  if (!event) return;

  // First favicon wins
  if (!event.favicon) {
    event.favicon = faviconUrl;
    await browser.storage.local.set({ [key]: events });
  }
}

/* =========================
   UI entry point
========================= */

browser.browserAction.onClicked.addListener(() => {
  browser.tabs.create({
    url: browser.runtime.getURL("dist/viewer.html"),
  });
});

/* =========================
   Messaging API
========================= */

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
