"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { useRouter } from "next/navigation";

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  type: string;
  category: string | null;
  linkCount: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface KnowledgeGraphProps {
  locale: string;
}

export function KnowledgeGraph({ locale }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
  }>({ visible: false, x: 0, y: 0, title: "" });
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const fetchData = async () => {
      try {
        const res = await fetch("/api/graph");
        const data = await res.json();

        if (!res.ok || !data.nodes || data.nodes.length === 0) {
          return;
        }

        renderGraph(data.nodes, data.edges);
      } catch (error) {
        console.error("Failed to fetch graph data:", error);
      }
    };

    const renderGraph = (nodes: GraphNode[], edges: GraphEdge[]) => {
      const container = containerRef.current!;
      const svg = d3.select(svgRef.current);

      // 清理之前的渲染
      svg.selectAll("*").remove();

      const width = container.clientWidth;
      const height = Math.max(500, container.clientHeight);

      svg.attr("width", width).attr("height", height);

      // 创建容器组
      const g = svg.append("g");

      // 添加缩放行为
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        });

      svg.call(zoom as any);

      // 颜色映射
      const colorScale = d3
        .scaleOrdinal<string>()
        .domain(["NOTE", "BLOG"])
        .range(["#3b82f6", "#10b981"]);

      // 节点大小映射
      const sizeScale = d3
        .scaleSqrt()
        .domain([0, d3.max(nodes, (d) => d.linkCount) || 1])
        .range([6, 20]);

      // 创建力导向模拟
      const simulation = d3
        .forceSimulation(nodes as d3.SimulationNodeDatum[])
        .force(
          "link",
          d3
            .forceLink(edges)
            .id((d: any) => d.id)
            .distance(100)
        )
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force(
          "collision",
          d3.forceCollide<any>().radius((d) => sizeScale(d.linkCount) + 5)
        );

      // 绘制边
      const link = g
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(edges)
        .enter()
        .append("line")
        .attr("stroke", "#94a3b8")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1.5);

      // 绘制节点
      const node = g
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g")
        .attr("cursor", "pointer")
        .call(
          d3
            .drag<SVGGElement, GraphNode>()
            .on("start", (event, d: any) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d: any) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d: any) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );

      // 节点圆形
      node
        .append("circle")
        .attr("r", (d) => sizeScale(d.linkCount))
        .attr("fill", (d) => colorScale(d.type))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .on("mouseover", (event, d) => {
          const [x, y] = d3.pointer(event, container);
          setTooltip({
            visible: true,
            x: x + 10,
            y: y - 10,
            title: locale === "en" && d.titleEn ? d.titleEn : d.title,
          });
        })
        .on("mouseout", () => {
          setTooltip((prev) => ({ ...prev, visible: false }));
        })
        .on("click", (event, d) => {
          router.push(`/${locale}/notes/${d.slug}`);
        });

      // 节点标签（仅对连接数多的节点显示）
      node
        .filter((d) => d.linkCount > 0)
        .append("text")
        .text((d) => {
          const title = locale === "en" && d.titleEn ? d.titleEn : d.title;
          return title.length > 15 ? title.substring(0, 15) + "..." : title;
        })
        .attr("x", 12)
        .attr("y", 4)
        .attr("font-size", "11px")
        .attr("fill", "#64748b")
        .attr("font-family", "system-ui");

      // 模拟更新
      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });
    };

    fetchData();
  }, [locale, router]);

  return (
    <div ref={containerRef} className="relative w-full h-[600px]">
      <svg ref={svgRef} className="w-full h-full" />
      {tooltip.visible && (
        <div
          className="absolute z-10 px-3 py-2 text-sm bg-card border border-border rounded-md shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.title}
        </div>
      )}
    </div>
  );
}
