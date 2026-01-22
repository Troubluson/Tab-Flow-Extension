import * as d3 from "d3";

/* ------------------ constants ------------------ */

const NODE_WIDTH = 100;
const NODE_HEIGHT = 60;
const LANE_HEIGHT = 100;
const MARGIN = { top: 40, left: 40, right: 40, bottom: 40 };

/* ------------------ load data ------------------ */

async function loadEvents() {
  return browser.runtime.sendMessage({ type: "GET_EVENTS" });
}

/* ------------------ layout ------------------ */

function buildGraph(events) {
  // Sort by time
  events.sort((a, b) => a.timestamp - b.timestamp);

  // Nodes
  const nodes = events.map(e => ({
    id: e.tabId,
    opener: e.openerTabId,
    url: e.url,
    t: e.timestamp,
    thumbnail: e.thumbnail
  }));

  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // Edges
  const links = nodes
    .filter(n => n.opener && nodeById.has(n.opener))
    .map(n => ({
      source: n.opener,
      target: n.id
    }));

  // Lane assignment
  let laneCounter = 0;

  function assignLane(node) {
    if (node.lane !== undefined) return node.lane;

    if (node.opener && nodeById.has(node.opener)) {
      node.lane = assignLane(nodeById.get(node.opener));
    } else {
      node.lane = laneCounter++;
    }
    return node.lane;
  }

  nodes.forEach(assignLane);

  return { nodes, links };
}

/* ------------------ render ------------------ */

function render({ nodes, links }) {
  const svg = d3.select("#graph");
  const viewport = d3.select("#viewport");

  const width = window.innerWidth;
  const height = window.innerHeight;

  svg.attr("width", width).attr("height", height);

  // Time scale
  const xScale = d3.scaleTime()
    .domain(d3.extent(nodes, d => d.t))
    .range([MARGIN.left, width - MARGIN.right]);

  // Y scale
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(nodes, d => d.lane)])
    .range([MARGIN.top, height - MARGIN.bottom]);

  // Compute node positions
  nodes.forEach(n => {
    n.x = xScale(n.t);
    n.y = yScale(n.lane);
  });

  const nodeById = new Map(nodes.map(n => [n.id, n]));

  /* ---- links ---- */

  const linkGen = d3.linkHorizontal()
    .x(d => d.x)
    .y(d => d.y);

  d3.select(".links")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("class", "link")
    .attr("d", d => {
      const s = nodeById.get(d.source);
      const t = nodeById.get(d.target);
      return linkGen({ source: s, target: t });
    });

  /* ---- nodes ---- */

  const nodeSel = d3.select(".nodes")
    .selectAll("g.node")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x}, ${d.y})`)
    .style("cursor", "pointer");

  nodeSel.append("rect")
    .attr("x", -NODE_WIDTH / 2)
    .attr("y", -NODE_HEIGHT / 2)
    .attr("width", NODE_WIDTH)
    .attr("height", NODE_HEIGHT);

  nodeSel.append("image")
    .attr("href", d => d.favicon || "icons/icon-32.png")
    .attr("width", 16)
    .attr("height", 16)
    .attr("x", -NODE_WIDTH / 2 + 6)
    .attr("y", -NODE_HEIGHT / 2 + 6);

  nodeSel.append("text")
    .attr("y", NODE_HEIGHT / 2 - 6)
    .attr("text-anchor", "middle")
    .text(d => {
      try {
        return new URL(d.url).hostname;
      } catch {
        return "";
      }
    });

  /* ---- interaction ---- */

  nodeSel.on("click", (_, d) => {
    browser.tabs.update(d.id, { active: true });
  });

  /* ---- zoom ---- */

  svg.call(
    d3.zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", e => {
        viewport.attr("transform", e.transform);
      })
  );
}

/* ------------------ main ------------------ */

async function main() {
  const events = await loadEvents();
  const graph = buildGraph(events);
  render(graph);
}

main();
