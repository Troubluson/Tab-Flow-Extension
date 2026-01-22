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
