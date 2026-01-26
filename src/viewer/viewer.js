import cytoscape from "cytoscape";
import Choices from "choices";
import tippy from "tippy.js"; // Tooltip library
import "tippy.js/dist/tippy.css";
import { loadEvents, domainFromUrl } from "../utils";
import {
  computeLanes,
  computePositions,
  laneToY,
  normalizeLanes,
} from "./layout";
import { applyFilters } from "./ui/filters";
import { exportSession } from "./ui/export";
import { hideTooltip, showTooltip } from "./ui/tooltip";

let cy;
const NODE_SIZE = 25;

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

    const timestampLabel = new Date(e.timestamp).toLocaleTimeString();

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
    style: [
      {
        selector: "node",
        style: {
          width: NODE_SIZE,
          height: NODE_SIZE,
          "background-color": "#4a90e2",
          "background-image": "data(favicon)",
          "background-fit": "cover",
          "border-width": 1,
          "border-color": "#2c3e50",
          label: "data(label)",
          "font-size": 8,
          "text-valign": "bottom",
          "text-margin-y": 6,
          color: "#222",
        },
      },
      {
        selector: "node[?timestampLabel]",
        style: {
          "text-wrap": "wrap",
          "text-max-width": 120,
          content: (ele) =>
            `${ele.data("label")}\n${ele.data("timestampLabel")}`,
        },
      },
      {
        selector: "edge",
        style: {
          width: 1,
          "line-color": "#999",
          "target-arrow-shape": "triangle",
          "target-arrow-color": "#999",
          "curve-style": "straight",
        },
      },
      {
        selector: ".highlight",
        style: {
          "border-color": "#ff6b6b",
          "border-width": 2,
          "line-color": "#ff6b6b",
          "target-arrow-color": "#ff6b6b",
        },
      },
    ],
    autoungrabify: false,
    autolock: false,
    zoomingEnabled: true,
    userZoomingEnabled: true,
    panningEnabled: true,
    userPanningEnabled: true,
  });

  cy.on("tap", "node", (evt) => {
    const url = evt.target.data("url");
    if (url) {
      browser.tabs.create({ url });
    }
  });

  cy.on("mouseover", "node", (evt) => {
    showTooltip(evt.target);
  });

  cy.on("mouseout", "node", hideTooltip);

  // hide during movement (performance)
  cy.on("pan zoom", hideTooltip);

  cy.on("mouseover", "node", (evt) => {
    const n = evt.target;
    n.connectedEdges().addClass("highlight");
    n.predecessors().addClass("highlight");
  });

  cy.on("mouseout", "node", () => {
    cy.elements().removeClass("highlight");
  });

  cy.on("zoom", () => {
    if (cy.zoom() > 1.4) {
      cy.nodes().style("label", "data(label)");
    } else {
      cy.nodes().style("label", "");
    }
  });

  return cy;
  //addTimeAxis(cy, elements);
}

/* ------------------ Zoom ------------------ */

/* ------------------ main ------------------ */
async function main() {
  const events = await loadEvents();
  const elements = buildElements(events);
  cy = renderGraph(elements);

  const domainCheckboxes = document.querySelectorAll(".domain-filter");
  function updateFilters() {
    const term = searchInput.value;
    const domains = new Set(
      [...domainCheckboxes].filter((cb) => cb.checked).map((cb) => cb.value),
    );
    applyFilters(cy, term, domains);
  }

  // Collect unique domains
  const domains = new Set(
    elements.filter((el) => el.data?.domain).map((el) => el.data.domain),
  );

  // Populate dropdown
  const select = document.getElementById("domain-select");
  domains.forEach((d) => {
    const option = document.createElement("option");
    option.value = d;
    option.textContent = d;
    select.appendChild(option);
  });

  // Initialize Choices.js
  const choices = new Choices(select, {
    removeItemButton: true,
    searchEnabled: true,
    placeholderValue: "Filter by domain...",
  });

  // Search input
  const searchInput = document.getElementById("search");

  function updateFilters() {
    const term = searchInput.value;
    const selectedDomains = new Set(choices.getValue(true)); // array of selected domains
    applyFilters(cy, term, selectedDomains);
  }

  searchInput?.addEventListener("input", updateFilters);
  domainCheckboxes.forEach((cb) =>
    cb.addEventListener("change", updateFilters),
  );

  // Export button
  document
    .getElementById("export-btn")
    ?.addEventListener("click", exportSession);
}

main();
