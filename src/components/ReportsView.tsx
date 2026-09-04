import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Sparkles, 
  Briefcase, 
  Building2, 
  UserCheck, 
  Percent,
  TrendingDown,
  Info,
  FileDown,
  FileSpreadsheet,
  Download,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { SafeChartContainer } from './common/SafeChartContainer';
import { Project, Studio, Editor, Expense } from '../types';

interface ReportsViewProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  expenses: Expense[];
}

export default function ReportsView({ projects, studios, editors, expenses }: ReportsViewProps) {
  
  // 1. Calculations - Top Studio
  const studioSalesMap: { [key: string]: { name: string; sales: number } } = {};
  projects.forEach(p => {
    if (!studioSalesMap[p.studioId]) {
      studioSalesMap[p.studioId] = { name: p.studioName, sales: 0 };
    }
    studioSalesMap[p.studioId].sales += p.projectAmount || 0;
  });
  const topStudioEntry = Object.values(studioSalesMap).sort((a, b) => b.sales - a.sales)[0] || { name: 'None', sales: 0 };

  // 2. Calculations - Top Editor
  const editorCompletionMap: { [key: string]: { name: string; count: number } } = {};
  projects.forEach(p => {
    if (p.assignedEditorId && (p.status === 'delivered' || p.status === 'closed')) {
      if (!editorCompletionMap[p.assignedEditorId]) {
        editorCompletionMap[p.assignedEditorId] = { name: p.assignedEditorName || 'Unknown', count: 0 };
      }
      editorCompletionMap[p.assignedEditorId].count += 1;
    }
  });
  const topEditorEntry = Object.values(editorCompletionMap).sort((a, b) => b.count - a.count)[0] || { name: 'None', count: 0 };

  // 3. Calculations - Most Profitable Project
  const projectsWithProfit = projects.map(p => {
    const expensesSum = (p.editorPayment || 0) + (p.otherExpenses || 0);
    const profit = (p.projectAmount || 0) - expensesSum;
    const margin = p.projectAmount > 0 ? (profit / p.projectAmount) * 100 : 0;
    return { ...p, profit, margin };
  }).sort((a, b) => b.profit - a.profit);
  const mostProfitableProj = projectsWithProfit[0];

  // 4. Expense allocation data
  const expenseCategoriesMap: { [key: string]: number } = {};
  expenses.forEach(e => {
    expenseCategoriesMap[e.category] = (expenseCategoriesMap[e.category] || 0) + (e.amount || 0);
  });
  // Also include project-level editor payments & other expenses
  projects.forEach(p => {
    expenseCategoriesMap['freelance_editor'] = (expenseCategoriesMap['freelance_editor'] || 0) + (p.editorPayment || 0);
    expenseCategoriesMap['other'] = (expenseCategoriesMap['other'] || 0) + (p.otherExpenses || 0);
  });

  const totalExpenseSum = Object.values(expenseCategoriesMap).reduce((a, b) => a + b, 0);
  const expenseAllocationData = Object.entries(expenseCategoriesMap).map(([key, val]) => {
    const formattedLabel = key.replace(/_/g, ' ').toUpperCase();
    const sharePct = totalExpenseSum > 0 ? ((val / totalExpenseSum) * 100).toFixed(1) : '0.0';
    return { 
      name: formattedLabel, 
      value: val,
      sharePct,
      categoryKey: key
    };
  });

  const PIE_COLORS = ['#1e5546', '#d4af37', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

  // 5. Margin distribution analysis data
  const profitMarginTrend = projectsWithProfit.slice(0, 8).map(p => {
    const expensesSum = (p.editorPayment || 0) + (p.otherExpenses || 0);
    return {
      name: p.coupleName.length > 12 ? `${p.coupleName.substring(0, 12)}...` : p.coupleName,
      fullName: p.coupleName,
      studio: p.studioName,
      Profit: p.profit,
      Amount: p.projectAmount,
      Expenses: expensesSum,
      editorPayment: p.editorPayment || 0,
      otherExpenses: p.otherExpenses || 0,
      margin: p.margin,
      status: p.status,
      id: p.id
    };
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);
  const [csvExported, setCsvExported] = useState(false);

  const handleExportCSV = () => {
    setCsvExporting(true);
    try {
      // Build RFC-4180 compliant CSV with Excel UTF-8 BOM
      const headers = [
        'Project ID',
        'Wedding Campaign / Couple',
        'Allied Studio Partner',
        'Assigned Editor',
        'Shoot Date',
        'Delivery Date',
        'Status',
        'Contract Gross Amount (INR)',
        'Advance Received (INR)',
        'Pending Receivable (INR)',
        'Editor Payout (INR)',
        'Other Production Expenses (INR)',
        'Total Production Cost (INR)',
        'Net Operating Profit (INR)',
        'Profit Margin (%)'
      ];

      const rows = projectsWithProfit.map(p => {
        const expensesSum = (p.editorPayment || 0) + (p.otherExpenses || 0);
        const advance = p.advancePayment || 0;
        const pending = p.remainingBalance !== undefined ? p.remainingBalance : Math.max(0, (p.projectAmount || 0) - advance);
        return [
          `"${(p.id || '').replace(/"/g, '""')}"`,
          `"${(p.coupleName || p.projectName || '').replace(/"/g, '""')}"`,
          `"${(p.studioName || '').replace(/"/g, '""')}"`,
          `"${(p.assignedEditorName || 'Unassigned').replace(/"/g, '""')}"`,
          `"${p.shootDate || 'N/A'}"`,
          `"${p.deliveryDate || 'N/A'}"`,
          `"${(p.status || '').toUpperCase()}"`,
          p.projectAmount || 0,
          advance,
          pending,
          p.editorPayment || 0,
          p.otherExpenses || 0,
          expensesSum,
          p.profit,
          p.margin.toFixed(2)
        ];
      });

      // Aggregate Summary Totals Row
      const totalRevenue = projectsWithProfit.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
      const totalAdvance = projectsWithProfit.reduce((sum, p) => sum + (p.advancePayment || 0), 0);
      const totalPending = projectsWithProfit.reduce((sum, p) => sum + (p.remainingBalance !== undefined ? p.remainingBalance : Math.max(0, (p.projectAmount || 0) - (p.advancePayment || 0))), 0);
      const totalEditor = projectsWithProfit.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
      const totalOther = projectsWithProfit.reduce((sum, p) => sum + (p.otherExpenses || 0), 0);
      const totalCosts = totalEditor + totalOther;
      const totalProfit = totalRevenue - totalCosts;
      const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : '0.00';

      const totalsRow = [
        '"TOTAL / PORTFOLIO AGGREGATE"',
        `"Total Campaigns: ${projectsWithProfit.length}"`,
        '""',
        '""',
        '""',
        '""',
        '""',
        totalRevenue,
        totalAdvance,
        totalPending,
        totalEditor,
        totalOther,
        totalCosts,
        totalProfit,
        avgMargin
      ];

      const csvContent = [
        '# THE FRAME CUT STUDIO - EXECUTIVE PROFITABILITY AUDIT & TREND REPORT',
        `# Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        `# Accounting Purpose: Profitability Trends, Production Ledger Reconciliation & Tax Audit`,
        `# Total Gross Revenue: INR ${totalRevenue} | Total Production Outflows: INR ${totalCosts} | Net Profit: INR ${totalProfit} | Portfolio Margin: ${avgMargin}%`,
        '',
        headers.join(','),
        ...rows.map(r => r.join(',')),
        '',
        totalsRow.join(',')
      ].join('\r\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Profitability_Trend_Audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCsvExported(true);
      setTimeout(() => setCsvExported(false), 2500);
    } catch (err) {
      console.error('Error generating CSV:', err);
    } finally {
      setCsvExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Total financial calculations
      const totalRevenue = projects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
      const totalEditorExpenses = projects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
      const totalOtherExpenses = projects.reduce((sum, p) => sum + (p.otherExpenses || 0), 0);
      const totalLedgerExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalExpenses = totalEditorExpenses + totalOtherExpenses + totalLedgerExpenses;
      const totalProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      let currentY = 20;

      // Header Brand
      doc.setFillColor(26, 58, 42); // deep forest green
      doc.rect(0, 0, 210, 38, 'F');

      doc.setTextColor(212, 175, 55); // gold
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('THE FRAME CUT STUDIO', 15, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('STUDIO OPERATING SYSTEM • EXECUTIVE AUDIT REPORT', 15, 22);

      // Date & Metadata right-aligned
      const reportDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated: ${reportDate}`, 195, 16, { align: 'right' });
      doc.text('Auditor Access: Administrator', 195, 22, { align: 'right' });
      doc.text('Database Connection: Firestore Realtime', 195, 28, { align: 'right' });

      currentY = 48;

      // SECTION 1: EXECUTIVE FINANCIAL SUMMARY
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 42);
      doc.text('I. EXECUTIVE FINANCIAL SUMMARY', 15, currentY);
      
      // Draw a line under heading
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 8;

      // Draw 4 bento-style cards for financial metrics
      // Box 1: Gross Bookings
      doc.setFillColor(245, 247, 245);
      doc.rect(15, currentY, 85, 22, 'F');
      doc.setDrawColor(230, 235, 230);
      doc.rect(15, currentY, 85, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 100);
      doc.text('GROSS BOOKINGS (REVENUE)', 19, currentY + 6);
      doc.setFontSize(14);
      doc.setTextColor(26, 58, 42);
      doc.text(`INR ${totalRevenue.toLocaleString('en-IN')}`, 19, currentY + 15);

      // Box 2: Yield Net Profit
      doc.setFillColor(245, 247, 245);
      doc.rect(110, currentY, 85, 22, 'F');
      doc.rect(110, currentY, 85, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 100);
      doc.text('YIELD NET PROFIT', 114, currentY + 6);
      doc.setFontSize(14);
      doc.setTextColor(184, 149, 48); // gold
      doc.text(`INR ${totalProfit.toLocaleString('en-IN')}`, 114, currentY + 15);

      currentY += 26;

      // Box 3: Total Expenses
      doc.setFillColor(245, 247, 245);
      doc.rect(15, currentY, 85, 22, 'F');
      doc.rect(15, currentY, 85, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 100);
      doc.text('TOTAL AUDITED EXPENSES', 19, currentY + 6);
      doc.setFontSize(14);
      doc.setTextColor(180, 50, 50); // Red-ish
      doc.text(`INR ${totalExpenses.toLocaleString('en-IN')}`, 19, currentY + 15);

      // Box 4: Margin %
      doc.setFillColor(245, 247, 245);
      doc.rect(110, currentY, 85, 22, 'F');
      doc.rect(110, currentY, 85, 22, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 110, 100);
      doc.text('NET OPERATING MARGIN', 114, currentY + 6);
      doc.setFontSize(14);
      doc.setTextColor(26, 58, 42);
      doc.text(`${profitMargin.toFixed(1)}%`, 114, currentY + 15);

      currentY += 34;

      // SECTION 2: ALLIANCE PERFORMANCE & OUTCOMES
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 42);
      doc.text('II. ALLIANCE PERFORMANCE & OUTCOMES', 15, currentY);
      
      doc.setDrawColor(212, 175, 55);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 8;

      // Top Allied Studio details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(34, 34, 34);
      doc.text('TOP ALLIED STUDIO PARTNER:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${topStudioEntry.name} (INR ${topStudioEntry.sales.toLocaleString('en-IN')} cumulative contract value)`, 75, currentY);
      currentY += 6;

      // Top Editor
      doc.setFont('helvetica', 'bold');
      doc.text('TOP PRODUCTIVE TEAM EDITOR:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(`${topEditorEntry.name} (${topEditorEntry.count} completed wedding films delivered)`, 75, currentY);
      currentY += 6;

      // Lucrative Campaign
      doc.setFont('helvetica', 'bold');
      doc.text('MOST LUCRATIVE WEDDING:', 15, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(mostProfitableProj ? `${mostProfitableProj.coupleName} (Net Profit: INR ${mostProfitableProj.profit.toLocaleString('en-IN')}, Margin: ${mostProfitableProj.margin.toFixed(0)}%)` : 'None', 75, currentY);
      
      currentY += 14;

      // SECTION 3: OPERATING EXPENSE BREAKDOWN
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 42);
      doc.text('III. OPERATING EXPENSE ALLOCATION BREAKDOWN', 15, currentY);
      doc.setDrawColor(212, 175, 55);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 8;

      // Table Header for Expenses
      doc.setFillColor(240, 243, 240);
      doc.rect(15, currentY, 180, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(26, 58, 42);
      doc.text('EXPENSE CATEGORY (DESCRIPTION)', 20, currentY + 4.5);
      doc.text('CUMULATIVE CHARGED AMOUNT (INR)', 190, currentY + 4.5, { align: 'right' });
      currentY += 7;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(8.5);

      expenseAllocationData.forEach((item, index) => {
        // Draw alternate rows
        if (index % 2 === 1) {
          doc.setFillColor(250, 251, 250);
          doc.rect(15, currentY, 180, 6, 'F');
        }
        doc.text(item.name, 20, currentY + 4.2);
        doc.text(`INR ${item.value.toLocaleString('en-IN')}`, 190, currentY + 4.2, { align: 'right' });
        currentY += 6;
      });

      currentY += 10;

      // SECTION 4: DETAILED CAMPAIGN AUDITS (TABLE)
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('THE FRAME CUT STUDIO — SYSTEM REPORT (CONTINUED)', 15, 12);
        doc.setDrawColor(220, 220, 220);
        doc.line(15, 14, 195, 14);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(26, 58, 42);
      doc.text('IV. INDIVIDUAL CONTRACT MARGIN AUDIT SHEET', 15, currentY);
      doc.setDrawColor(212, 175, 55);
      doc.line(15, currentY + 2, 195, currentY + 2);
      currentY += 8;

      // Table Header for Projects Audit
      doc.setFillColor(26, 58, 42);
      doc.rect(15, currentY, 180, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('PROJECT ID', 18, currentY + 5.5);
      doc.text('WEDDING CAMPAIGN (STUDIO)', 42, currentY + 5.5);
      doc.text('CONTRACT', 105, currentY + 5.5, { align: 'right' });
      doc.text('PAYOUTS', 135, currentY + 5.5, { align: 'right' });
      doc.text('NET PROFIT', 165, currentY + 5.5, { align: 'right' });
      doc.text('MARGIN %', 190, currentY + 5.5, { align: 'right' });
      currentY += 8;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(34, 34, 34);

      projectsWithProfit.forEach((proj, idx) => {
        // Page break logic for each row
        if (currentY > 275) {
          doc.addPage();
          currentY = 20;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text('THE FRAME CUT STUDIO — MARGIN AUDIT SHEET (CONTINUED)', 15, 12);
          doc.setDrawColor(220, 220, 220);
          doc.line(15, 14, 195, 14);
          currentY = 25;

          // Re-draw table header on new page
          doc.setFillColor(26, 58, 42);
          doc.rect(15, currentY, 180, 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.text('PROJECT ID', 18, currentY + 5.5);
          doc.text('WEDDING CAMPAIGN (STUDIO)', 42, currentY + 5.5);
          doc.text('CONTRACT', 105, currentY + 5.5, { align: 'right' });
          doc.text('PAYOUTS', 135, currentY + 5.5, { align: 'right' });
          doc.text('NET PROFIT', 165, currentY + 5.5, { align: 'right' });
          doc.text('MARGIN %', 190, currentY + 5.5, { align: 'right' });
          currentY += 8;
        }

        // Row background
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 248);
          doc.rect(15, currentY, 180, 7.5, 'F');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(15, currentY, 180, 7.5, 'F');
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(184, 149, 48); // Gold for ID
        doc.text(proj.id, 18, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(34, 34, 34);
        doc.text(proj.coupleName, 42, currentY + 3.8);
        doc.setFontSize(6.5);
        doc.setTextColor(120, 120, 120);
        doc.text(proj.studioName, 42, currentY + 6.5);

        doc.setFontSize(7.5);
        doc.setTextColor(34, 34, 34);
        doc.text(`INR ${proj.projectAmount.toLocaleString('en-IN')}`, 105, currentY + 5, { align: 'right' });
        const expensesSum = proj.editorPayment + proj.otherExpenses;
        doc.text(`INR ${expensesSum.toLocaleString('en-IN')}`, 135, currentY + 5, { align: 'right' });
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 58, 42); // deep green
        doc.text(`INR ${proj.profit.toLocaleString('en-IN')}`, 165, currentY + 5, { align: 'right' });
        
        doc.setTextColor(184, 149, 48); // Gold margin
        doc.text(`${proj.margin.toFixed(1)}%`, 190, currentY + 5, { align: 'right' });

        currentY += 7.5;
      });

      // Footer
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      currentY += 10;
      doc.setDrawColor(220, 220, 220);
      doc.line(15, currentY, 195, currentY);
      currentY += 6;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('This is a computer-generated luxury management accounting audit sheet. Confirmed via Studio OS Secure Database.', 15, currentY);
      doc.text('THE FRAME CUT STUDIO © 2026. ALL RIGHTS RESERVED.', 195, currentY, { align: 'right' });

      // Save PDF
      doc.save(`The_Frame_Cut_Studio_Operating_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">System Reports & Margin Audits</h2>
          <p className="text-xs text-gray-400 mt-1">Durable financial ledgers, studio conversions, and editor volumes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={csvExporting}
            id="export-profitability-csv-btn"
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-950/80 to-luxury-green-900/90 hover:from-emerald-900 hover:to-luxury-green-800 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-mono text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-black/20"
          >
            {csvExported ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">CSV DOWNLOADED</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>{csvExporting ? 'EXPORTING CSV...' : 'EXPORT TO CSV'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            id="download-pdf-report-btn"
            className="px-4 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-900 hover:from-luxury-green-700 hover:to-luxury-green-800 border border-gold-500/30 text-gold-400 hover:text-gold-300 font-mono text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-black/20"
          >
            <FileDown className="w-4 h-4" />
            {isGenerating ? 'GENERATING PDF...' : 'DOWNLOAD PDF REPORT'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Studio card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-green-800/10 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-mono uppercase">Top Allied Studio</span>
            <div className="p-2 bg-luxury-green-950 rounded-xl">
              <Building2 className="w-4 h-4 text-gold-400" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white font-display leading-tight">{topStudioEntry.name}</h4>
            <p className="text-[10px] text-gold-400 font-mono mt-1">₹{topStudioEntry.sales.toLocaleString('en-IN')} Cumulative volume</p>
          </div>
        </div>

        {/* Top Editor card */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden flex flex-col justify-between h-40">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-xs font-mono uppercase">Top Productive Editor</span>
            <div className="p-2 bg-charcoal-900 rounded-xl">
              <UserCheck className="w-4 h-4 text-gold-400" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white font-display leading-tight">{topEditorEntry.name}</h4>
            <p className="text-[10px] text-gray-400 font-mono mt-1">{topEditorEntry.count} wedding films delivered</p>
          </div>
        </div>

        {/* Most Profitable wedding card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-luxury-green-950/40 to-charcoal-900 border border-gold-500/30 relative overflow-hidden flex flex-col justify-between h-40 gold-glow">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/10 rounded-full blur-xl" />
          <div className="flex justify-between items-start">
            <span className="text-gold-300 text-xs font-mono uppercase">Most Lucrative Engagement</span>
            <div className="p-2 bg-gold-500/10 rounded-xl">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white font-display leading-tight truncate">
              {mostProfitableProj ? mostProfitableProj.coupleName : 'None'}
            </h4>
            <p className="text-[10px] text-gold-400 font-mono mt-1">
              ₹{mostProfitableProj ? mostProfitableProj.profit.toLocaleString('en-IN') : 0} Margin ({mostProfitableProj ? mostProfitableProj.margin.toFixed(0) : 0}%)
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Charts block */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Margin Distribution chart */}
        <div className="p-6 rounded-3xl glass-panel relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold font-display text-white">Profit margins per campaign</h3>
              <p className="text-xs text-gray-400 mt-1">Contract gross values versus company profit cuts</p>
            </div>
            <button
              onClick={handleExportCSV}
              title="Export margin trends to CSV"
              className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          </div>

          <SafeChartContainer height={288} minHeight={240}>
            {profitMarginTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={288} minWidth={100}>
                <LineChart data={profitMarginTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 85, 70, 0.05)" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#0e131b] border border-gold-500/40 p-3.5 rounded-2xl text-xs font-mono text-gray-200 shadow-2xl space-y-2.5 min-w-[240px] backdrop-blur-xl">
                            <div className="flex items-start justify-between border-b border-white/10 pb-2 gap-2">
                              <div>
                                <span className="font-bold text-white text-xs block font-display tracking-wide">{data.fullName || data.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono block">{data.studio} • {data.id}</span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                                data.margin >= 50 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                  : data.margin >= 30 
                                  ? 'bg-gold-500/20 text-gold-300 border-gold-500/40' 
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              }`}>
                                {data.margin ? Number(data.margin).toFixed(1) : '0'}% Margin
                              </span>
                            </div>

                            <div className="space-y-1.5 text-[11px]">
                              <div className="flex justify-between items-center text-emerald-400">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                  <span>Contract Gross Value:</span>
                                </span>
                                <span className="font-bold">₹{Number(data.Amount || 0).toLocaleString('en-IN')}</span>
                              </div>

                              <div className="flex justify-between items-center text-rose-400">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                                  <span>Production Costs:</span>
                                </span>
                                <span className="font-bold">₹{Number(data.Expenses || 0).toLocaleString('en-IN')}</span>
                              </div>

                              {data.editorPayment > 0 && (
                                <div className="flex justify-between items-center text-gray-400 pl-3.5 text-[10px]">
                                  <span>↳ Editor Payout:</span>
                                  <span>₹{Number(data.editorPayment).toLocaleString('en-IN')}</span>
                                </div>
                              )}

                              {data.otherExpenses > 0 && (
                                <div className="flex justify-between items-center text-gray-400 pl-3.5 text-[10px]">
                                  <span>↳ Other Expenses:</span>
                                  <span>₹{Number(data.otherExpenses).toLocaleString('en-IN')}</span>
                                </div>
                              )}

                              <div className="border-t border-white/10 pt-2 flex justify-between items-center text-gold-300 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-gold-400" />
                                  <span>Net Operating Profit:</span>
                                </span>
                                <span className="text-xs">₹{Number(data.Profit || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="Amount" stroke="#1e5546" strokeWidth={3} activeDot={{ r: 8 }} name="Contract value" />
                  <Line type="monotone" dataKey="Profit" stroke="#d4af37" strokeWidth={3} name="Operating Profit" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs">No project margin history log.</div>
            )}
          </SafeChartContainer>
        </div>

        {/* Expense categories allocation pie chart */}
        <div className="p-6 rounded-3xl glass-panel relative">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Operating expense allocations</h3>
            <p className="text-xs text-gray-400 mb-6">Category shares including freelance payouts & offices</p>
          </div>

          <div className="h-72 flex flex-col md:flex-row items-center justify-between">
            <SafeChartContainer height={288} minHeight={240} className="w-full md:w-1/2">
              {expenseAllocationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={288} minWidth={100}>
                  <PieChart>
                    <Pie
                      data={expenseAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0e131b] border border-gold-500/40 p-3.5 rounded-2xl text-xs font-mono text-gray-200 shadow-2xl space-y-2 min-w-[210px] backdrop-blur-xl">
                              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                                <span className="font-bold text-white text-xs">{data.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-300 font-bold">
                                  {data.sharePct}% share
                                </span>
                              </div>

                              <div className="space-y-1.5 text-[11px]">
                                <div className="flex justify-between items-center text-gray-300">
                                  <span>Allocated Expense:</span>
                                  <span className="font-bold text-emerald-400 text-xs">
                                    ₹{Number(data.value || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-gray-400 text-[10px] pt-1 border-t border-white/5">
                                  <span>Total Outflow Pool:</span>
                                  <span className="text-gray-200 font-mono">₹{totalExpenseSum.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 font-mono text-xs">No recorded expense ledger.</div>
              )}
            </SafeChartContainer>

            <div className="w-full md:w-1/2 space-y-2 mt-4 md:mt-0 font-mono text-[11px] text-gray-400 max-h-[220px] overflow-y-auto">
              {expenseAllocationData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-gray-200 font-bold">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed campaign audits list */}
      <div className="p-6 rounded-3xl glass-panel">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold font-display text-white">Engagement Margin Audit Sheet</h3>
            <p className="text-xs text-gray-400 mt-1">Individual contract accounting audits for tax seasons</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={csvExporting}
            className="px-3 py-1.5 bg-luxury-green-950/70 hover:bg-luxury-green-900 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 font-mono text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXPORT AUDIT CSV</span>
          </button>
        </div>

        <div className="rounded-2xl border border-luxury-green-800/10 overflow-hidden bg-charcoal-950/20 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-charcoal-900 text-gray-400 font-mono text-[10px] uppercase border-b border-luxury-green-800/20">
                  <th className="p-4">Project ID</th>
                  <th className="p-4">Wedding Campaign</th>
                  <th className="p-4">Contract Price</th>
                  <th className="p-4">Assigned Payouts</th>
                  <th className="p-4">Net Season Profits</th>
                  <th className="p-4 pr-6 text-right">Net Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-green-800/10 font-sans text-gray-300">
                {projectsWithProfit.map((proj) => {
                  const expensesSum = proj.editorPayment + proj.otherExpenses;
                  return (
                    <tr key={proj.id} className="hover:bg-luxury-green-950/10">
                      <td className="p-4 font-mono text-gold-500 text-xs">{proj.id}</td>
                      <td className="p-4">
                        <span className="font-bold text-gray-200 block">{proj.coupleName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{proj.studioName}</span>
                      </td>
                      <td className="p-4 font-mono">₹{proj.projectAmount.toLocaleString('en-IN')}</td>
                      <td className="p-4 font-mono text-red-400">₹{expensesSum.toLocaleString('en-IN')}</td>
                      <td className="p-4 font-mono text-emerald-400 font-bold">₹{proj.profit.toLocaleString('en-IN')}</td>
                      <td className="p-4 pr-6 text-right font-mono font-bold text-gold-400">{proj.margin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
