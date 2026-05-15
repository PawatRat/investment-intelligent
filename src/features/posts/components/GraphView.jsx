import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function GraphView({ items, navigate }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!items.length || !containerRef.current) return;

    const nodes = items.map((item) => ({
      data: {
        id: item.path,
        label: item.title,
        tagCount: item.tags?.length || 0,
        type: item.type,
        kind: item.kind
      }
    }));

    const edges = [];
    const edgeSet = new Set();

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const shared = (a.tags || []).filter((tag) => (b.tags || []).includes(tag));
        if (shared.length > 0) {
          const edgeId = a.path < b.path ? `${a.path}--${b.path}` : `${b.path}--${a.path}`;
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            edges.push({
              data: {
                id: edgeId,
                source: a.path,
                target: b.path,
                weight: shared.length
              }
            });
          }
        }
      }
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#0f172a",
            "width": 10,
            "height": 10,
            "label": "data(label)",
            "color": "#475569",
            "font-size": "11px",
            "font-family": "system-ui, sans-serif",
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 6,
            "text-wrap": "wrap",
            "text-max-width": "120px",
            "text-events": "no",
            "transition-property": "width, height, background-color",
            "transition-duration": "0.15s"
          }
        },
        {
          selector: "edge",
          style: {
            "width": 1.5,
            "line-color": "#64748b",
            "curve-style": "bezier",
            "opacity": 0.8
          }
        },
        {
          selector: "node.hover",
          style: {
            "background-color": "#0f172a",
            "width": 16,
            "height": 16,
            "border-width": 2,
            "border-color": "#e2e8f0",
            "z-index": 10
          }
        },
        {
          selector: "node.connected",
          style: {
            "background-color": "#0f172a",
            "width": 14,
            "height": 14
          }
        },
        {
          selector: "edge.connected",
          style: {
            "line-color": "#0f172a",
            "width": 2.5,
            "opacity": 1
          }
        },
        {
          selector: "node.dimmed",
          style: {
            "opacity": 0.12
          }
        },
        {
          selector: "edge.dimmed",
          style: {
            "opacity": 0.04
          }
        }
      ],
      layout: {
        name: "cose",
        padding: 50,
        componentSpacing: 140,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        animate: false,
        randomize: true,
        nodeRepulsion: 500000,
        edgeElasticity: 200,
        nestingFactor: 5,
        gravity: 60,
        numIter: 1500,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1
      },
      minZoom: 0.3,
      maxZoom: 2.5,
      wheelSensitivity: 0.25
    });

    cy.on("tap", "node", (evt) => {
      const nodeId = evt.target.id();
      const item = items.find((i) => i.path === nodeId);
      if (!item) return;

      if (item.type === "post") {
        navigate(`/posts/${item.slug}`);
      } else if (item.type === "stock") {
        if (item.kind === "Thesis") {
          navigate(`/stocks/${item.ticker}`);
        } else {
          navigate(`/stocks/${item.ticker}/${item.slug}`);
        }
      }
    });

    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      const connected = node.closedNeighborhood();
      const others = cy.elements().difference(connected);

      node.addClass("hover");
      connected.nodes().addClass("connected");
      connected.edges().addClass("connected");
      others.addClass("dimmed");
    });

    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("hover connected dimmed");
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [items, navigate]);

  if (!items.length) {
    return (
      <div className="mt-8 flex h-[420px] items-center justify-center border border-neutral-200 bg-white">
        <p className="text-sm text-neutral-500">No content to graph.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5">
        <span className="text-[13px] font-medium uppercase tracking-wider text-neutral-500">
          Graph View
        </span>
        <span className="text-[11px] text-neutral-400">
          {items.length} items &middot; drag to pan &middot; scroll to zoom &middot; click to open
        </span>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: "440px" }} />
    </div>
  );
}
