import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchComplaints } from "@/lib/api";
import { Network } from "lucide-react";

const KnowledgeGraphPage = () => {
  const { data: complaints = [] } = useQuery({ queryKey: ["complaints"], queryFn: fetchComplaints });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const graphData = useMemo(() => {
    const nodes: { id: string; label: string; type: string; x: number; y: number; count?: number }[] = [];
    const edges: { from: string; to: string; weight: number }[] = [];
    const edgeMap = new Map<string, number>();

    nodes.push({ id: "center", label: "Complaints", type: "center", x: 400, y: 300, count: complaints.length });

    // Categories
    const categories = [...new Set(complaints.map(c => c.category).filter(Boolean))];
    categories.forEach((cat, i) => {
      const angle = (i / Math.max(categories.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const catCount = complaints.filter(c => c.category === cat).length;
      nodes.push({ id: `cat-${cat}`, label: cat!, type: "category", x: 400 + Math.cos(angle) * 160, y: 300 + Math.sin(angle) * 160, count: catCount });
      edgeMap.set(`center->cat-${cat}`, catCount);
    });

    // Products (distinct from categories)
    const products = [...new Set(complaints.map(c => c.product_type))];
    products.forEach((p, i) => {
      const angle = (i / Math.max(products.length, 1)) * Math.PI * 2 + 0.2;
      const pCount = complaints.filter(c => c.product_type === p).length;
      nodes.push({ id: `prod-${p}`, label: p, type: "product", x: 400 + Math.cos(angle) * 260, y: 300 + Math.sin(angle) * 240, count: pCount });
    });

    // Locations
    const locations = [...new Set(complaints.map(c => c.location))];
    locations.forEach((loc, i) => {
      const angle = (i / Math.max(locations.length, 1)) * Math.PI * 2 + 0.5;
      const lCount = complaints.filter(c => c.location === loc).length;
      nodes.push({ id: `loc-${loc}`, label: loc, type: "location", x: 400 + Math.cos(angle) * 340, y: 300 + Math.sin(angle) * 300, count: lCount });
    });

    // Channels as system nodes
    const channels = [...new Set(complaints.map(c => c.channel))];
    channels.forEach((ch, i) => {
      const angle = (i / Math.max(channels.length, 1)) * Math.PI * 2 + 1.0;
      const chCount = complaints.filter(c => c.channel === ch).length;
      nodes.push({ id: `sys-${ch}`, label: ch, type: "system", x: 400 + Math.cos(angle) * 350, y: 300 + Math.sin(angle) * 280, count: chCount });
    });

    // Build edges
    complaints.forEach(c => {
      if (c.category) {
        const key1 = `cat-${c.category}->prod-${c.product_type}`;
        edgeMap.set(key1, (edgeMap.get(key1) || 0) + 1);
        const key2 = `cat-${c.category}->loc-${c.location}`;
        edgeMap.set(key2, (edgeMap.get(key2) || 0) + 1);
        const key3 = `cat-${c.category}->sys-${c.channel}`;
        edgeMap.set(key3, (edgeMap.get(key3) || 0) + 1);
      }
    });

    edgeMap.forEach((weight, key) => {
      const [from, to] = key.split("->");
      if (from && to && nodes.find(n => n.id === from) && nodes.find(n => n.id === to)) {
        edges.push({ from, to, weight });
      }
    });

    return { nodes, edges };
  }, [complaints]);

  const typeColors: Record<string, string> = {
    center: "hsl(174, 72%, 46%)",
    category: "hsl(262, 72%, 58%)",
    product: "hsl(200, 72%, 52%)",
    location: "hsl(38, 92%, 50%)",
    system: "hsl(142, 71%, 45%)",
  };

  const getRadius = (node: typeof graphData.nodes[0]) => {
    if (node.type === "center") return 35;
    const count = node.count || 1;
    return Math.max(14, Math.min(28, 10 + count * 3));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Network className="w-6 h-6 text-primary" /> Knowledge Graph
        </h1>
        <p className="text-sm text-muted-foreground">Relationships between complaints, products, locations, channels, and categories</p>
      </div>

      {complaints.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">Submit complaints to see the knowledge graph.</div>
      ) : (
        <div className="glass-card p-4 overflow-hidden">
          <svg viewBox="0 0 800 600" className="w-full h-[550px]">
            <defs>
              {Object.entries(typeColors).map(([type, color]) => (
                <radialGradient key={type} id={`glow-${type}`}>
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Edges */}
            {graphData.edges.map((edge, i) => {
              const from = graphData.nodes.find(n => n.id === edge.from);
              const to = graphData.nodes.find(n => n.id === edge.to);
              if (!from || !to) return null;
              const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;
              return (
                <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={isHighlighted ? "hsl(174, 72%, 46%)" : "hsl(220, 14%, 22%)"}
                  strokeWidth={Math.max(1, Math.min(3, edge.weight * 0.5))}
                  opacity={isHighlighted ? 0.8 : 0.4}
                  style={{ transition: "all 0.2s" }}
                />
              );
            })}

            {/* Nodes */}
            {graphData.nodes.map(node => {
              const r = getRadius(node);
              const isHovered = hoveredNode === node.id;
              return (
                <g key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: "pointer" }}
                >
                  {isHovered && (
                    <circle cx={node.x} cy={node.y} r={r + 10} fill={`url(#glow-${node.type})`} />
                  )}
                  <circle cx={node.x} cy={node.y} r={r}
                    fill={typeColors[node.type]}
                    opacity={isHovered ? 1 : 0.75}
                    stroke={isHovered ? "white" : "none"} strokeWidth={1.5}
                    style={{ transition: "all 0.2s" }}
                  />
                  {node.count != null && node.count > 1 && (
                    <text x={node.x} y={node.y + 4} textAnchor="middle" fill="white" fontSize={r > 20 ? 11 : 9} fontWeight="bold">
                      {node.count}
                    </text>
                  )}
                  <text x={node.x} y={node.y + r + 14} textAnchor="middle" fill="hsl(215, 12%, 55%)" fontSize={10}>
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="flex justify-center gap-6 mt-4">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                {type}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraphPage;
