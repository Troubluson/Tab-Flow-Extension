import * as d3 from "d3";
import { computeLayout } from "./layout";

/* ------------------ constants ------------------ */

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;

/* ------------------ SVG setup ------------------ */

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

const svg = d3
  .select("#graph")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

const g = svg.append("g");

svg.call(
  d3.zoom().on("zoom", (e) => {
    g.attr("transform", e.transform);
  })
);

/* ------------------ load data ------------------ */

async function loadEvents() {
  return browser.runtime.sendMessage({ type: "GET_EVENTS" });
}

/* ------------------ draw ------------------ */

function drawEdges(edges, nodesById) {
  g.selectAll(".link")
    .data(edges)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("x1", (d) => nodesById[d.source].x)
    .attr("y1", (d) => nodesById[d.source].y)
    .attr("x2", (d) => nodesById[d.target].x)
    .attr("y2", (d) => nodesById[d.target].y);
}

function drawNodes(nodes) {
  const node = g
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .on("click", (_, d) => {
      browser.tabs.update(Number(d.id), { active: true });
    });

  node
    .append("rect")
    .attr("x", -NODE_WIDTH / 2)
    .attr("y", -NODE_HEIGHT / 2)
    .attr("width", NODE_WIDTH)
    .attr("height", NODE_HEIGHT)
    .attr("rx", 8);

  node
    .append("image")
    .attr("href", (d) => d.favicon || "icons/globe.svg")
    .attr("x", -NODE_WIDTH / 2 + 6)
    .attr("y", -NODE_HEIGHT / 2 + 6)
    .attr("width", 16)
    .attr("height", 16);

  node
    .append("text")
    .attr("x", -NODE_WIDTH / 2 + 28)
    .attr("y", 4)
    .text((d) => d.title.slice(0, 40));
}

/* ------------------ graph building ------------------ */

function buildNodes(events) {
  const map = new Map();

  for (const e of events) {
    if (!map.has(e.tabId)) {
      map.set(e.tabId, {
        id: String(e.tabId),
        title: e.title || e.url,
        url: e.url,
        favicon: e.favicon,
        timestamp: e.timestamp
      });
    }
  }

  return Array.from(map.values());
}

function buildEdges(events) {
  const edges = [];

  for (const e of events) {
    if (e.openerTabId) {
      edges.push({
        source: String(e.openerTabId),
        target: String(e.tabId)
      });
    }
  }

  return edges;
}

function buildGraph(events) {
  const nodes = buildNodes(events);
  const edges = buildEdges(events);
  console.log("nodes", nodes)
  console.log("edges", edges)
  const positioned = computeLayout(nodes, edges);
  const nodesById = Object.fromEntries(positioned.map((n) => [n.id, n]));

  drawEdges(edges, nodesById);
  drawNodes(positioned);
}

/* ------------------ main ------------------ */

async function main() {
  const events = await loadEvents();
  console.log(events)
  buildGraph(events);
}

main();
