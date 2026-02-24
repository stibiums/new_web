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
  CATEGORY: "#ef4444",
};

const NODE_LABEL: Record<NodeType, string> = {
  NOTE: "笔记",
  BLOG: "文章",
  PROJECT: "项目",
  TAG: "标签",
  CATEGORY: "分类",
};

const EDGE_COLOR: Record<EdgeType, string> = {
  EXPLICIT: "#94a3b8",
  WIKI_LINK: "#fbbf24",
  TAG_NODE: "#f59e0b",
  CATEGORY_NODE: "#ef4444",
};

const EDGE_LABEL: Record<EdgeType, string> = {
  EXPLICIT: "关联链接",
  WIKI_LINK: "Wiki 链接",
  TAG_NODE: "标签关联",
  CATEGORY_NODE: "分类归属",
};

const ALL_NODE_TYPES: NodeType[] = ["NOTE", "BLOG", "PROJECT", "TAG", "CATEGORY"];
const ALL_EDGE_TYPES: EdgeType[] = [
  "EXPLICIT",
  "WIKI_LINK",
  "TAG_NODE",
  "CATEGORY_NODE",
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
  const selectedNodeRef = useRef<GraphNode | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
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

  // 禁止宿主页面滚动
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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

    const g = svg.append("g");

    // 缩放
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 6])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom as any);
    zoomRef.current = zoom;

    // 尺寸比例：设置 domain 下限为 8，避免稀疏图中单个连接就跳到最大值
    const maxLink = Math.max(d3.max(nodes, (d) => d.linkCount) || 0, 8);
    const sizeScale = d3.scaleSqrt().domain([0, maxLink]).range([6, 20]);

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
            if (e.type === "TAG_NODE") return 70;
            if (e.type === "CATEGORY_NODE") return 70;
            return 100;
          })
          .strength((e: any) => {
            if (e.type === "TAG_NODE") return 0.3;
            if (e.type === "CATEGORY_NODE") return 0.3;
            return 0.6;
          })
      )
      .force("charge", d3.forceManyBody().strength(-350).distanceMax(400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<any>().radius((d) => sizeScale(d.linkCount) + 18).strength(0.9));

    // Cluster 模式：按 nodeType 分区
    if (viewMode === "cluster") {
      const CLUSTER_POSITIONS: Record<NodeType, { x: number; y: number }> = {
        NOTE: { x: width * 0.2, y: height * 0.3 },
        BLOG: { x: width * 0.8, y: height * 0.3 },
        PROJECT: { x: width * 0.2, y: height * 0.7 },
        TAG: { x: width * 0.65, y: height * 0.7 },
        CATEGORY: { x: width * 0.8, y: height * 0.7 },
      };
      simulation
        .force("x", d3.forceX<any>((d) => CLUSTER_POSITIONS[d.nodeType as NodeType]?.x ?? width / 2).strength(0.3))
        .force("y", d3.forceY<any>((d) => CLUSTER_POSITIONS[d.nodeType as NodeType]?.y ?? height / 2).strength(0.3));
    }

    // Radial 模式：已选节点为中心，其余按角度展开
    if (viewMode === "radial" && selectedNodeRef.current) {
      const centerNode = nodes.find((n) => n.id === selectedNodeRef.current!.id);
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
    const linkTypes: EdgeType[] = ["WIKI_LINK", "EXPLICIT"];
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
      .attr("stroke-opacity", (e) => (e.type === "TAG_NODE" || e.type === "CATEGORY_NODE" ? 0.45 : 0.75))
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", (e) =>
        e.type === "TAG_NODE" || e.type === "CATEGORY_NODE" ? "4 3" : null
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
      .attr("stroke-width", (d) => (selectedNodeRef.current?.id === d.id ? 3 : 1.5))
      .attr("stroke-opacity", 0.8);

    // 节点标签（所有节点均显示）
    nodeGroups
      .append("text")
      .text((d) => {
        const t = locale === "en" && d.titleEn ? d.titleEn : d.title;
        return t.length > 10 ? t.slice(0, 10) + "…" : t;
      })
      .attr("x", 0)
      .attr("y", (d) => sizeScale(d.linkCount) + 13)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#94a3b8")
      .attr("font-family", "system-ui")
      .attr("pointer-events", "none");

    // 点击事件：将节点固定到画布中心（考虑侧边面板偏移）并触发全局重排动画
    nodeGroups.on("click", (event, d) => {
      event.stopPropagation();
      // 判断点击后面板是打开还是关闭
      const panelWillOpen = selectedNodeRef.current?.id !== (d as any).id;
      setSelectedNode((prev) => (prev?.id === d.id ? null : d));

      const sim = simulationRef.current;
      const containerEl = containerRef.current;
      if (!sim || !containerEl || !svgRef.current || !zoomRef.current) return;

      const w = containerEl.clientWidth;
      const h = containerEl.clientHeight;
      // 侧边面板宽度 w-72 = 288px，打开时画布可用区域向左移
      const PANEL_W = panelWillOpen ? 288 : 0;
      const cx = (w - PANEL_W) / 2;
      const cy = h / 2;
      const currentK = d3.zoomTransform(svgRef.current).k;

      // 1. 释放所有节点的旧固定位置
      const simNodes = sim.nodes() as any[];
      simNodes.forEach((n: any) => { n.fx = null; n.fy = null; });

      // 如果是反选（取消选中），恢复 forceCenter 到画布中心并轻重排
      if (!panelWillOpen) {
        sim.force("center", d3.forceCenter(w / 2, h / 2));
        sim.alpha(0.3).alphaDecay(0.03).restart();
        return;
      }

      // 2. 把点击节点固定到可用区域中心
      const clickedNode = simNodes.find((n: any) => n.id === (d as any).id);
      if (!clickedNode) return;
      clickedNode.fx = cx;
      clickedNode.fy = cy;

      // 3. BFS 分层，构建邻接表（无向）
      const linkForce = sim.force("link") as d3.ForceLink<any, any>;
      const simLinks = linkForce ? linkForce.links() : [];
      const adjacency = new Map<string, Set<string>>();
      simLinks.forEach((e: any) => {
        const s = e.source.id; const t = e.target.id;
        if (!adjacency.has(s)) adjacency.set(s, new Set());
        if (!adjacency.has(t)) adjacency.set(t, new Set());
        adjacency.get(s)!.add(t); adjacency.get(t)!.add(s);
      });

      // BFS：计算每个节点的层级 + 记录父节点
      const levels = new Map<string, number>([[( d as any).id, 0]]);
      const parentOf = new Map<string, string>();
      const bfsQ: string[] = [(d as any).id];
      while (bfsQ.length) {
        const cur = bfsQ.shift()!;
        adjacency.get(cur)?.forEach(nb => {
          if (!levels.has(nb)) {
            levels.set(nb, levels.get(cur)! + 1);
            parentOf.set(nb, cur);
            bfsQ.push(nb);
          }
        });
      }

      // 4. BFS 分层径向布局（减少交叉）
      // 原理：每层按父节点的角度排序，子节点分配到父节点角度附近的扇区内
      const RADII = [0, 165, 310, 440, 560];   // 各层半径，0=中心
      const angleOf = new Map<string, number>([[(d as any).id, -Math.PI / 2]]);

      // 按层分组
      const byLevel = new Map<number, string[]>();
      levels.forEach((lv, id) => {
        if (lv === 0) return;
        if (!byLevel.has(lv)) byLevel.set(lv, []);
        byLevel.get(lv)!.push(id);
      });

      // 逐层按父节点角度排序后均匀分配角度
      byLevel.forEach((ids, lv) => {
        const r = RADII[Math.min(lv, RADII.length - 1)];
        // 按父节点已分配角度升序排序，使同父节点的子节点聚在一起
        ids.sort((a, b) => {
          const pa = parentOf.get(a); const pb = parentOf.get(b);
          const aa = angleOf.get(pa ?? "") ?? 0;
          const ab = angleOf.get(pb ?? "") ?? 0;
          return aa - ab;
        });
        ids.forEach((id, i) => {
          const angle = ((i / Math.max(ids.length, 1)) * 2 * Math.PI) - Math.PI / 2;
          angleOf.set(id, angle);
          const node = simNodes.find((n: any) => n.id === id);
          if (node) {
            node.x = cx + Math.cos(angle) * r;
            node.y = cy + Math.sin(angle) * r;
            node.vx = 0; node.vy = 0;
          }
        });
      });

      // 不在连通分量内的节点拨散到外围，避免与主图重叠
      simNodes.forEach((n: any) => {
        if (!levels.has(n.id)) {
          // 已有位置，只是推远一点
          const dx = (n.x || 0) - cx;
          const dy = (n.y || 0) - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetR = 600;
          if (dist < targetR) {
            n.x = cx + (dx / dist) * targetR;
            n.y = cy + (dy / dist) * targetR;
            n.vx = 0; n.vy = 0;
          }
        }
      });

      // 连通分量 ID 集合（供视觉效果 effect 使用，通过重新触发 selectedNode 已足够）
      // （此处不需要额外暴露，effect 会在 selectedNode 变化后自行计算）

      // 5. 更新 forceCenter 到新中心，避免与 fx/fy 冲突
      sim.force("center", d3.forceCenter(cx, cy));

      // 6. 平滑移动视图，将 (cx, cy) 对齐屏幕可用区域中心
      //    变换公式: screenX = nodeX * k + tx  →  tx = screenCx - cx*k
      const screenCx = (w - PANEL_W) / 2;
      const screenCy = h / 2;
      const newTransform = d3.zoomIdentity
        .translate(screenCx - cx * currentK, screenCy - cy * currentK)
        .scale(currentK);
      d3.select(svgRef.current)
        .transition().duration(700).ease(d3.easeCubicInOut)
        .call(zoomRef.current.transform as any, newTransform);

      // 7. 重启模拟，带动画均匀分布
      sim.alpha(0.65).alphaDecay(0.018).restart();

      // 7. 稳定后释放固定
      const releaseTimer = setTimeout(() => {
        const currentSim = simulationRef.current;
        if (currentSim) {
          const target = (currentSim.nodes() as any[]).find((n: any) => n.id === (d as any).id);
          if (target) { target.fx = null; target.fy = null; }
        }
      }, 3000);
      return () => clearTimeout(releaseTimer);
    });

    // 悬浮提示
    nodeGroups
      .on("mouseover", (event: MouseEvent, d) => {
        if (!tooltipRef.current) return;
        const title = (locale === "en" && d.titleEn ? d.titleEn : d.title)
          .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const typeLabel = NODE_LABEL[d.nodeType as NodeType] || d.nodeType;
        const color = NODE_COLOR[d.nodeType as NodeType] || "#94a3b8";
        tooltipRef.current.innerHTML = `<div style="font-weight:600;font-size:13px;margin-bottom:4px">${title}</div><div style="display:flex;align-items:center;gap:6px;font-size:11px;opacity:0.7"><span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>${typeLabel}${d.linkCount > 0 ? ` · ${d.linkCount} 个连接` : ""}</div>`;
        tooltipRef.current.style.display = "block";
        tooltipRef.current.style.left = `${event.clientX + 14}px`;
        tooltipRef.current.style.top = `${event.clientY - 44}px`;
      })
      .on("mousemove", (event: MouseEvent) => {
        if (!tooltipRef.current) return;
        tooltipRef.current.style.left = `${event.clientX + 14}px`;
        tooltipRef.current.style.top = `${event.clientY - 44}px`;
      })
      .on("mouseout", () => {
        if (!tooltipRef.current) return;
        tooltipRef.current.style.display = "none";
      });

    // 双击跳转
    nodeGroups.on("dblclick", (event, d) => {
      event.stopPropagation();
      if (d.nodeType === "TAG" || d.nodeType === "CATEGORY") return;
      const pathMap: Record<NodeType, string> = {
        NOTE: "notes",
        BLOG: "blog",
        PROJECT: "projects",
        TAG: "",
        CATEGORY: "",
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
  }, [allNodes, allEdges, activeNodeTypes, activeEdgeTypes, viewMode, locale, router]);

  // 重渲染触发
  useEffect(() => {
    if (!loading) renderGraph();
  }, [renderGraph, loading]);

  // 统一视觉状态：选中高亮 + 连通分量模糊 + 搜索过滤（合并避免相互覆盖）
  useEffect(() => {
    selectedNodeRef.current = selectedNode;
    if (!svgRef.current) return;

    // 选中节点描边
    d3.select(svgRef.current)
      .selectAll<SVGCircleElement, GraphNode>(".nodes g circle")
      .attr("stroke-width", (d: any) => (selectedNode?.id === d.id ? 3.5 : 1.5))
      .attr("stroke", (d: any) => (selectedNode?.id === d.id ? "#fff" : "#fff"));

    // 构建连通分量
    let componentIds: Set<string> | null = null;
    if (selectedNode && simulationRef.current) {
      const linkForce = simulationRef.current.force("link") as d3.ForceLink<any, any>;
      const simLinks = linkForce ? linkForce.links() : [];
      const adj = new Map<string, Set<string>>();
      simLinks.forEach((e: any) => {
        const s = e.source.id; const t = e.target.id;
        if (!adj.has(s)) adj.set(s, new Set());
        if (!adj.has(t)) adj.set(t, new Set());
        adj.get(s)!.add(t); adj.get(t)!.add(s);
      });
      componentIds = new Set<string>();
      const q2 = [selectedNode.id];
      while (q2.length) {
        const cur = q2.shift()!;
        if (componentIds.has(cur)) continue;
        componentIds.add(cur);
        adj.get(cur)?.forEach(nb => { if (!componentIds!.has(nb)) q2.push(nb); });
      }
    }

    const q = searchQuery.toLowerCase();

    // 节点透明度 + 模糊
    d3.select(svgRef.current)
      .selectAll<SVGGElement, GraphNode>(".nodes g")
      .attr("opacity", (d: any) => {
        const inComp = !componentIds || componentIds.has(d.id);
        if (!inComp) return 0.12;
        if (q) {
          const match = d.title.toLowerCase().includes(q) ||
            (d.titleEn || "").toLowerCase().includes(q) || d.slug.includes(q);
          if (!match) return 0.1;
        }
        return 1;
      })
      .style("filter", (d: any) =>
        componentIds && !componentIds.has(d.id) ? "blur(0.5px)" : null
      );

    // 边透明度 + 箭头标记（箭头是独立 SVG defs，必须也隐藏否则会浮现）
    const linkTypes: EdgeType[] = ["WIKI_LINK", "EXPLICIT"];
    d3.select(svgRef.current)
      .selectAll<SVGLineElement, any>(".edges line")
      .attr("stroke-opacity", (e: any) => {
        if (!componentIds) {
          return e.type === "TAG_NODE" || e.type === "CATEGORY_NODE" ? 0.45 : 0.75;
        }
        const inComp = componentIds.has(e.source.id) && componentIds.has(e.target.id);
        if (!inComp) return 0;
        return e.type === "TAG_NODE" || e.type === "CATEGORY_NODE" ? 0.45 : 0.75;
      })
      .attr("marker-end", (e: any) => {
        if (!componentIds) {
          return linkTypes.includes(e.type) ? `url(#arrow-${e.type})` : null;
        }
        const inComp = componentIds.has(e.source.id) && componentIds.has(e.target.id);
        if (!inComp) return null;
        return linkTypes.includes(e.type) ? `url(#arrow-${e.type})` : null;
      });
  }, [selectedNode, searchQuery]);

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
    ? allEdges.filter((e) => e.source === selectedNode.id && e.type !== "TAG_NODE" && e.type !== "CATEGORY_NODE")
    : [];
  const selectedInLinks = selectedNode
    ? allEdges.filter((e) => e.target === selectedNode.id && e.type !== "TAG_NODE" && e.type !== "CATEGORY_NODE")
    : [];
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));

  const navigateTo = (node: GraphNode) => {
    if (node.nodeType === "TAG") return;
    const pathMap: Record<NodeType, string> = { NOTE: "notes", BLOG: "blog", PROJECT: "projects", TAG: "", CATEGORY: "" };
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
      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative overflow-hidden"
        style={{ minHeight: 500 }}
      >
        {/* 图谱画布 */}
        <div className="w-full h-full">
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

        {/* 侧边面板（绝对定位叠加在图谱上，不影响画布宽度） */}
        {selectedNode && (
          <div className="absolute right-0 top-0 bottom-0 w-72 border-l border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm flex flex-col overflow-y-auto shadow-xl z-10">
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

      {/* 悬浮 Tooltip（固定定位，跟随鼠标） */}
      <div
        ref={tooltipRef}
        style={{ display: "none", position: "fixed", zIndex: 9999, pointerEvents: "none" }}
        className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-lg text-[var(--color-foreground)] max-w-[200px]"
      />
    </div>
  );
}
