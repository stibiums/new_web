"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";
import { Search, X, ExternalLink, LayoutGrid, Circle, Hash } from "lucide-react";
import type { NodeType, EdgeType, GraphNode, GraphEdge } from "@/app/api/graph/route";

// ────────────────────────────────────────────────────────────────────────────────
// 视觉配置
// ────────────────────────────────────────────────────────────────────────────────

const NODE_COLOR: Record<NodeType, string> = {
  NOTE: "#3b82f6",
  BLOG: "#10b981",
  PROJECT: "#8b5cf6",
  TAG: "#f59e0b",
};

const NODE_LABEL: Record<NodeType, string> = {
  NOTE: "笔记",
  BLOG: "文章",
  PROJECT: "项目",
  TAG: "标签",
};

const EDGE_COLOR: Record<EdgeType, string> = {
  EXPLICIT: "#94a3b8",
  FRONT_MATTER: "#c084fc",
  WIKI_LINK: "#fbbf24",
  TAG_COOCCURRENCE: "#f97316",
  CATEGORY: "#475569",
  TAG_NODE: "#f59e0b",
};

const EDGE_LABEL: Record<EdgeType, string> = {
  EXPLICIT: "手工链接",
  FRONT_MATTER: "声明链接",
  WIKI_LINK: "Wiki 链接",
  TAG_COOCCURRENCE: "共享标签",
  CATEGORY: "同分类",
  TAG_NODE: "标签关联",
};

const ALL_NODE_TYPES: NodeType[] = ["NOTE", "BLOG", "PROJECT", "TAG"];
const ALL_EDGE_TYPES: EdgeType[] = [
  "EXPLICIT",
  "FRONT_MATTER",
  "WIKI_LINK",
  "TAG_COOCCURRENCE",
  "CATEGORY",
  "TAG_NODE",
];

type ViewMode = "force" | "cluster" | "radial";

// ────────────────────────────────────────────────────────────────────────────────
// 组件
// ────────────────────────────────────────────────────────────────────────────────

interface KnowledgeGraphProps {
  locale: string;
}

export function KnowledgeGraph({ locale }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  const router = useRouter();

  // ── 数据 ──────────────────────────────────────────────────────────────────
  const [allNodes, setAllNodes] = useState<GraphNode[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  // ── 过滤 ──────────────────────────────────────────────────────────────────
  const [activeNodeTypes, setActiveNodeTypes] = useState<Set<NodeType>>(
    new Set(ALL_NODE_TYPES)
  );
  const [activeEdgeTypes, setActiveEdgeTypes] = useState<Set<EdgeType>>(
    new Set(ALL_EDGE_TYPES)
  );

  // ── 搜索 & 高亮 ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // ── 侧边面板 ────────────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // ── 视图模式 ────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("force");

  // ── 图例显示 ────────────────────────────────────────────────────────────
  const [showLegend, setShowLegend] = useState(true);

  // ────────────────────────────────────────────────────────────────────────
  // 数据加载
  // ────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetch("/api/graph")
      .then((r) => r.json())
      .then((data) => {
        if (data.nodes) setAllNodes(data.nodes);
        if (data.edges) setAllEdges(data.edges);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ────────────────────────────────────────────────────────────────────────
  // 渲染图谱（每次过滤/视图/数据变化时重建）
  // ────────────────────────────────────────────────────────────────────────
  const renderGraph = useCallback(() => {
    if (!containerRef.current || !svgRef.current || allNodes.length === 0) return;

    // 停止旧模拟
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // 过滤节点与边
    const nodeIdSet = new Set(
      allNodes
        .filter((n) => activeNodeTypes.has(n.nodeType))
        .map((n) => n.id)
    );
    const nodes: (GraphNode & { x?: number; y?: number; fx?: number | null; fy?: number | null })[] =
      allNodes
        .filter((n) => activeNodeTypes.has(n.nodeType))
        .map((n) => ({ ...n }));

    const edges = allEdges.filter(
      (e) =>
        activeEdgeTypes.has(e.type) &&
        nodeIdSet.has(e.source as string) &&
        nodeIdSet.has(e.target as string)
    );

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g");

    // 缩放
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 6])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);

    // 尺寸比例
    const maxLink = d3.max(nodes, (d) => d.linkCount) || 1;
    const sizeScale = d3.scaleSqrt().domain([0, maxLink]).range([5, 22]);

    // ── 力导向布局 ───────────────────────────────────────────────────────
    // 必须存为独立变量：forceLink 会把 source/target 字符串 ID 就地替换为节点对象引用
    // edgeGroups 需绑定到同一个数组，tick 时 d.source.x 才能取到坐标
    const simLinks = edges.map((e) => ({ ...e }));

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(simLinks)
          .id((d: any) => d.id)
          .distance((e: any) => {
            if (e.type === "CATEGORY") return 80;
            if (e.type === "TAG_NODE") return 70;
            if (e.type === "TAG_COOCCURRENCE") return 120;
            return 100;
          })
          .strength((e: any) => {
            if (e.type === "CATEGORY") return 0.4;
            if (e.type === "TAG_NODE") return 0.3;
            return 0.6;
          })
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<any>().radius((d) => sizeScale(d.linkCount) + 8));

    // Cluster 模式：按 nodeType 分区
    if (viewMode === "cluster") {
      const CLUSTER_POSITIONS: Record<NodeType, { x: number; y: number }> = {
        NOTE: { x: width * 0.25, y: height * 0.3 },
        BLOG: { x: width * 0.75, y: height * 0.3 },
        PROJECT: { x: width * 0.25, y: height * 0.7 },
        TAG: { x: width * 0.75, y: height * 0.7 },
      };
      simulation
        .force("x", d3.forceX<any>((d) => CLUSTER_POSITIONS[d.nodeType as NodeType]?.x ?? width / 2).strength(0.3))
        .force("y", d3.forceY<any>((d) => CLUSTER_POSITIONS[d.nodeType as NodeType]?.y ?? height / 2).strength(0.3));
    }

    // Radial 模式：已选节点为中心，其余按角度展开
    if (viewMode === "radial" && selectedNode) {
      const centerNode = nodes.find((n) => n.id === selectedNode.id);
      if (centerNode) {
        centerNode.fx = width / 2;
        centerNode.fy = height / 2;
        const neighborIds = new Set(
          edges
            .filter((e) => e.source === centerNode.id || e.target === centerNode.id)
            .flatMap((e) => [e.source as string, e.target as string])
        );
        const neighbors = nodes.filter((n) => n.id !== centerNode.id && neighborIds.has(n.id));
        neighbors.forEach((n, i) => {
          const angle = (i / neighbors.length) * 2 * Math.PI;
          n.fx = width / 2 + Math.cos(angle) * 180;
          n.fy = height / 2 + Math.sin(angle) * 180;
        });
      }
    }

    simulationRef.current = simulation;

    // ── 箭头标记（有类型的边）────────────────────────────────────────────
    const defs = svg.append("defs");
    const linkTypes: EdgeType[] = ["WIKI_LINK", "FRONT_MATTER", "EXPLICIT"];
    for (const et of linkTypes) {
      defs
        .append("marker")
        .attr("id", `arrow-${et}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", EDGE_COLOR[et])
        .attr("opacity", 0.7);
    }

    // ── 绘制边 ────────────────────────────────────────────────────────────
    const edgeGroups = g
      .append("g")
      .attr("class", "edges")
      .selectAll("line")
      .data(simLinks)
      .enter()
      .append("line")
      .attr("stroke", (e) => EDGE_COLOR[e.type])
      .attr("stroke-opacity", (e) => (e.type === "TAG_NODE" || e.type === "CATEGORY" ? 0.25 : 0.55))
      .attr("stroke-width", (e) => (e.type === "TAG_COOCCURRENCE" || e.type === "CATEGORY" ? 1 : 1.5))
      .attr("stroke-dasharray", (e) =>
        e.type === "TAG_NODE" ? "4 3" : e.type === "CATEGORY" ? "2 2" : null
      )
      .attr("marker-end", (e) =>
        linkTypes.includes(e.type) ? `url(#arrow-${e.type})` : null
      );

    // ── 节点组 ───────────────────────────────────────────────────────────
    const nodeGroups = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            if (viewMode !== "radial") {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // 节点圆圈
    nodeGroups
      .append("circle")
      .attr("r", (d) => sizeScale(d.linkCount))
      .attr("fill", (d) => NODE_COLOR[d.nodeType as NodeType] || "#94a3b8")
      .attr("stroke", "#fff")
      .attr("stroke-width", (d) => (selectedNode?.id === d.id ? 3 : 1.5))
      .attr("stroke-opacity", 0.8);

    // 节点标签
    nodeGroups
      .filter((d) => d.linkCount > 0 || d.nodeType === "TAG")
      .append("text")
      .text((d) => {
        const t = locale === "en" && d.titleEn ? d.titleEn : d.title;
        return t.length > 14 ? t.slice(0, 14) + "…" : t;
      })
      .attr("x", (d) => sizeScale(d.linkCount) + 4)
      .attr("y", 4)
      .attr("font-size", "11px")
      .attr("fill", "#94a3b8")
      .attr("font-family", "system-ui")
      .attr("pointer-events", "none");

    // 点击事件
    nodeGroups.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNode((prev) => (prev?.id === d.id ? null : d));
    });

    // 双击跳转
    nodeGroups.on("dblclick", (event, d) => {
      event.stopPropagation();
      if (d.nodeType === "TAG") return;
      const pathMap: Record<NodeType, string> = {
        NOTE: "notes",
        BLOG: "blog",
        PROJECT: "projects",
        TAG: "",
      };
      const path = pathMap[d.nodeType as NodeType];
      if (path) router.push(`/${locale}/${path}/${d.slug}`);
    });

    // 点击空白取消选中
    svg.on("click", () => setSelectedNode(null));

    // ── Tick ─────────────────────────────────────────────────────────────
    simulation.on("tick", () => {
      edgeGroups
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      nodeGroups.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
  }, [allNodes, allEdges, activeNodeTypes, activeEdgeTypes, viewMode, locale, router, selectedNode]);

  // 搜索高亮（覆盖在已渲染的 DOM 上，不触发重渲染）
  useEffect(() => {
    if (!svgRef.current) return;
    const q = searchQuery.toLowerCase();
    d3.select(svgRef.current)
      .selectAll<SVGGElement, GraphNode>(".nodes g")
      .attr("opacity", (d) => {
        if (!q) return 1;
        const t = d.title.toLowerCase();
        const te = (d.titleEn || "").toLowerCase();
        return t.includes(q) || te.includes(q) || d.slug.includes(q) ? 1 : 0.1;
      });
  }, [searchQuery]);

  // 重渲染触发
  useEffect(() => {
    if (!loading) renderGraph();
  }, [renderGraph, loading]);

  // ── 工具函数 ────────────────────────────────────────────────────────────

  const toggleNodeType = (type: NodeType) => {
    setActiveNodeTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const toggleEdgeType = (type: EdgeType) => {
    setActiveEdgeTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  // ── 侧边面板数据 ────────────────────────────────────────────────────────
  const selectedOutLinks = selectedNode
    ? allEdges.filter((e) => e.source === selectedNode.id && e.type !== "TAG_NODE")
    : [];
  const selectedInLinks = selectedNode
    ? allEdges.filter((e) => e.target === selectedNode.id && e.type !== "TAG_NODE")
    : [];
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  const navigateTo = (node: GraphNode) => {
    if (node.nodeType === "TAG") return;
    const pathMap: Record<NodeType, string> = { NOTE: "notes", BLOG: "blog", PROJECT: "projects", TAG: "" };
    const path = pathMap[node.nodeType];
    if (path) router.push(`/${locale}/${path}/${node.slug}`);
  };

  // ────────────────────────────────────────────────────────────────────────────
  // 渲染
  // ────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center text-muted-foreground text-sm">
        加载图谱数据中…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* ── 顶部控制栏 ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 text-sm">
        {/* 搜索 */}
        <div className="flex items-center gap-1.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-2.5 py-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            className="bg-transparent text-sm outline-none w-32 placeholder:text-muted-foreground"
            placeholder="搜索节点…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* 节点类型过滤 */}
        <div className="flex items-center gap-1">
          {ALL_NODE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleNodeType(t)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all
                ${activeNodeTypes.has(t) ? "border-transparent text-white" : "border-[var(--color-border)] text-muted-foreground opacity-50"}`}
              style={activeNodeTypes.has(t) ? { backgroundColor: NODE_COLOR[t] } : {}}
              title={`切换 ${NODE_LABEL[t]} 节点`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {NODE_LABEL[t]}
            </button>
          ))}
        </div>

        {/* 分隔线 */}
        <div className="h-4 w-px bg-border" />

        {/* 边类型过滤 */}
        <div className="flex items-center gap-1 flex-wrap">
          {ALL_EDGE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleEdgeType(t)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all
                ${activeEdgeTypes.has(t) ? "border-transparent text-white" : "border-[var(--color-border)] text-muted-foreground opacity-50"}`}
              style={activeEdgeTypes.has(t) ? { backgroundColor: EDGE_COLOR[t] } : {}}
              title={EDGE_LABEL[t]}
            >
              <span
                className="w-3 h-px inline-block bg-current"
                style={{ backgroundColor: activeEdgeTypes.has(t) ? "white" : EDGE_COLOR[t] }}
              />
              {EDGE_LABEL[t]}
            </button>
          ))}
        </div>

        {/* 分隔线 */}
        <div className="h-4 w-px bg-border" />

        {/* 视图模式 */}
        <div className="flex items-center gap-1">
          {(["force", "cluster", "radial"] as ViewMode[]).map((m) => {
            const labels: Record<ViewMode, string> = { force: "力导向", cluster: "分簇", radial: "环形" };
            const icons: Record<ViewMode, React.ReactNode> = {
              force: <Circle className="w-3 h-3" />,
              cluster: <LayoutGrid className="w-3 h-3" />,
              radial: <Hash className="w-3 h-3" />,
            };
            return (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all
                  ${viewMode === m
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-[var(--color-muted)]"
                  }`}
              >
                {icons[m]}
                {labels[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 主体区域（图 + 侧边面板）───────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* 图谱 */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ minHeight: 500 }}
        >
          <svg ref={svgRef} className="w-full h-full" />

          {/* 悬浮图例 */}
          {showLegend && (
            <div className="absolute top-3 left-3 bg-[var(--color-background)]/90 backdrop-blur-sm border border-[var(--color-border)] rounded-xl p-3 text-[11px] space-y-1.5 shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs">图例</span>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-muted-foreground hover:text-foreground ml-2"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {ALL_NODE_TYPES.filter((t) => activeNodeTypes.has(t)).map((t) => (
                <button
                  key={t}
                  className="flex items-center gap-1.5 w-full hover:opacity-70 transition-opacity"
                  onClick={() => toggleNodeType(t)}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: NODE_COLOR[t] }}
                  />
                  {NODE_LABEL[t]}
                </button>
              ))}
            </div>
          )}

          {/* 显示图例按钮（图例隐藏时） */}
          {!showLegend && (
            <button
              className="absolute top-3 left-3 bg-[var(--color-background)]/80 border border-[var(--color-border)] rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shadow"
              onClick={() => setShowLegend(true)}
            >
              图例
            </button>
          )}

          {/* 双击提示 */}
          <div className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/50 pointer-events-none">
            双击节点跳转页面 · 单击查看详情 · 滚轮缩放
          </div>
        </div>

        {/* 侧边面板 */}
        {selectedNode && (
          <div className="w-72 border-l border-[var(--color-border)] bg-[var(--color-background)] flex flex-col overflow-y-auto shrink-0">
            {/* 顶部 */}
            <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white shrink-0"
                    style={{ backgroundColor: NODE_COLOR[selectedNode.nodeType as NodeType] }}
                  >
                    {NODE_LABEL[selectedNode.nodeType as NodeType]}
                  </span>
                  {selectedNode.category && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {selectedNode.category}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-sm leading-tight">{selectedNode.title}</h3>
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                  {selectedNode.slug}
                </p>
              </div>
              <button
                className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedNode(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 摘要 */}
            {selectedNode.excerpt && (
              <div className="px-4 py-3 text-xs text-muted-foreground border-b border-[var(--color-border)]">
                {selectedNode.excerpt}
              </div>
            )}

            {/* 标签 */}
            {selectedNode.tags.length > 0 && (
              <div className="px-4 py-3 border-b border-[var(--color-border)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  标签
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-muted)] text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 外链 */}
            {selectedOutLinks.length > 0 && (
              <div className="px-4 py-3 border-b border-[var(--color-border)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  链出 ({selectedOutLinks.length})
                </p>
                <ul className="space-y-1">
                  {selectedOutLinks.map((e, i) => {
                    const target = nodeMap.get(e.target as string);
                    if (!target) return null;
                    return (
                      <li key={i} className="flex items-center gap-1.5 group">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: EDGE_COLOR[e.type] }}
                          title={EDGE_LABEL[e.type]}
                        />
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground truncate flex-1 text-left"
                          onClick={() => setSelectedNode(target)}
                        >
                          {target.title}
                        </button>
                        {target.nodeType !== "TAG" && (
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => navigateTo(target)}
                          >
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* 反链 */}
            {selectedInLinks.length > 0 && (
              <div className="px-4 py-3 border-b border-[var(--color-border)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  反链 ({selectedInLinks.length})
                </p>
                <ul className="space-y-1">
                  {selectedInLinks.map((e, i) => {
                    const source = nodeMap.get(e.source as string);
                    if (!source) return null;
                    return (
                      <li key={i} className="flex items-center gap-1.5 group">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: EDGE_COLOR[e.type] }}
                          title={EDGE_LABEL[e.type]}
                        />
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground truncate flex-1 text-left"
                          onClick={() => setSelectedNode(source)}
                        >
                          {source.title}
                        </button>
                        {source.nodeType !== "TAG" && (
                          <button
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => navigateTo(source)}
                          >
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* 跳转按钮 */}
            {selectedNode.nodeType !== "TAG" && (
              <div className="px-4 py-3">
                <button
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-muted)] hover:bg-[var(--color-muted)]/70 transition-colors"
                  onClick={() => navigateTo(selectedNode)}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  打开页面
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
