import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { ForecastData } from '../../types';

interface Props {
  data: ForecastData;
  width?: number;
  height?: number;
}

export function ForecastChart({ data, width = 900, height = 400 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.points.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 70 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const points = data.points;
    const parseDate = (s: string) => new Date(s);

    const xScale = d3.scaleTime()
      .domain(d3.extent(points, (d) => parseDate(d.date)) as [Date, Date])
      .range([0, w]);

    const yExtent = d3.extent(points, (d) => d.projectedBalance) as [number, number];
    const yMin = Math.min(yExtent[0], 0);
    const yMax = yExtent[1];
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = d3.scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([h, 0]);

    // Grid
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).tickSize(-w).tickFormat(() => ''))
      .selectAll('line')
      .attr('stroke', '#E5E7EB');

    g.selectAll('.grid .domain').remove();

    // Zero line
    if (yMin < 0) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', w)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0))
        .attr('stroke', '#EF4444')
        .attr('stroke-dasharray', '4')
        .attr('stroke-opacity', 0.5);
    }

    // Area
    const area = d3.area<typeof points[0]>()
      .x((d) => xScale(parseDate(d.date)))
      .y0(h)
      .y1((d) => yScale(d.projectedBalance))
      .curve(d3.curveMonotoneX);

    const gradient = svg.append('defs').append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#6366F1').attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#6366F1').attr('stop-opacity', 0.05);

    g.append('path')
      .datum(points)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    // Line
    const line = d3.line<typeof points[0]>()
      .x((d) => xScale(parseDate(d.date)))
      .y((d) => yScale(d.projectedBalance))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(points)
      .attr('fill', 'none')
      .attr('stroke', '#6366F1')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Dots for negative
    g.selectAll('.neg-dot')
      .data(points.filter((d) => d.projectedBalance < 0))
      .join('circle')
      .attr('cx', (d) => xScale(parseDate(d.date)))
      .attr('cy', (d) => yScale(d.projectedBalance))
      .attr('r', 4)
      .attr('fill', '#EF4444');

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%b %Y') as any))
      .selectAll('text')
      .attr('font-size', '11px');

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickFormat((d) => `$${d3.format(',.0f')(d as number)}`))
      .selectAll('text')
      .attr('font-size', '11px');

  }, [data, width, height]);

  return <svg ref={svgRef} className="w-full" />;
}
