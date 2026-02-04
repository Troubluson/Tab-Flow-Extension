const collapsedNodes = new Set(); // pageId

const MENU_OFFSET = 10; //px

const inspector = document.getElementById("inspector");
function getDescendants(node) {
  return node.successors().filter((ele) => ele.isNode());
}

function collapseNode(node) {
  const descendants = getDescendants(node);
  descendants.style("display", "none");
  node.addClass("collapsed");
  collapsedNodes.add(node.id());
}

function expandNode(node) {
  const descendants = getDescendants(node);
  descendants.style("display", "element");
  node.removeClass("collapsed");
  collapsedNodes.delete(node.id());
}

//dosn't work
function removeBranch(node, cy) {
  const descendants = getDescendants(node);
  cy.remove(descendants);
  cy.remove(node);
}

export function openInspector(node, cy) {
  inspector.classList.add("visible");

  document.getElementById("inspector-title").textContent =
    node.data("fullLabel") || "Page";

  document.getElementById("inspector-url").textContent = node.data("url");
  document.getElementById("inspector-url").href = node.data("url");

  document.getElementById("inspector-domain").textContent = node.data("domain");

  document.getElementById("inspector-time").textContent =
    node.data("timestampLabel");

  document.getElementById("btn-open").onclick = () =>
    browser.tabs.create({ url: node.data("url") });

  document.getElementById("btn-collapse").onclick = () =>
    collapsedNodes.has(node.id()) ? expandNode(node) : collapseNode(node);

  document.getElementById("btn-delete").onclick = () => removeBranch(node, cy);
}

export const closeInspector = () => inspector.classList.remove("visible");

document
  .getElementById("inspector-close")
  .addEventListener("click", closeInspector);
