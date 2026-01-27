import { getSessionId, loadEvents } from "./utils";

document.getElementById("start").onclick = async () => {
  const id = await browser.runtime.sendMessage({ type: "START_SESSION" });
  console.log(id);
  if (!id) return;
  document.getElementById("session-id").innerText = `${id} running`;
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
  document.getElementById("session-id").innerText = `${sessionId} running`;

  const events = await loadEvents();
  document.getElementById("session-event-count").innerText =
    `Events: ${events?.length ?? 0}`;

  return events.length;
};

main();
