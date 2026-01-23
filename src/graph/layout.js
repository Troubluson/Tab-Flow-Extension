import dagre from "dagre";

export function computeLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: "LR", // left → right time
    nodesep: 40,
    ranksep: 120,
  });

  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => {
    g.setNode(n.id, {
      width: 160,
      height: 60,
    });
  });

  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  return nodes.map((n) => {
    const p = g.node(n.id);
    return {
      ...n,
      x: p.x,
      y: p.y,
    };
  });
}
