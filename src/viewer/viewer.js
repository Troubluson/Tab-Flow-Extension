import cytoscape from "cytoscape";
import { cy_styles } from "./ui/styles";
import { loadEvents, domainFromUrl } from "../utils";
import {
  computeLanes,
  computePositions,
  laneToY,
  normalizeLanes,
} from "./layout";
import { exportSession } from "./ui/session_management";
import { hideTooltip, showTooltip } from "./ui/tooltip";
import { closeInspector, openInspector } from "./ui/context_menu";

let cy;

/* ------------------ build graph ------------------ */
function buildElements(events) {
  const pages = events
    .filter((e) => e.type === "page")
    .sort((a, b) => a.timestamp - b.timestamp);

  if (!pages.length) return [];

  const nodes = new Map();
  const edges = [];
  const pauseMarkers = [];
  const xByPage = computePositions(pages);
  const laneByPage = normalizeLanes(computeLanes(pages));

  for (const e of pages) {
    const { x } = xByPage.get(e.pageId);
    const lane = laneByPage.get(e.pageId);
    const y = laneToY(lane);

    const timestampLabel = new Date(e.timestamp).toLocaleString("fi-FI");

    const domain = domainFromUrl(e.url);

    nodes.set(e.pageId, {
      data: {
        id: e.pageId,
        url: e.url,
        label: e.title?.slice(0, 25) || domain,
        fullLabel: e.title || e.url,
        favicon: e.favicon || "icons/globe.svg",
        timestamp: e.timestamp,
        timestampLabel,
        domain,
      },
      position: { x, y },
    });

    /* ---------- edge ---------- */
    if (e.sourcePageId) {
      edges.push({
        data: {
          id: `${e.sourcePageId}->${e.pageId}`,
          source: e.sourcePageId,
          target: e.pageId,
        },
      });
    }
  }

  return [...nodes.values(), ...edges, ...pauseMarkers];
}

/* ------------------ render ------------------ */
function renderGraph(elements) {
  cy = cytoscape({
    container: document.getElementById("cy"),
    elements,
    layout: { name: "preset" }, // use our positions
    style: cy_styles,
    autoungrabify: true,
    autolock: false,
    zoomingEnabled: true,
    userZoomingEnabled: true,
    panningEnabled: true,
    userPanningEnabled: true,
    boxSelectionEnabled: false,
    hideEdgesOnViewport: true,
  });

  // Removes toggle pan
  //cy.inertia(false);

  cy.on("cxttap", "node", (evt) => {
    openInspector(evt.target, cy);
  });

  cy.on("tap", (evt) => {
    if (evt.target === cy) {
      closeInspector();
    }
  });

  cy.on("mouseover", "node", (evt) => {
    const node = evt.target;
    showTooltip(node);
    const domain = node.data("domain");
    const url = node.data("url");

    // Fade everything
    cy.nodes().addClass("faded");

    // Highlight same domain
    cy.nodes()
      .filter((n) => n.data("domain") === domain)
      .removeClass("faded")
      .addClass("same-domain");

    // Highlight same URL (stronger)
    cy.nodes()
      .filter((n) => n.data("url") === url)
      .removeClass("faded")
      .removeClass("same-domain")
      .addClass("same-url");

    node.addClass("hovered");
  });

  cy.on("mouseout", "node", () => {
    hideTooltip();
    cy.nodes().removeClass("faded same-domain same-url hovered");
  });

  cy.on("zoom", () => {
    const z = cy.zoom();

    let level;
    if (z < 0.6) level = "overview";
    else if (z < 1.4) level = "normal";
    else level = "detail";

    cy.nodes().removeClass("overview normal detail").addClass(level);
    //addTimeAxis(cy, elements);
  });

  return cy;
}

/* ------------------ Zoom ------------------ */

/* ------------------ main ------------------ */
async function main() {
  const events = await loadEvents();
  const elements = buildElements(events);
  cy = renderGraph(elements);

  // Collect unique domains
  const domains = new Set(
    elements.filter((el) => el.data?.domain).map((el) => el.data.domain),
  );

  // Export button
  document
    .getElementById("export-btn")
    ?.addEventListener("click", exportSession);

  document
    .getElementById("import-session")
    .addEventListener("change", importSession);
}

main();
