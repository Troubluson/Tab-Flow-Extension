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
    .attr("x", -80)
    .attr("y", -30)
    .attr("width", 160)
    .attr("height", 60)
    .attr("rx", 8);

  node
    .append("image")
    .attr("href", (d) => d.favicon || "icons/globe.svg")
    .attr("x", -72)
    .attr("y", -22)
    .attr("width", 16)
    .attr("height", 16);

  node
    .append("text")
    .attr("x", -48)
    .attr("y", 0)
    .text((d) => d.title.slice(0, 40));
}

function buildGraph(events) {
  const nodes = buildNodes(events);
  const edges = buildEdges(events);

  const positioned = computeLayout(nodes, edges);

  const nodesById = Object.fromEntries(positioned.map((n) => [n.id, n]));

  drawEdges(edges, nodesById);
  drawNodes(positioned);
}

/* ------------------ main ------------------ */

async function main() {
  const events = await loadEvents();
  const graph = buildGraph(events);
  render(graph);
}

main();
