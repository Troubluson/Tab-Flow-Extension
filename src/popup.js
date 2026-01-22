document.getElementById("start").onclick = async () => {
  const id = await browser.runtime.sendMessage({ type: "START_SESSION" });
  alert(`Session started:\n${id}`);
};

document.getElementById("end").onclick = async () => {
  await browser.runtime.sendMessage({ type: "END_SESSION" });
  alert("Session ended");
};

document.getElementById("open").onclick = () => {
  browser.tabs.create({
    url: browser.runtime.getURL("dist/viewer.html"),
  });
};
