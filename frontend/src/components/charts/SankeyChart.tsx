import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { SankeyData } from '../../types';

interface Props {
  data: SankeyData;
  width?: number;
  height?: number;
}

interface SNode {
  id: string;
  name: string;
  color: string;
}

interface SLink {
  source: string;
  target: string;
  value: number;
}

export function SankeyChart({ data, width = 900, height = 500 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Build node set for link validation
    const nodeIds = new Set(data.nodes.map((n) => n.id));
    const nodes = data.nodes.map((n) => ({ ...n }));
    const links = data.links
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target) && l.value > 0)
      .map((l) => ({ source: l.source, target: l.target, value: l.value }));

    if (nodes.length === 0 || links.length === 0) {
      g.append('text')
        .attr('x', w / 2)
        .attr('y', h / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9CA3AF')
        .text('No data to display');
      return;
    }

    const sankeyGen = sankey<any, any>()
      .nodeId((d: any) => d.id)
      .nodeWidth(20)
      .nodePadding(12)
      .extent([[0, 0], [w, h]]);

    let graph;
    try {
      graph = sankeyGen({ nodes: nodes as any, links: links as any });
    } catch (err) {
      console.error('Sankey layout error:', err);
      g.append('text')
        .attr('x', w / 2)
        .attr('y', h / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9CA3AF')
        .text('Unable to render chart');
      return;
    }

    // Links
    g.append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', (d: any) => (d.source as any).color || '#6366F1')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .on('mouseover', function () {
        d3.select(this).attr('stroke-opacity', 0.6);
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke-opacity', 0.3);
      })
      .append('title')
      .text((d: any) => `${(d.source as any).name} → ${(d.target as any).name}: $${d.value.toFixed(2)}`);

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(graph.nodes)
      .join('g');

    node.append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => Math.max(1, d.y1 - d.y0))
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d: any) => d.color || '#6366F1')
      .attr('rx', 3)
      .append('title')
      .text((d: any) => `${d.name}: $${(d.value || 0).toFixed(2)}`);

    // Labels
    node.append('text')
      .attr('x', (d: any) => d.x0 < w / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < w / 2 ? 'start' : 'end')
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .text((d: any) => {
        const val = d.value || 0;
        return val > 0 ? `${d.name} ($${val.toFixed(0)})` : d.name;
      });
  }, [data, width, height]);

  return <svg ref={svgRef} className="w-full" />;
}
