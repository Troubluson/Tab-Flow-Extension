const captureThumbnail = async (url, tabId) => {
  try {
    const res = await fetch(url, { mode: "cors" });
    const text = await res.text();
    const match = text.match(
      /<meta\s+property=["']og:image["']\s+content=["']([^"']+)/,
    );
    const isMatch = match ? match[1] : null;
    if (isMatch) {
      return match[1];
    }
    const dataUrl = await browser.tabs.captureTab(tabId, {
      format: "jpeg",
      quality: 30, // low quality = small thumbnail
    });

    return dataUrl;
  } catch (err) {
    console.warn("Thumbnail capture failed:", err);

    return null;
  }
};

export const loadEvents = async () => {
  return browser.runtime.sendMessage({ type: "GET_EVENTS" });
};

export const getSessionId = async () => {
  return browser.runtime.sendMessage({ type: "GET_ACTIVE_SESSION" });
};

export const domainFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
};

export const timeScalePower = (minT, maxT, alpha = 0.4) => {
  return (t) => Math.pow((t - minT) / (maxT - minT), alpha);
};

export const safeLabel = (text) => {
  if (!text) return "";
  return text.length > 50 ? text.slice(0, 47) + "…" : text;
};
