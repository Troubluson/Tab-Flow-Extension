const NODE_SIZE = 25;

export const cy_styles = [
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
    selector: "node.overview",
    style: {
      label: "",
      width: 14,
      height: 14,
      opacity: 0.8,
    },
  },
  {
    selector: "node.normal",
    style: {
      label: "data(label)",
      width: 24,
      height: 24,
      opacity: 1,
    },
  },
  /* ---------- detail ---------- */
  {
    selector: "node.detail",
    style: {
      label: (ele) => `${ele.data("label")}\n${ele.data("timestampLabel")}`,
      width: 32,
      height: 32,
      "text-wrap": "wrap",
      "text-max-width": 140,
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
    selector: ".faded",
    style: {
      opacity: 0.15,
    },
  },
  {
    selector: ".same-domain",
    style: {
      "border-color": "#f5a623", // orange
      "border-width": 3,
      opacity: 1,
    },
  },
  {
    selector: ".same-url",
    style: {
      "border-color": "#e74c3c", // red
      "border-width": 4,
      opacity: 1,
    },
  },
  {
    selector: ".hovered",
    style: {
      "z-index": 999,
    },
  },
];
