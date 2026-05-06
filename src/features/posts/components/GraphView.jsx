import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function GraphView({ posts, navigate }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!posts.length || !containerRef.current) return;

    const nodes = posts.map((post) => ({
      data: {
        id: post.slug,
        label: post.title,
        tagCount: post.tags?.length || 0
      }
    }));

    const edges = [];
    const edgeSet = new Set();

    for (let i = 0; i < posts.length; i++) {
      for (let j = i + 1; j < posts.length; j++) {
        const a = posts[i];
        const b = posts[j];
        const shared = a.tags.filter((tag) => b.tags.includes(tag));
        if (shared.length > 0) {
          const edgeId = a.slug < b.slug ? `${a.slug}--${b.slug}` : `${b.slug}--${a.slug}`;
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            edges.push({
              data: {
                id: edgeId,
                source: a.slug,
                target: b.slug,
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
            "background-color": "#000000",
            "border-width": 1,
            "border-color": "#000000",
            "width": 10,
            "height": 10,
            "label": "data(label)",
            "color": "#000000",
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
            "width": 1,
            "line-color": "#d0d0d0",
            "curve-style": "bezier",
            "opacity": 0.6
          }
        },
        {
          selector: "node.hover",
          style: {
            "background-color": "#000000",
            "width": 16,
            "height": 16,
            "border-width": 2,
            "z-index": 10
          }
        },
        {
          selector: "node.connected",
          style: {
            "background-color": "#000000",
            "width": 14,
            "height": 14
          }
        },
        {
          selector: "edge.connected",
          style: {
            "line-color": "#000000",
            "width": 1.5,
            "opacity": 1
          }
        },
        {
          selector: "node.dimmed",
          style: {
            "opacity": 0.15
          }
        },
        {
          selector: "edge.dimmed",
          style: {
            "opacity": 0.05
          }
        }
      ],
      layout: {
        name: "cose",
        padding: 40,
        componentSpacing: 120,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        animate: false,
        randomize: true,
        nodeRepulsion: 450000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1200,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1
      },
      minZoom: 0.3,
      maxZoom: 2.5,
      wheelSensitivity: 0.25
    });

    cy.on("tap", "node", (evt) => {
      navigate(`/posts/${evt.target.id()}`);
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

    cy.on("mouseout", "node", (evt) => {
      cy.elements().removeClass("hover connected dimmed");
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [posts, navigate]);

  if (!posts.length) {
    return (
      <div className="mt-8 flex h-[420px] items-center justify-center border border-black bg-white">
        <p className="text-sm text-neutral-600">No posts to graph.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 border border-black bg-white">
      <div className="flex items-center justify-between border-b border-black px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">
          Graph View
        </span>
        <span className="text-[11px] text-neutral-600">
          {posts.length} posts · drag to pan · scroll to zoom · click to open
        </span>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: "420px" }} />
    </div>
  );
}
