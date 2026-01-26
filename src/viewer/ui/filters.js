export function applyFilters(cy, searchTerm, domainFilterSet) {
  cy.nodes().forEach((n) => {
    const label = n.data("label").toLowerCase();
    const domain = n.data("domain").toLowerCase();
    const matchSearch = !searchTerm || label.includes(searchTerm.toLowerCase());
    const matchDomain = !domainFilterSet.size || domainFilterSet.has(domain);
    n.style("display", matchSearch && matchDomain ? "element" : "none");
  });

  cy.edges().forEach((e) => {
    const sourceVisible = e.source().style("display") !== "none";
    const targetVisible = e.target().style("display") !== "none";
    e.style("display", sourceVisible && targetVisible ? "element" : "none");
  });
}
