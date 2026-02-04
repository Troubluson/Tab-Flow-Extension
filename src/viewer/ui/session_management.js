import { getSessionId } from "../../utils";

/* ------------------ export ------------------ */
export async function exportSession() {
  const sessionId = await getSessionId();
  if (!sessionId) return alert("No active session to export.");

  const key = `events_${sessionId}`;
  const { [key]: events = [] } = await browser.storage.local.get(key);

  const blob = new Blob([JSON.stringify(events, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${sessionId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const importSession = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  const events = JSON.parse(text);

  await browser.runtime.sendMessage({
    type: "IMPORT_SESSION",
    events,
  });

  location.reload();
};
