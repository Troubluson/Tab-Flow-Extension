import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { loadEvents } from "../utils";

cytoscape.use(dagre);

const WIDTH = 1800; // timeline width in px
const LEFT_PAD = 100;
const LANE_HEIGHT = 100;

/* ------------------ load data ------------------ */

/* ------------------ build graph ------------------ */
function buildElements(events) {
  const pages = events
    .filter((e) => e.type === "page")
    .sort((a, b) => a.timestamp - b.timestamp);

  if (!pages) return;

  const minT = pages[0].timestamp;
  const maxT = pages[pages.length - 1].timestamp;

  const laneByPage = new Map();
  let nextLane = 0;

  const nodes = new Map();
  const edges = [];

  console.log(minT, maxT, maxT - minT);
  for (const e of pages) {
    const timestampLabel = new Date(e.timestamp).toLocaleTimeString();

    // Lane assignment: same as parent if exists
    let lane =
      e.sourcePageId && laneByPage.has(e.sourcePageId)
        ? laneByPage.get(e.sourcePageId)
        : nextLane++;

    const tNorm = maxT === minT ? 0 : (e.timestamp - minT) / (maxT - minT);
    const x = LEFT_PAD + tNorm * WIDTH;

    console.log(x);
    console.log("timestamp", e.timestamp);
    const y = 100 + lane * LANE_HEIGHT;

    nodes.set(e.pageId, {
      data: {
        id: e.pageId,
        url: e.url,
        label: safeLabel(e.title || e.url),
        favicon: e.favicon || null,
        timestamp: e.timestamp,
        timestampLabel,
      },
      position: { x, y },
    });
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
  console.log(nodes, edges);
  return [...nodes.values(), ...edges];
}

function addTimeAxis(cy, elements) {
  const timestamps = elements
    .filter((ele) => ele.data?.timestamp)
    .map((ele) => ele.data.timestamp);

  if (!timestamps.length) return;

  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);

  const axisY = 30; // px from top
  const width = 1800;

  const TIME_TICKS = 5;
  const step = (maxT - minT) / TIME_TICKS;

  for (let i = 0; i <= TIME_TICKS; i++) {
    const t = minT + i * step;
    const x = (i / TIME_TICKS) * width + 100;

    // Tick node (invisible)
    cy.add({
      group: "nodes",
      data: { id: `tick_${i}`, label: new Date(t).toLocaleTimeString() },
      position: { x, y: axisY },
    });

    // Label styling
    cy.style()
      .selector(`#tick_${i}`)
      .style({
        "background-opacity": 0,
        label: (ele) => ele.data("label"),
        "font-size": 10,
        color: "#555",
        "text-valign": "top",
        "text-halign": "center",
      })
      .update();
  }
}

function safeLabel(text) {
  if (!text) return "";
  return text.length > 50 ? text.slice(0, 47) + "…" : text;
}

/* ------------------ render ------------------ */
function render(elements) {
  const cy = cytoscape({
    container: document.getElementById("cy"),
    elements,
    layout: {
      name: "dagre",
      rankDir: "LR", // Left → Right (horizontal timeline)
      animate: true,
    },
    style: [
      {
        selector: "node",
        style: {
          width: 44,
          height: 44,
          "background-color": "#4a90e2",
          "background-image": (ele) => ele.data("favicon") || "icons/globe.svg",
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
          "overlay-padding": 0,
          "text-wrap": "wrap",
          "text-max-width": 80,
          content: (ele) =>
            `${ele.data("label")}\n${ele.data("timestampLabel")}`,
        },
      },
      {
        selector: "edge",
        style: {
          width: 1.2,
          "line-color": "#999",
          "target-arrow-shape": "triangle",
          "target-arrow-color": "#999",
          "curve-style": "bezier",
        },
      },
    ],
  });

  cy.on("tap", "node", (evt) => {
    const url = evt.target.data("url");
    if (url) browser.tabs.create({ url });
  });

  cy.fit(undefined, 60);

  //addTimeAxis(cy, elements);
}

/* ------------------ main ------------------ */
async function main() {
  const events = await loadEvents();
  const elements = buildElements(events);
  render(elements);
}

main();
