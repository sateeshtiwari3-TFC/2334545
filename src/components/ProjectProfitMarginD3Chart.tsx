import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Project, Expense } from '../types';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  DollarSign, 
  Info, 
  Filter, 
  Sparkles,
  Search,
  ArrowUpRight,
  Maximize2,
  Crown,
  Award,
  ShieldCheck,
  Zap,
  X,
  Percent,
  Download,
  Target,
  Copy,
  Check,
  ChevronRight,
  Layers
} from 'lucide-react';

interface ProjectProfitMarginD3ChartProps {
  projects: Project[];
  expenses?: Expense[];
}

export interface ProjectFinancialData {
  id: string;
  projectName: string;
  coupleName: string;
  studioName: string;
  eventType: string;
  status: string;
  revenue: number;
  advancePayment: number;
  remainingBalance: number;
  editorExpense: number;
  firstEditorName?: string;
  firstEditorShare?: number;
  secondEditorName?: string;
  secondEditorShare?: number;
  isSplitProject?: boolean;
  otherExpense: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPct: number;
  roiMultiple: number;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Risk';
}

export const ProjectProfitMarginD3Chart: React.FC<ProjectProfitMarginD3ChartProps> = ({
  projects,
  expenses = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [viewType, setViewType] = useState<'treemap' | 'grouped_bar' | 'margin_rank' | 'scatter'>('treemap');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'margin' | 'revenue' | 'profit'>('margin');
  const [hoveredProject, setHoveredProject] = useState<ProjectFinancialData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedProjectModal, setSelectedProjectModal] = useState<ProjectFinancialData | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Process financial metrics per project
  const projectDataList: ProjectFinancialData[] = useMemo(() => {
    return projects.map(p => {
      const revenue = Number(p.projectAmount) || 0;
      const advancePayment = Number(p.advancePayment) || 0;
      const remainingBalance = Number(p.remainingBalance) || 0;

      // Editor expense calculation (account for split projects)
      let editorExp = Number(p.editorPayment) || 0;
      if (p.isSplitProject) {
        editorExp = (Number(p.firstEditorShare) || 0) + (Number(p.secondEditorShare) || 0);
      }

      // Project explicit other expenses
      const projectOther = Number(p.otherExpenses) || 0;

      // Linked manual expenses matching this project ID
      const linkedExpenses = expenses
        .filter(e => e.projectId === p.id)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const totalExpenses = editorExp + projectOther + linkedExpenses;
      const netProfit = revenue - totalExpenses;
      const profitMarginPct = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;
      const roiMultiple = totalExpenses > 0 ? Number((revenue / totalExpenses).toFixed(2)) : (revenue > 0 ? 10 : 0);

      // Determine Luxury Tier
      let tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Risk' = 'Gold';
      if (profitMarginPct >= 65) tier = 'Diamond';
      else if (profitMarginPct >= 50) tier = 'Gold';
      else if (profitMarginPct >= 35) tier = 'Silver';
      else if (profitMarginPct >= 20) tier = 'Bronze';
      else tier = 'Risk';

      return {
        id: p.id,
        projectName: p.projectName || `${p.coupleName} Wedding`,
        coupleName: p.coupleName || 'Wedding Couple',
        studioName: p.studioName || 'Direct Studio',
        eventType: p.eventType || 'Full Wedding',
        status: p.status,
        revenue,
        advancePayment,
        remainingBalance,
        editorExpense: editorExp,
        firstEditorName: p.assignedEditorName,
        firstEditorShare: p.firstEditorShare,
        secondEditorName: p.secondEditorName,
        secondEditorShare: p.secondEditorShare,
        isSplitProject: p.isSplitProject,
        otherExpense: projectOther + linkedExpenses,
        totalExpenses,
        netProfit,
        profitMarginPct,
        roiMultiple,
        tier
      };
    });
  }, [projects, expenses]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    let list = projectDataList.filter(p => {
      // Status filter
      if (statusFilter === 'active' && ['delivered', 'closed'].includes(p.status)) return false;
      if (statusFilter === 'completed' && !['delivered', 'closed'].includes(p.status)) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return p.coupleName.toLowerCase().includes(query) ||
               p.projectName.toLowerCase().includes(query) ||
               p.studioName.toLowerCase().includes(query) ||
               p.eventType.toLowerCase().includes(query);
      }
      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'margin') return b.profitMarginPct - a.profitMarginPct;
      if (sortBy === 'revenue') return b.revenue - a.revenue;
      if (sortBy === 'profit') return b.netProfit - a.netProfit;
      return 0;
    });
  }, [projectDataList, statusFilter, searchTerm, sortBy]);

  // Overall Portfolio Totals for header summary
  const summary = useMemo(() => {
    const totalRevenue = filteredData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalExpenses = filteredData.reduce((acc, curr) => acc + curr.totalExpenses, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const avgMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    const diamondCount = filteredData.filter(d => d.tier === 'Diamond').length;
    const goldCount = filteredData.filter(d => d.tier === 'Gold').length;
    const riskCount = filteredData.filter(d => d.tier === 'Risk').length;

    return { totalRevenue, totalExpenses, totalProfit, avgMargin, count: filteredData.length, diamondCount, goldCount, riskCount };
  }, [filteredData]);

  // Export CSV function
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = ["Project Name", "Couple Name", "Studio Partner", "Event Type", "Status", "Revenue (INR)", "Total Expenses (INR)", "Net Profit (INR)", "Margin %", "ROI Multiple", "Tier"];
    const rows = filteredData.map(p => [
      `"${p.projectName}"`,
      `"${p.coupleName}"`,
      `"${p.studioName}"`,
      `"${p.eventType}"`,
      `"${p.status}"`,
      p.revenue,
      p.totalExpenses,
      p.netProfit,
      `${p.profitMarginPct}%`,
      `${p.roiMultiple}x`,
      p.tier
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Project_Profitability_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Executive Summary to Clipboard
  const handleCopySummary = () => {
    const text = `🏆 EXECUTIVE PROFITABILITY AUDIT SUMMARY\n-----------------------------------\nTotal Projects Analyzed: ${summary.count}\nPortfolio Gross Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')}\nTotal Operating Expenses: ₹${summary.totalExpenses.toLocaleString('en-IN')}\nNet Portfolio Profit: ₹${summary.totalProfit.toLocaleString('en-IN')}\nWeighted Profit Margin: ${summary.avgMargin}%\nDiamond Tier Projects (>65% Margin): ${summary.diamondCount}\nAt Risk Projects (<20% Margin): ${summary.riskCount}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Color helper for Margin status
  const getMarginTheme = (marginPct: number) => {
    if (marginPct >= 65) return {
      fill: '#10b981',
      stroke: '#34d399',
      bgGradient: 'from-emerald-500/20 via-emerald-500/10 to-transparent',
      textColor: 'text-emerald-400',
      label: 'Diamond Tier'
    };
    if (marginPct >= 50) return {
      fill: '#d4af37',
      stroke: '#fef08a',
      bgGradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
      textColor: 'text-amber-300',
      label: 'Gold Tier'
    };
    if (marginPct >= 35) return {
      fill: '#3b82f6',
      stroke: '#93c5fd',
      bgGradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
      textColor: 'text-blue-400',
      label: 'Silver Tier'
    };
    if (marginPct >= 20) return {
      fill: '#f97316',
      stroke: '#fdba74',
      bgGradient: 'from-orange-500/20 via-orange-500/10 to-transparent',
      textColor: 'text-orange-400',
      label: 'Bronze Tier'
    };
    return {
      fill: '#ef4444',
      stroke: '#fca5a5',
      bgGradient: 'from-rose-500/20 via-rose-500/10 to-transparent',
      textColor: 'text-rose-400',
      label: 'At Risk'
    };
  };

  // Render D3 chart whenever viewType, filteredData, or container size changes
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = 420;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear canvas

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    if (filteredData.length === 0) {
      // Empty state
      const emptyG = svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2})`);
      emptyG.append('circle').attr('r', 28).attr('fill', '#111827').attr('stroke', '#d4af37').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
      emptyG.append('text')
        .attr('y', 45)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '13px')
        .attr('font-family', 'sans-serif')
        .text('No matching project financial records found');
      return;
    }

    // ================= 1. D3 TREEMAP MATRIX VIEW =================
    if (viewType === 'treemap') {
      const margin = { top: 12, right: 12, bottom: 12, left: 12 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Construct D3 hierarchy
      interface HierarchyDatum {
        name: string;
        children?: ProjectFinancialData[];
        value?: number;
      }

      const rootData: HierarchyDatum = {
        name: 'Luxury Wedding Portfolio',
        children: filteredData
      };

      const root = d3.hierarchy<HierarchyDatum>(rootData)
        .sum((d: any) => d.revenue || 1) // Area proportional to revenue
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      const treemapLayout = d3.treemap<HierarchyDatum>()
        .size([innerWidth, innerHeight])
        .paddingOuter(5)
        .paddingInner(5)
        .round(true);

      treemapLayout(root);

      const leaves = root.leaves();

      // Create SVG Gradients for each node
      const defs = svg.append('defs');
      leaves.forEach((d: any, idx) => {
        const item = d.data as ProjectFinancialData;
        const theme = getMarginTheme(item.profitMarginPct);
        const gradId = `treemap-grad-${idx}`;
        
        const grad = defs.append('linearGradient')
          .attr('id', gradId)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '100%').attr('y2', '100%');

        grad.append('stop').attr('offset', '0%').attr('stop-color', theme.fill).attr('stop-opacity', 0.95);
        grad.append('stop').attr('offset', '100%').attr('stop-color', d3.color(theme.fill)?.darker(1.2)?.toString() || '#0f172a').attr('stop-opacity', 0.85);
      });

      const nodes = g.selectAll('g')
        .data(leaves)
        .enter()
        .append('g')
        .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

      // Draw Rectangles with gradient & metallic inner stroke
      nodes.append('rect')
        .attr('width', (d: any) => Math.max(0, d.x1 - d.x0))
        .attr('height', (d: any) => Math.max(0, d.y1 - d.y0))
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('fill', (_d: any, idx) => `url(#treemap-grad-${idx})`)
        .attr('stroke', '#d4af37')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3)
        .style('cursor', 'pointer')
        .style('transition', 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)')
        .on('mouseover', function (event, d: any) {
          d3.select(this)
            .attr('stroke-width', 3)
            .attr('stroke-opacity', 1)
            .attr('stroke', '#fef08a');
          
          setHoveredProject(d.data as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on('mousemove', function (event) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({
              x: event.clientX - rect.left,
              y: event.clientY - rect.top
            });
          }
        })
        .on('mouseout', function () {
          d3.select(this)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.3)
            .attr('stroke', '#d4af37');
          setHoveredProject(null);
          setTooltipPos(null);
        })
        .on('click', (_event, d: any) => {
          setSelectedProjectModal(d.data as ProjectFinancialData);
        });

      // Add Text Labels inside treemap boxes if box is large enough
      nodes.each(function (d: any) {
        const item = d.data as ProjectFinancialData;
        const boxWidth = d.x1 - d.x0;
        const boxHeight = d.y1 - d.y0;

        const nodeG = d3.select(this);

        if (boxWidth > 55 && boxHeight > 40) {
          // Couple Name / Title
          nodeG.append('text')
            .attr('x', 10)
            .attr('y', 20)
            .attr('fill', '#ffffff')
            .attr('font-size', boxWidth > 120 ? '13px' : '11px')
            .attr('font-weight', '700')
            .attr('font-family', 'sans-serif')
            .attr('pointer-events', 'none')
            .text(() => {
              const name = item.coupleName;
              const maxChars = Math.floor(boxWidth / 8.5);
              return name.length > maxChars ? name.slice(0, maxChars) + '…' : name;
            });

          // Revenue Text
          if (boxHeight > 55) {
            nodeG.append('text')
              .attr('x', 10)
              .attr('y', 36)
              .attr('fill', 'rgba(255,255,255,0.85)')
              .attr('font-size', '10px')
              .attr('font-family', 'monospace')
              .attr('pointer-events', 'none')
              .text(`₹${(item.revenue / 1000).toFixed(0)}k Rev`);
          }

          // Margin Badge
          if (boxHeight > 75 && boxWidth > 75) {
            nodeG.append('text')
              .attr('x', 10)
              .attr('y', 54)
              .attr('fill', '#fef08a')
              .attr('font-size', '11px')
              .attr('font-weight', '800')
              .attr('font-family', 'sans-serif')
              .attr('pointer-events', 'none')
              .text(`${item.profitMarginPct}% Margin`);
          }
        }
      });

    // ================= 2. D3 GROUPED BAR CHART VIEW =================
    } else if (viewType === 'grouped_bar') {
      const margin = { top: 35, right: 30, bottom: 75, left: 70 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Limit max projects displayed in bar chart for readability
      const dataSlice = filteredData.slice(0, 12);

      // X0 Scale (Project Names)
      const x0Scale = d3.scaleBand()
        .domain(dataSlice.map(d => d.coupleName))
        .range([0, innerWidth])
        .paddingInner(0.25);

      // X1 Scale (Sub-bars: Revenue vs Expenses)
      const x1Scale = d3.scaleBand()
        .domain(['revenue', 'totalExpenses'])
        .range([0, x0Scale.bandwidth()])
        .padding(0.12);

      // Y Scale (Rupees Amount)
      const maxVal = d3.max(dataSlice, (d: ProjectFinancialData) => Math.max(d.revenue, d.totalExpenses)) || 100000;
      const yScale = d3.scaleLinear()
        .domain([0, maxVal * 1.18])
        .nice()
        .range([innerHeight, 0]);

      // Grid Lines
      g.append('g')
        .attr('class', 'grid-lines')
        .call(
          d3.axisLeft(yScale)
            .ticks(5)
            .tickSize(-innerWidth)
            .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#1e293b')
        .attr('stroke-dasharray', '3,3');

      // X Axis
      const xAxis = g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x0Scale));

      xAxis.selectAll('text')
        .attr('fill', '#94a3b8')
        .attr('font-size', '11px')
        .attr('transform', 'rotate(-25)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em');

      xAxis.select('.domain').attr('stroke', '#334155');

      // Y Axis
      const yAxis = g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickFormat((d) => `₹${Number(d) / 1000}k`));

      yAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px');
      yAxis.select('.domain').attr('stroke', '#334155');

      // Group for Bars
      const projectGroups = g.selectAll('.project-group')
        .data(dataSlice)
        .enter()
        .append('g')
        .attr('class', 'project-group')
        .attr('transform', (d: ProjectFinancialData) => `translate(${x0Scale(d.coupleName)},0)`);

      // Sub Bar 1: Revenue (Champagne Gold / Emerald)
      projectGroups.append('rect')
        .attr('x', x1Scale('revenue') || 0)
        .attr('y', innerHeight)
        .attr('width', x1Scale.bandwidth())
        .attr('height', 0)
        .attr('fill', '#10b981')
        .attr('rx', 5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d: any) {
          setHoveredProject(d as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }
        })
        .on('mouseout', () => { setHoveredProject(null); setTooltipPos(null); })
        .on('click', (_event, d: any) => setSelectedProjectModal(d as ProjectFinancialData))
        .transition()
        .duration(600)
        .attr('y', (d: any) => yScale((d as ProjectFinancialData).revenue))
        .attr('height', (d: any) => innerHeight - yScale((d as ProjectFinancialData).revenue));

      // Sub Bar 2: Expenses (Ruby Red)
      projectGroups.append('rect')
        .attr('x', x1Scale('totalExpenses') || 0)
        .attr('y', innerHeight)
        .attr('width', x1Scale.bandwidth())
        .attr('height', 0)
        .attr('fill', '#f43f5e')
        .attr('rx', 5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d: any) {
          setHoveredProject(d as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }
        })
        .on('mouseout', () => { setHoveredProject(null); setTooltipPos(null); })
        .on('click', (_event, d: any) => setSelectedProjectModal(d as ProjectFinancialData))
        .transition()
        .duration(600)
        .attr('y', (d: any) => yScale((d as ProjectFinancialData).totalExpenses))
        .attr('height', (d: any) => innerHeight - yScale((d as ProjectFinancialData).totalExpenses));

      // Margin Badge on top of each group
      projectGroups.append('text')
        .attr('x', x0Scale.bandwidth() / 2)
        .attr('y', (d: any) => Math.min(yScale((d as ProjectFinancialData).revenue), yScale((d as ProjectFinancialData).totalExpenses)) - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', (d: any) => getMarginTheme((d as ProjectFinancialData).profitMarginPct).fill)
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text((d: any) => `${(d as ProjectFinancialData).profitMarginPct}%`);

    // ================= 3. D3 PROFIT MARGIN LEADERBOARD VIEW =================
    } else if (viewType === 'margin_rank') {
      const margin = { top: 20, right: 90, bottom: 30, left: 140 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Sort data by profit margin descending
      const sortedData = [...filteredData].sort((a, b) => b.profitMarginPct - a.profitMarginPct).slice(0, 10);

      const yScale = d3.scaleBand()
        .domain(sortedData.map(d => d.coupleName))
        .range([0, innerHeight])
        .padding(0.28);

      const maxMargin = Math.max(100, d3.max(sortedData, d => d.profitMarginPct) || 100);
      const xScale = d3.scaleLinear()
        .domain([0, maxMargin])
        .range([0, innerWidth]);

      // Y Axis (Couple Names)
      const yAxis = g.append('g').call(d3.axisLeft(yScale));
      yAxis.selectAll('text').attr('fill', '#f1f5f9').attr('font-size', '12px').attr('font-weight', '600');
      yAxis.select('.domain').attr('stroke', '#334155');

      // Bars
      g.selectAll('.bar')
        .data(sortedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('y', (d: ProjectFinancialData) => yScale(d.coupleName) || 0)
        .attr('height', yScale.bandwidth())
        .attr('x', 0)
        .attr('width', 0)
        .attr('fill', (d: ProjectFinancialData) => getMarginTheme(d.profitMarginPct).fill)
        .attr('rx', 6)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d: any) {
          setHoveredProject(d as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }
        })
        .on('mouseout', () => { setHoveredProject(null); setTooltipPos(null); })
        .on('click', (_event, d: any) => setSelectedProjectModal(d as ProjectFinancialData))
        .transition()
        .duration(600)
        .attr('width', (d: any) => Math.max(6, xScale(Math.max(0, (d as ProjectFinancialData).profitMarginPct))));

      // Value labels at end of bars
      g.selectAll('.value-label')
        .data(sortedData)
        .enter()
        .append('text')
        .attr('y', (d: ProjectFinancialData) => (yScale(d.coupleName) || 0) + yScale.bandwidth() / 2 + 4)
        .attr('x', (d: ProjectFinancialData) => xScale(Math.max(0, d.profitMarginPct)) + 10)
        .attr('fill', (d: ProjectFinancialData) => getMarginTheme(d.profitMarginPct).fill)
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text((d: ProjectFinancialData) => `${d.profitMarginPct}% (${d.roiMultiple}x ROI)`);

    // ================= 4. D3 ROI SCATTER MATRIX VIEW =================
    } else if (viewType === 'scatter') {
      const margin = { top: 30, right: 40, bottom: 50, left: 70 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const maxRev: number = d3.max(filteredData, (d: ProjectFinancialData) => d.revenue) || 100000;
      const maxExp: number = d3.max(filteredData, (d: ProjectFinancialData) => d.totalExpenses) || 50000;

      const xScale = d3.scaleLinear().domain([0, maxRev * 1.1]).range([0, innerWidth]);
      const yScale = d3.scaleLinear().domain([0, maxExp * 1.1]).range([innerHeight, 0]);

      // Grid Lines
      g.append('g')
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => ''))
        .selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3');

      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight).tickFormat(() => ''))
        .selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3,3');

      // Reference 50% Margin Line (Revenue = 2 * Expense)
      const targetRev = maxRev * 1.1;
      const targetExp = targetRev / 2;
      const labelRev = maxRev * 0.8;
      const labelExp = labelRev / 2;

      g.append('line')
        .attr('x1', 0)
        .attr('y1', innerHeight)
        .attr('x2', xScale(targetRev))
        .attr('y2', yScale(targetExp))
        .attr('stroke', '#d4af37')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5,5');

      g.append('text')
        .attr('x', xScale(labelRev))
        .attr('y', yScale(labelExp) - 8)
        .attr('fill', '#d4af37')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text('50% Margin Target Line');

      // Axes
      const xAxis = g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `₹${Number(d)/1000}k`));
      xAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px');
      xAxis.select('.domain').attr('stroke', '#334155');

      const yAxis = g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `₹${Number(d)/1000}k`));
      yAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px');
      yAxis.select('.domain').attr('stroke', '#334155');

      // Axis Labels
      g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 40).attr('text-anchor', 'middle').attr('fill', '#64748b').attr('font-size', '11px').text('Project Gross Revenue (₹)');
      g.append('text').attr('transform', 'rotate(-90)').attr('x', -innerHeight / 2).attr('y', -50).attr('text-anchor', 'middle').attr('fill', '#64748b').attr('font-size', '11px').text('Total Expenses (₹)');

      // Plot Bubbles
      g.selectAll('.dot')
        .data(filteredData)
        .enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('cx', (d: ProjectFinancialData) => xScale(d.revenue))
        .attr('cy', (d: ProjectFinancialData) => yScale(d.totalExpenses))
        .attr('r', (d: ProjectFinancialData) => Math.max(6, Math.min(22, Math.sqrt(Math.max(1, d.netProfit)) / 20)))
        .attr('fill', (d: ProjectFinancialData) => getMarginTheme(d.profitMarginPct).fill)
        .attr('fill-opacity', 0.8)
        .attr('stroke', '#fef08a')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d: any) {
          d3.select(this).attr('fill-opacity', 1).attr('r', 24);
          setHoveredProject(d as ProjectFinancialData);
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
          }
        })
        .on('mouseout', function(_event, d: any) {
          d3.select(this).attr('fill-opacity', 0.8).attr('r', Math.max(6, Math.min(22, Math.sqrt(Math.max(1, d.netProfit)) / 20)));
          setHoveredProject(null);
          setTooltipPos(null);
        })
        .on('click', (_event, d: any) => setSelectedProjectModal(d as ProjectFinancialData));
    }

  }, [filteredData, viewType]);

  return (
    <div className="bg-[#090d14] border border-amber-500/25 rounded-3xl p-5 sm:p-7 space-y-6 shadow-[0_0_40px_rgba(212,175,55,0.05)] backdrop-blur-2xl relative overflow-hidden">
      
      {/* Decorative Gold Ambient Glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-amber-500/20 pb-5 relative z-10">
        <div>
          <div className="flex items-center space-x-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold shadow-[0_0_20px_rgba(234,179,8,0.3)]">
              <Crown className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-serif font-bold tracking-wider bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent uppercase">
                  PROJECT-WISE PROFIT MARGIN ANALYTICS
                </h3>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-widest bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  EXECUTIVE SUITE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time financial yield matrix comparing gross booking revenue against editor payouts & operating costs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Type Toggle */}
          <div className="flex bg-[#05080e] p-1.5 rounded-2xl border border-amber-500/20 shadow-inner">
            <button
              onClick={() => setViewType('treemap')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewType === 'treemap' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tile Area = Revenue, Tile Color = Margin %"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>D3 Treemap</span>
            </button>

            <button
              onClick={() => setViewType('grouped_bar')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewType === 'grouped_bar' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Revenue vs Total Expenses Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Revenue vs Exp</span>
            </button>

            <button
              onClick={() => setViewType('margin_rank')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewType === 'margin_rank' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rank projects by Profit Margin %"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setViewType('scatter')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewType === 'scatter' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="ROI Scatter Matrix"
            >
              <Target className="w-3.5 h-3.5" />
              <span>ROI Matrix</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-[#0e1420] hover:bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
            title="Download Full Project Financial Audit CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
        <div className="bg-[#0e1420]/80 border border-amber-500/20 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">GROSS REVENUE</span>
          <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono">₹{summary.totalRevenue.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-[#0e1420]/80 border border-amber-500/20 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">TOTAL COSTS</span>
          <p className="text-base sm:text-lg font-bold text-rose-400 font-mono">₹{summary.totalExpenses.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-[#0e1420]/80 border border-amber-500/20 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">NET PROFIT</span>
          <p className="text-base sm:text-lg font-bold text-amber-300 font-mono">₹{summary.totalProfit.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-[#0e1420]/80 border border-amber-500/20 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">WEIGHTED MARGIN</span>
          <div className="flex items-center space-x-2">
            <span className="text-base sm:text-lg font-extrabold text-white font-mono">{summary.avgMargin}%</span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
              {summary.count} Projects
            </span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-[#0e1420]/80 border border-amber-500/20 rounded-2xl p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">TIER BREAKDOWN</span>
            <button onClick={handleCopySummary} className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono">
              {copiedSummary ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono mt-1">
            <span className="text-emerald-400 font-bold">💎 {summary.diamondCount}</span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300 font-bold">👑 {summary.goldCount}</span>
            <span className="text-slate-500">|</span>
            <span className="text-rose-400 font-bold">⚠️ {summary.riskCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs relative z-10 pt-1">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-amber-500/70" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search couple, studio, event type..."
            className="w-full bg-[#05080e] text-slate-200 text-xs rounded-xl pl-9 pr-3.5 py-2 border border-amber-500/20 focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-600 font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#05080e] text-xs text-slate-300 border border-amber-500/20 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer font-semibold"
          >
            <option value="active">Active Weddings</option>
            <option value="completed">Delivered & Closed</option>
            <option value="all">All Weddings</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#05080e] text-xs text-slate-300 border border-amber-500/20 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 cursor-pointer font-semibold"
          >
            <option value="margin">Sort by Margin %</option>
            <option value="revenue">Sort by Revenue</option>
            <option value="profit">Sort by Net Profit</option>
          </select>
        </div>
      </div>

      {/* Margin Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-amber-500/10">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-mono text-[10px] uppercase font-bold text-amber-500">Margin Tiers:</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
            <span className="text-slate-200 font-medium">&gt;65% Diamond</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]"></span>
            <span className="text-slate-200 font-medium">50-65% Gold</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
            <span className="text-slate-200 font-medium">35-50% Silver</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
            <span className="text-slate-200 font-medium">20-35% Bronze</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
            <span className="text-slate-200 font-medium">&lt;20% At Risk</span>
          </span>
        </div>

        <span className="text-[10px] font-mono text-amber-400/80 italic">
          💡 Click on any project node for Executive Financial Audit Sheet
        </span>
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="relative w-full min-h-[420px] bg-[#05080e] rounded-2xl border border-amber-500/20 overflow-hidden p-3 shadow-inner">
        <svg ref={svgRef} className="w-full h-full"></svg>

        {/* D3 Hover Tooltip overlay */}
        {hoveredProject && tooltipPos && (
          <div 
            className="absolute z-50 pointer-events-none bg-[#090e17]/95 border border-amber-400/50 rounded-2xl p-4 shadow-2xl text-xs w-72 backdrop-blur-xl transition-all duration-75"
            style={{
              left: Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 300) - 300),
              top: Math.max(10, Math.min(tooltipPos.y - 120, 260))
            }}
          >
            <div className="border-b border-amber-500/20 pb-2.5 mb-2.5 flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-sm tracking-wide">{hoveredProject.coupleName}</h4>
                <p className="text-[10px] font-mono text-amber-400 mt-0.5">{hoveredProject.studioName} • {hoveredProject.eventType}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono border ${
                hoveredProject.profitMarginPct >= 50 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {hoveredProject.profitMarginPct}% Margin
              </span>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="flex justify-between items-center text-slate-300">
                <span>Gross Revenue:</span>
                <span className="font-bold text-emerald-400">₹{hoveredProject.revenue.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Editor Expense:</span>
                <span className="text-slate-200">₹{hoveredProject.editorExpense.toLocaleString('en-IN')}</span>
              </div>

              {hoveredProject.otherExpense > 0 && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>Other Expenses:</span>
                  <span className="text-slate-200">₹{hoveredProject.otherExpense.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-300 pt-1.5 border-t border-amber-500/20">
                <span>Total Expenses:</span>
                <span className="font-bold text-rose-400">₹{hoveredProject.totalExpenses.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-amber-300 pt-1.5 border-t border-amber-500/20 font-sans">
                <span className="font-bold">Net Yield Profit:</span>
                <span className="font-extrabold text-amber-300 text-sm">₹{hoveredProject.netProfit.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= EXECUTIVE PROJECT AUDIT MODAL ================= */}
      {selectedProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090e17] border border-amber-500/40 rounded-3xl w-full max-w-xl p-6 space-y-6 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-amber-500/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400"><Crown className="w-5 h-5" /></span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">EXECUTIVE AUDIT SHEET</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-white">{selectedProjectModal.coupleName}</h3>
                <p className="text-xs text-slate-400">{selectedProjectModal.studioName} • {selectedProjectModal.eventType}</p>
              </div>

              <button
                onClick={() => setSelectedProjectModal(null)}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Meter & Rating */}
            <div className="grid grid-cols-3 gap-3 bg-[#05080e] p-4 rounded-2xl border border-amber-500/20 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Profit Margin</span>
                <span className="text-xl font-extrabold text-emerald-400">{selectedProjectModal.profitMarginPct}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">ROI Multiple</span>
                <span className="text-xl font-extrabold text-amber-300">{selectedProjectModal.roiMultiple}x</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Luxury Tier</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">🏆 {selectedProjectModal.tier}</span>
              </div>
            </div>

            {/* Full Ledger Breakdown */}
            <div className="space-y-3 text-xs font-mono">
              <h4 className="font-sans text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1">
                Financial Breakdown Ledger
              </h4>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Gross Project Amount:</span>
                  <span className="font-bold text-white">₹{selectedProjectModal.revenue.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Advance Received:</span>
                  <span className="text-emerald-400">₹{selectedProjectModal.advancePayment.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Remaining Balance:</span>
                  <span className="text-amber-400">₹{selectedProjectModal.remainingBalance.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span>Editor Payout Total:</span>
                  <span className="font-bold text-rose-300">₹{selectedProjectModal.editorExpense.toLocaleString('en-IN')}</span>
                </div>

                {selectedProjectModal.isSplitProject && (
                  <div className="pl-4 space-y-1 text-[11px] text-slate-400 border-l-2 border-amber-500/30 my-1">
                    <div className="flex justify-between">
                      <span>1st Editor ({selectedProjectModal.firstEditorName || 'Lead'}):</span>
                      <span>₹{(selectedProjectModal.firstEditorShare || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>2nd Editor ({selectedProjectModal.secondEditorName || 'Assistant'}):</span>
                      <span>₹{(selectedProjectModal.secondEditorShare || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-400">
                  <span>Other / Linked Expenses:</span>
                  <span className="text-rose-300">₹{selectedProjectModal.otherExpense.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center text-base pt-3 border-t border-amber-500/20 font-sans font-bold">
                  <span className="text-white">Net Yield Operating Profit:</span>
                  <span className="text-amber-300 text-lg">₹{selectedProjectModal.netProfit.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Smart AI Financial Analysis */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Executive Profitability Assessment</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                {selectedProjectModal.profitMarginPct >= 60 ? (
                  `Exceptional yield! The editor expense represents only ${Math.round((selectedProjectModal.editorExpense / selectedProjectModal.revenue) * 100)}% of total booking revenue, well below industry ceiling benchmarks.`
                ) : selectedProjectModal.profitMarginPct >= 40 ? (
                  `Healthy performance. Margin is well-balanced with an ROI multiple of ${selectedProjectModal.roiMultiple}x.`
                ) : (
                  `Margin constraint detected. Operating costs absorb ${100 - selectedProjectModal.profitMarginPct}% of gross revenue. Consider adjusting future studio rate cards or editor allocations.`
                )}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProjectModal(null)}
                className="bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer shadow-lg"
              >
                Close Audit Sheet
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectProfitMarginD3Chart;
