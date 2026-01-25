import { getSessionId, loadEvents } from "./utils";

document.getElementById("start").onclick = async () => {
  const id = await browser.runtime.sendMessage({ type: "START_SESSION" });
};

document.getElementById("end").onclick = async () => {
  await browser.runtime.sendMessage({ type: "END_SESSION" });
  document.getElementById("session-id").innerText = "No session running";
  document.getElementById("session-event-count").innerText = "Events: 0";
};

document.getElementById("open").onclick = () => {
  browser.tabs.create({
    url: browser.runtime.getURL("dist/viewer.html"),
  });
};

const main = async () => {
  const sessionId = await getSessionId();
  if (!sessionId) return;
  document.getElementById("session-id").innerText =
    "Events: " + String(sessionId);
  const events = await loadEvents();
  document.getElementById("session-event-count").innerText = events.length;
};

main();
