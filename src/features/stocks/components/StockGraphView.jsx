import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";

export default function StockGraphView({ stocks, navigate }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!stocks.length || !containerRef.current) return;

    const elements = [];
    const edgeSet = new Set();

    // Stock nodes (thesis files)
    stocks.forEach((stock) => {
      elements.push({
        data: {
          id: stock.ticker,
          label: stock.ticker,
          labelCount: stock.labels?.length || 0,
          type: "stock",
          status: stock.status || "",
          conviction: stock.conviction || ""
        }
      });
    });

    // Timeline note nodes
    stocks.forEach((stock) => {
      (stock.timeline || []).forEach((note) => {
        const noteId = `${stock.ticker}--${note.slug}`;
        elements.push({
          data: {
            id: noteId,
            label: note.title || note.slug,
            type: "note",
            noteType: note.type || "",
            date: note.date || "",
            parentTicker: stock.ticker,
            slug: note.slug
          }
        });

        // Edge: note → parent stock
        const edgeId = `note--${noteId}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          elements.push({
            data: {
              id: edgeId,
              source: noteId,
              target: stock.ticker,
              weight: 1,
              edgeType: "parent"
            }
          });
        }
      });
    });

    // Edges: stock ↔ stock via shared labels
    for (let i = 0; i < stocks.length; i++) {
      for (let j = i + 1; j < stocks.length; j++) {
        const a = stocks[i];
        const b = stocks[j];
        const shared = (a.labels || []).filter((label) => (b.labels || []).includes(label));
        if (shared.length > 0) {
          const edgeId = a.ticker < b.ticker ? `${a.ticker}--${b.ticker}` : `${b.ticker}--${a.ticker}`;
          if (!edgeSet.has(edgeId)) {
            edgeSet.add(edgeId);
            elements.push({
              data: {
                id: edgeId,
                source: a.ticker,
                target: b.ticker,
                weight: shared.length,
                edgeType: "shared-label"
              }
            });
          }
        }
      }
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node[type='stock']",
          style: {
            "background-color": "#0f172a",
            "width": 12,
            "height": 12,
            "label": "data(label)",
            "color": "#334155",
            "font-size": "12px",
            "font-family": "system-ui, sans-serif",
            "font-weight": "600",
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 8,
            "text-wrap": "wrap",
            "text-max-width": "100px",
            "text-events": "no",
            "transition-property": "width, height, background-color",
            "transition-duration": "0.15s"
          }
        },
        {
          selector: "node[type='note']",
          style: {
            "background-color": "#94a3b8",
            "width": 6,
            "height": 6,
            "label": "data(label)",
            "color": "#64748b",
            "font-size": "9px",
            "font-family": "system-ui, sans-serif",
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 5,
            "text-wrap": "wrap",
            "text-max-width": "80px",
            "text-events": "no",
            "transition-property": "width, height, background-color",
            "transition-duration": "0.15s"
          }
        },
        {
          selector: "edge[edgeType='shared-label']",
          style: {
            "width": 1,
            "line-color": "#d4d4d4",
            "curve-style": "bezier",
            "opacity": 0.7
          }
        },
        {
          selector: "edge[edgeType='parent']",
          style: {
            "width": 0.5,
            "line-color": "#cbd5e1",
            "curve-style": "bezier",
            "opacity": 0.4,
            "line-style": "dashed"
          }
        },
        {
          selector: "node.hover",
          style: {
            "background-color": "#0f172a",
            "width": 18,
            "height": 18,
            "border-width": 2,
            "border-color": "#e2e8f0",
            "z-index": 10
          }
        },
        {
          selector: "node[type='note'].hover",
          style: {
            "background-color": "#64748b",
            "width": 10,
            "height": 10,
            "border-width": 1.5,
            "border-color": "#94a3b8",
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
          selector: "node[type='note'].connected",
          style: {
            "background-color": "#64748b",
            "width": 8,
            "height": 8
          }
        },
        {
          selector: "edge.connected",
          style: {
            "line-color": "#334155",
            "width": 1.5,
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
        padding: 60,
        componentSpacing: 120,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        animate: false,
        randomize: true,
        nodeRepulsion: 800000,
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
      const node = evt.target;
      const type = node.data("type");
      if (type === "stock") {
        navigate(`/stocks/${node.id()}`);
      } else if (type === "note") {
        const ticker = node.data("parentTicker");
        const slug = node.data("slug");
        navigate(`/stocks/${ticker}/${slug}`);
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
  }, [stocks, navigate]);

  const totalNodes = stocks.reduce((sum, stock) => sum + 1 + (stock.timeline?.length || 0), 0);

  if (!stocks.length) {
    return (
      <div className="mt-8 flex h-[420px] items-center justify-center border border-slate-200 bg-white">
        <p className="text-sm text-slate-500">No stocks to graph.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 border border-slate-200 border-t-2 border-t-black bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <span className="text-[13px] font-medium uppercase tracking-wider text-slate-500">
          File Graph
        </span>
        <span className="text-[11px] text-slate-400">
          {stocks.length} stocks + {totalNodes - stocks.length} notes &middot; click to open &middot; hover to see relationships
        </span>
      </div>
      <div ref={containerRef} style={{ width: "100%", height: "480px" }} />
    </div>
  );
}
