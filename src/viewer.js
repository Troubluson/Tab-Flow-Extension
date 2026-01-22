import * as d3 from "d3";

// -----------------------------
// 1. Setup SVG
// -----------------------------
const width = 1200;
const height = 800;

const svg = d3.select("#graph").attr("width", width).attr("height", height);

// -----------------------------
// 2. Fetch events from background
// -----------------------------
async function fetchEvents() {
  try {
    const events = await browser.runtime.sendMessage({ type: "GET_EVENTS" });
    return events || [];
  } catch (e) {
    console.error("Failed to fetch events:", e);
    return [];
  }
}

// -----------------------------
// 3. Build nodes and links
// -----------------------------
function buildGraph(events) {
  const nodes = [];
  const links = [];
  const seen = new Set();

  for (const evt of events) {
    if (evt.type === "tab-created" && !seen.has(evt.tabId)) {
      seen.add(evt.tabId);

      nodes.push({
        id: evt.tabId,
        url: evt.url,
        t: evt.timestamp,
        opener: evt.openerTabId,
      });

      if (evt.openerTabId != null) {
        links.push({
          source: evt.openerTabId,
          target: evt.tabId,
        });
      }
    }
  }

  return { nodes, links };
}

// -----------------------------
// 4. Render the graph
// -----------------------------
function renderGraph(nodes, links) {
  svg.selectAll("*").remove();

  // Horizontal timeline scale
  const tExtent = d3.extent(nodes, (d) => d.t);
  const xScale = d3
    .scaleTime()
    .domain(tExtent)
    .range([50, width - 50]);

  // Assign vertical lanes
  const laneMap = new Map();
  let lane = 0;
  nodes.forEach((n) => {
    if (n.opener != null && laneMap.has(n.opener)) {
      n.lane = laneMap.get(n.opener) + 1;
    } else {
      n.lane = lane++;
    }
    laneMap.set(n.id, n.lane);
    n.x = xScale(n.t);
    n.y = 50 + n.lane * 60;
  });

  // Links
  svg
    .selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("x1", (d) => nodes.find((n) => n.id === d.source)?.x ?? 0)
    .attr("y1", (d) => nodes.find((n) => n.id === d.source)?.y ?? 0)
    .attr("x2", (d) => nodes.find((n) => n.id === d.target)?.x ?? 0)
    .attr("y2", (d) => nodes.find((n) => n.id === d.target)?.y ?? 0);

  // Nodes
  const node = svg
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  node.append("circle").attr("r", 8);
  node
    .append("text")
    .attr("x", 12)
    .attr("y", 4)
    .text((d) => (d.url ? new URL(d.url).hostname : "new tab"));
}

// -----------------------------
// 5. Main
// -----------------------------
async function main() {
  const events = await fetchEvents();
  const { nodes, links } = buildGraph(events);
  renderGraph(nodes, links);
}

main();
