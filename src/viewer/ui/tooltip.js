const tooltip = document.getElementById("tooltip");

export function showTooltip(node) {
  const pos = node.renderedPosition();

  tooltip.innerHTML = `
    <strong>${node.data("fullLabel")}</strong><br/>
    <small>${node.data("domain")}</small><br/>
    <small>${node.data("timestampLabel")}</small>
  `;

  tooltip.style.left = `${pos.x + 12}px`;
  tooltip.style.top = `${pos.y + 12}px`;
  tooltip.classList.remove("hidden");
}

export function hideTooltip() {
  tooltip.classList.add("hidden");
}
