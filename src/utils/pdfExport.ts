import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

/**
 * Converts modern color strings (oklab, oklch, color-mix, color(srgb...)) to RGB/Hex using browser canvas context
 */
export function convertColorToRgb(colorStr: string): string {
  if (!colorStr) return '#ffffff';
  if (!colorStr.includes('oklab') && !colorStr.includes('oklch') && !colorStr.includes('color(') && !colorStr.includes('color-mix') && !colorStr.includes('light-dark')) {
    return colorStr;
  }
  
  const clean = colorStr.trim();
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = clean;
      const res = ctx.fillStyle;
      if (res && res !== '#000000' && !res.includes('oklab') && !res.includes('oklch') && !res.includes('color(')) {
        return res;
      }
    }
  } catch (e) {
    // fallback
  }

  const lower = clean.toLowerCase();
  if (lower.includes('amber') || lower.includes('gold') || lower.includes('yellow') || lower.includes('245') || lower.includes('217')) {
    return '#f59e0b';
  }
  if (lower.includes('emerald') || lower.includes('green') || lower.includes('16') || lower.includes('185')) {
    return '#10b981';
  }
  if (lower.includes('rose') || lower.includes('red') || lower.includes('239')) {
    return '#ef4444';
  }
  if (lower.includes('white') || lower.includes('255')) {
    return '#ffffff';
  }
  if (lower.includes('slate') || lower.includes('dark') || lower.includes('19') || lower.includes('20')) {
    return '#131417';
  }

  return '#94a3b8';
}

/**
 * Sanitizes CSS text string by replacing oklab, oklch, color-mix and light-dark functions
 */
export function sanitizeCssText(cssText: string): string {
  if (!cssText) return '';
  let sanitized = cssText;

  // Replace modern functions
  for (let i = 0; i < 3; i++) {
    if (!sanitized.includes('color-mix') && !sanitized.includes('oklab') && !sanitized.includes('oklch') && !sanitized.includes('light-dark') && !sanitized.includes('color(srgb')) {
      break;
    }
    sanitized = sanitized
      .replace(/color-mix\s*\([^;}]*\)/gi, 'rgba(245, 158, 11, 0.15)')
      .replace(/oklab\s*\([^;}]*\)/gi, (m) => convertColorToRgb(m))
      .replace(/oklch\s*\([^;}]*\)/gi, (m) => convertColorToRgb(m))
      .replace(/color\s*\(\s*srgb[^;}]*\)/gi, (m) => convertColorToRgb(m))
      .replace(/light-dark\s*\([^;}]*\)/gi, '#ffffff');
  }

  return sanitized
    .replace(/oklab/gi, 'rgb')
    .replace(/oklch/gi, 'rgb');
}

/**
 * Sanitizes a cloned DOM document to prevent html2canvas crashing on oklab/oklch colors
 */
export function sanitizeClonedDocForHtml2Canvas(clonedDoc: Document, clonedElement?: HTMLElement) {
  // 1. Sanitize all <style> tags in the cloned document
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((style) => {
    if (style.textContent) {
      style.textContent = sanitizeCssText(style.textContent);
    }
  });

  // 2. Walk all elements in the cloned document and replace any inline or computed style containing oklch/oklab
  const root = clonedElement || clonedDoc.body;
  if (root) {
    const allElements = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];
    const colorProps = [
      'color',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderRightColor',
      'outlineColor',
      'fill',
      'stroke',
      'boxShadow',
      'textShadow'
    ];

    allElements.forEach((el) => {
      try {
        const inlineStyle = el.getAttribute('style');
        if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('oklab') || inlineStyle.includes('color('))) {
          el.setAttribute('style', sanitizeCssText(inlineStyle));
        }

        const computed = window.getComputedStyle(el);
        colorProps.forEach((prop) => {
          const val = (computed as any)[prop];
          if (val && typeof val === 'string') {
            if (val.includes('oklab') || val.includes('oklch') || val.includes('color(') || val.includes('color-mix') || val.includes('light-dark')) {
              (el.style as any)[prop] = convertColorToRgb(val);
            }
          }
        });
      } catch (err) {
        // ignore
      }
    });
  }
}

/**
 * Robustly captures an HTML element to Canvas using html2canvas-pro with exact styles & responsive resolution
 */
export async function captureElementToCanvas(element: HTMLElement, options: {
  backgroundColor?: string;
  scale?: number;
} = {}): Promise<HTMLCanvasElement> {
  const bg = options.backgroundColor || '#131417';
  const scale = options.scale || 2.5;
  const targetWidth = Math.max(element.scrollWidth || 0, element.offsetWidth || 0, 850);

  return await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: bg,
    scrollY: 0,
    scrollX: 0,
    windowWidth: 1280,
    windowHeight: 1800,
    width: targetWidth,
    onclone: (clonedDoc, clonedElement) => {
      // 1. Ensure all head styles and stylesheets are preserved and synced
      const headStyles = document.querySelectorAll('style, link[rel="stylesheet"]');
      headStyles.forEach((styleNode) => {
        if (!clonedDoc.head.contains(styleNode)) {
          clonedDoc.head.appendChild(styleNode.cloneNode(true));
        }
      });

      // 2. Normalize cloned element container geometry
      if (clonedElement) {
        clonedElement.style.width = `${targetWidth}px`;
        clonedElement.style.minWidth = `${targetWidth}px`;
        clonedElement.style.maxWidth = `${targetWidth}px`;
        clonedElement.style.height = 'auto';
        clonedElement.style.maxHeight = 'none';
        clonedElement.style.overflow = 'visible';
        clonedElement.style.opacity = '1';
        clonedElement.style.visibility = 'visible';
        clonedElement.style.display = 'block';
        clonedElement.style.position = 'relative';
        clonedElement.style.left = '0';
        clonedElement.style.top = '0';
        clonedElement.style.transform = 'none';
        clonedElement.style.boxSizing = 'border-box';

        // Normalize parent nodes
        let parent = clonedElement.parentElement;
        while (parent && parent !== clonedDoc.body) {
          parent.style.position = 'relative';
          parent.style.left = '0';
          parent.style.top = '0';
          parent.style.opacity = '1';
          parent.style.visibility = 'visible';
          parent.style.display = 'block';
          parent.style.width = `${targetWidth}px`;
          parent.style.transform = 'none';
          parent = parent.parentElement;
        }

        if (clonedDoc.body) {
          clonedDoc.body.style.opacity = '1';
          clonedDoc.body.style.visibility = 'visible';
          clonedDoc.body.style.backgroundColor = bg;
          clonedDoc.body.style.margin = '0';
          clonedDoc.body.style.padding = '0';
        }
      }
    }
  });
}

/**
 * Creates a pixel-perfect A4 PDF directly from the rendered invoice HTML element
 */
export async function generateInvoicePdfFromElement(
  element: HTMLElement,
  fileName: string,
  options: {
    backgroundColor?: string;
    scale?: number;
  } = {}
): Promise<{ pdf: jsPDF; fileName: string; file: File }> {
  const bg = options.backgroundColor || '#131417';
  const canvas = await captureElementToCanvas(element, {
    backgroundColor: bg,
    scale: options.scale || 2.2
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Background fill matching theme to avoid white edges
  if (bg === '#ffffff' || bg === 'white') {
    pdf.setFillColor(255, 255, 255);
  } else {
    pdf.setFillColor(19, 20, 23);
  }
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Calculate dimensions
  let imgWidth = pageWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  // If slightly larger than 1 page (up to ~315mm), fit smoothly onto single A4 page
  if (imgHeight > pageHeight && imgHeight <= 315) {
    const scaleRatio = pageHeight / imgHeight;
    imgWidth = pageWidth * scaleRatio;
    imgHeight = pageHeight;
    const xOffset = (pageWidth - imgWidth) / 2;
    pdf.addImage(imgData, 'PNG', xOffset, 0, imgWidth, imgHeight, undefined, 'FAST');
  } else if (imgHeight <= pageHeight) {
    // Fits single page perfectly
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    // Multi-page overflow
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      if (bg === '#ffffff' || bg === 'white') {
        pdf.setFillColor(255, 255, 255);
      } else {
        pdf.setFillColor(19, 20, 23);
      }
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }
  }

  const pdfBlob = pdf.output('blob');
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  return { pdf, fileName, file };
}

export interface GstInvoiceData {
  invoiceNo?: string;
  issuedDate?: string;
  dueDate?: string;
  invoiceStatus?: string;
  supplier?: {
    name?: string;
    pan?: string;
    address?: string;
    phone?: string;
    email?: string;
    state?: string;
  };
  buyer?: {
    name?: string;
    ownerName?: string;
    pan?: string;
    address?: string;
    phone?: string;
    email?: string;
    state?: string;
  };
  placeOfSupply?: string;
  reverseCharge?: boolean;
  items?: Array<{
    id?: string;
    description: string;
    subDescription?: string;
    sacCode?: string;
    unitRate?: number;
    quantity?: number;
    amount?: number;
  }>;
  taxableAmount?: number;
  gstEnabled?: boolean;
  showTaxMatrix?: boolean;
  gstRate?: number;
  gstTaxType?: 'intra' | 'inter';
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalGstAmount?: number;
  grossTotal?: number;
  previousBalance?: number;
  advanceTotal?: number;
  advancePayments?: Array<{
    id?: string;
    date?: string;
    paidBy?: string;
    paymentMode?: string;
    amount?: number;
    referenceNo?: string;
    notes?: string;
    adjusted?: boolean;
  }>;
  discount?: number;
  totalPayable?: number;
  amountInWords?: string;
  bankDetails?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  termsBadgeText?: string;
  templateLayout?: 'minimal' | 'professional';
  qrCodeUrl?: string;
  qrCodeLabel?: string;
  signatureImageUrl?: string;
  signatureSignatoryName?: string;
  showSignature?: boolean;
}

/**
 * Robustly triggers download of a jsPDF document across standard browsers, sandboxed iframes, and mobile devices
 */
export function saveOrDownloadPdf(pdf: jsPDF, fileName: string): { success: boolean; blobUrl: string; blob: Blob } {
  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const pdfBlob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  let downloadTriggered = false;

  // Primary Action: Built-in jsPDF file saver
  try {
    pdf.save(safeFileName);
    downloadTriggered = true;
  } catch (saveErr) {
    console.warn('pdf.save notice:', saveErr);
  }

  // Secondary Action: Programmatic Blob anchor download
  try {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFileName;
    link.setAttribute('download', safeFileName);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.position = 'fixed';
    link.style.left = '-9999px';
    link.style.opacity = '0';
    document.body.appendChild(link);
    
    if (typeof link.click === 'function') {
      link.click();
      downloadTriggered = true;
    } else {
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      link.dispatchEvent(evt);
      downloadTriggered = true;
    }

    setTimeout(() => {
      try {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      } catch (e) {}
    }, 1000);
  } catch (err) {
    console.warn('Blob anchor click notice:', err);
  }

  // Strategy 3: Data URI fallback for strict environments
  if (!downloadTriggered) {
    try {
      const dataUri = pdf.output('datauristring');
      const dataLink = document.createElement('a');
      dataLink.href = dataUri;
      dataLink.download = safeFileName;
      dataLink.setAttribute('download', safeFileName);
      dataLink.style.position = 'fixed';
      dataLink.style.left = '-9999px';
      dataLink.style.opacity = '0';
      document.body.appendChild(dataLink);
      dataLink.click();
      setTimeout(() => {
        try {
          if (dataLink.parentNode) {
            document.body.removeChild(dataLink);
          }
        } catch (e) {}
      }, 1000);
      downloadTriggered = true;
    } catch (e3) {
      console.warn('DataURI fallback notice:', e3);
    }
  }

  // Strategy 4: If inside an iframe or browser blocks popup/download, open blob in tab or trigger window.print
  if (!downloadTriggered) {
    try {
      window.open(blobUrl, '_blank');
      downloadTriggered = true;
    } catch (openErr) {
      console.warn('window.open notice:', openErr);
    }
  }

  return { success: downloadTriggered, blobUrl, blob: pdfBlob };
}

/**
 * Generates a clean, sharp vector PDF for GST Invoices (immune to HTML/CSS rendering glitches)
 */
export function generateVectorGstInvoicePdf(data: GstInvoiceData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  // Safe defaults
  const supplier = {
    name: data.supplier?.name || 'THE FRAME CUT STUDIO',
    pan: data.supplier?.pan || 'ABCDE1234F',
    address: data.supplier?.address || 'Film Nagar, Media Studio Complex',
    phone: data.supplier?.phone || '+91 98765 43210',
    email: data.supplier?.email || 'accounts@theframecutstudio.com',
    state: data.supplier?.state || 'Delhi (07)'
  };

  const buyer = {
    name: data.buyer?.name || 'Valued Studio Partner',
    ownerName: data.buyer?.ownerName || '',
    pan: data.buyer?.pan || 'N/A',
    address: data.buyer?.address || '',
    phone: data.buyer?.phone || 'N/A',
    email: data.buyer?.email || '',
    state: data.buyer?.state || 'Delhi (07)'
  };

  const bank = {
    accountHolder: data.bankDetails?.accountHolder || 'The Frame Cut Studio',
    bankName: data.bankDetails?.bankName || 'ICICI Bank',
    accountNumber: data.bankDetails?.accountNumber || '123456789012',
    ifscCode: data.bankDetails?.ifscCode || 'ICIC0001234',
    upiId: data.bankDetails?.upiId || 'studio@upi'
  };

  const invoiceNo = data.invoiceNo || 'INV-001';
  const issuedDate = data.issuedDate || new Date().toISOString().split('T')[0];
  const dueDate = data.dueDate || 'On Receipt';
  const placeOfSupply = data.placeOfSupply || 'Delhi (07)';
  const statusStr = (data.invoiceStatus || 'PENDING').toUpperCase();
  const items = data.items && data.items.length > 0 ? data.items : [
    { description: 'Cinematic Wedding Video & Photo Editing Services', sacCode: '998314', unitRate: data.taxableAmount || 0, quantity: 1, amount: data.taxableAmount || 0 }
  ];
  const taxableAmount = Number(data.taxableAmount || 0);
  const gstEnabled = !!data.gstEnabled;
  const gstRate = Number(data.gstRate || 18);
  const gstTaxType = data.gstTaxType || 'intra';
  const cgstAmount = Number(data.cgstAmount || 0);
  const sgstAmount = Number(data.sgstAmount || 0);
  const igstAmount = Number(data.igstAmount || 0);
  const totalGstAmount = Number(data.totalGstAmount || 0);
  const previousBalance = Number(data.previousBalance || 0);
  const advanceTotal = Number(data.advanceTotal || 0);
  const discount = Number(data.discount || 0);
  const totalPayable = Number(data.totalPayable ?? (taxableAmount + totalGstAmount + previousBalance - advanceTotal - discount));
  const amountInWords = data.amountInWords || 'Zero Rupees Only';
  const advancePayments = data.advancePayments || [];
  const isMinimal = data.templateLayout === 'minimal';

  // Dark modern background
  doc.setFillColor(19, 20, 23);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  if (isMinimal) {
    // ================= MINIMAL PDF TEMPLATE =================
    // Minimalist Header Bar
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.5);
    doc.line(margin, 10, pageWidth - margin, 10);

    // Left: Minimal Studio Title
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(gstEnabled ? 'GST INVOICE • MINIMAL' : 'INVOICE • MINIMAL', margin, 16);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(supplier.name, margin, 23);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`PAN: ${supplier.pan}   |   ${supplier.state}   |   Ph: ${supplier.phone}`, margin, 29);
    doc.text(`${supplier.address.substring(0, 75)}`, margin, 34);

    // Right: Invoice Meta & Status
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceNo, pageWidth - margin, 17, { align: 'right' });

    if (statusStr === 'PAID') {
      doc.setFillColor(16, 185, 129);
    } else if (statusStr === 'OVERDUE') {
      doc.setFillColor(239, 68, 68);
    } else {
      doc.setFillColor(245, 158, 11);
    }
    doc.roundedRect(pageWidth - margin - 22, 20, 22, 4.5, 1, 1, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(statusStr, pageWidth - margin - 11, 23.2, { align: 'center' });

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${issuedDate}   |   Due: ${dueDate}`, pageWidth - margin, 30, { align: 'right' });
    doc.text(`Place of Supply: ${placeOfSupply}`, pageWidth - margin, 35, { align: 'right' });

    // Minimal Client Recipient Line
    let y = 42;
    doc.setFillColor(25, 27, 33);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('BILLED TO:', margin + 4, y + 5);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text(buyer.name, margin + 22, y + 5);

    if (buyer.ownerName) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`(Attn: ${buyer.ownerName})`, margin + 22 + doc.getTextWidth(buyer.name) + 2, y + 5);
    }

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`PAN: ${buyer.pan}   |   Ph: ${buyer.phone}   |   ${buyer.address}`.substring(0, 85), margin + 4, y + 10.5);

    // Minimal Items Table Header
    y += 18;
    doc.setFillColor(35, 38, 48);
    doc.rect(margin, y, contentWidth, 6.5, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('#', margin + 3, y + 4.5);
    doc.text('ITEM & SERVICE DESCRIPTION', margin + 10, y + 4.5);
    doc.text('SAC', margin + 110, y + 4.5, { align: 'center' });
    doc.text('RATE (Rs.)', margin + 138, y + 4.5, { align: 'right' });
    doc.text('QTY', margin + 154, y + 4.5, { align: 'center' });
    doc.text('AMOUNT (Rs.)', pageWidth - margin - 4, y + 4.5, { align: 'right' });

    y += 7.5;

    items.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(24, 26, 32);
        doc.rect(margin, y - 2, contentWidth, 6.5, 'F');
      }

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`${idx + 1}`, margin + 3, y + 2.5);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text((item.description || 'Service').substring(0, 55), margin + 10, y + 2.5);

      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text(item.sacCode || '998314', margin + 110, y + 2.5, { align: 'center' });
      doc.text(`Rs. ${Number(item.unitRate || 0).toLocaleString('en-IN')}`, margin + 138, y + 2.5, { align: 'right' });
      doc.text(`${item.quantity || 1}`, margin + 154, y + 2.5, { align: 'center' });

      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 2.5, { align: 'right' });

      y += 7;
    });

    y += 3;

    // Minimal Calculations & Summary Grid
    const leftW = 100;
    doc.setFillColor(24, 26, 32);
    doc.roundedRect(margin, y, leftW, 36, 2, 2, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SUMMARY & WORDS', margin + 4, y + 6);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    if (gstEnabled) {
      doc.text(`Taxable: Rs. ${taxableAmount.toLocaleString('en-IN')}  |  GST: Rs. ${totalGstAmount.toLocaleString('en-IN')} (${gstRate}%)`, margin + 4, y + 13);
    } else {
      doc.text(`Taxable Subtotal: Rs. ${taxableAmount.toLocaleString('en-IN')}`, margin + 4, y + 13);
    }

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('AMOUNT IN WORDS:', margin + 4, y + 23);
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'normal');
    doc.text(amountInWords.substring(0, 55), margin + 4, y + 29);

    // Right Net Block
    const rightX = margin + leftW + 4;
    const rightW = contentWidth - leftW - 4;

    doc.setFillColor(28, 31, 39);
    doc.roundedRect(rightX, y, rightW, 36, 2, 2, 'F');

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', rightX + 4, y + 6);
    doc.text(`Rs. ${taxableAmount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 6, { align: 'right' });

    if (gstEnabled) {
      doc.text(`GST (${gstRate}%):`, rightX + 4, y + 11);
      doc.text(`+ Rs. ${totalGstAmount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 11, { align: 'right' });
    }

    if (advanceTotal > 0) {
      doc.setTextColor(52, 211, 153);
      doc.text('Advance:', rightX + 4, y + 16);
      doc.text(`- Rs. ${advanceTotal.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 16, { align: 'right' });
    }

    if (discount > 0) {
      doc.setTextColor(248, 113, 113);
      doc.text('Discount:', rightX + 4, y + 21);
      doc.text(`- Rs. ${discount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 21, { align: 'right' });
    }

    // Net Total Bar
    doc.setFillColor(245, 158, 11);
    doc.roundedRect(rightX + 2, y + 25, rightW - 4, 8, 1.5, 1.5, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('NET PAYABLE:', rightX + 5, y + 30.5);
    doc.text(`Rs. ${totalPayable.toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 30.5, { align: 'right' });

    // Minimal Payment Strip
    y += 40;
    doc.setFillColor(24, 26, 32);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');

    doc.setTextColor(245, 158, 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT SETTLEMENT:', margin + 4, y + 5.5);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`UPI ID: ${bank.upiId}   |   Bank: ${bank.bankName} (${bank.accountHolder})`, margin + 4, y + 11);
    doc.text(`A/C No: ${bank.accountNumber}   |   IFSC: ${bank.ifscCode}`, margin + 4, y + 15.5);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.5);
    doc.text(`For ${supplier.name}`, pageWidth - margin - 4, y + 11, { align: 'right' });
    doc.text('Signatory', pageWidth - margin - 4, y + 15.5, { align: 'right' });

    return doc;
  }

  // ================= PROFESSIONAL PDF TEMPLATE =================
  // Header Container Card
  doc.setFillColor(28, 30, 36);
  doc.roundedRect(margin, 10, contentWidth, 38, 3, 3, 'F');

  // Left Supplier Box
  doc.setTextColor(245, 158, 11); // Amber
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(gstEnabled ? 'TAX INVOICE / GST BILL' : 'ORIGINAL INVOICE', margin + 5, 17);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(supplier.name, margin + 5, 23);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(supplier.address.substring(0, 70), margin + 5, 28);
  doc.text(`PAN: ${supplier.pan}   |   State: ${supplier.state}   |   Ph: ${supplier.phone}`, margin + 5, 33);
  doc.text(`Email: ${supplier.email}`, margin + 5, 38);

  // Right Invoice Meta
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoiceNo, pageWidth - margin - 5, 18, { align: 'right' });

  // Status Badge
  if (statusStr === 'PAID') {
    doc.setFillColor(16, 185, 129);
  } else if (statusStr === 'OVERDUE') {
    doc.setFillColor(239, 68, 68);
  } else {
    doc.setFillColor(245, 158, 11);
  }
  doc.roundedRect(pageWidth - margin - 28, 21, 23, 5, 1, 1, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(statusStr, pageWidth - margin - 16.5, 24.5, { align: 'center' });

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Issued: ${issuedDate}`, pageWidth - margin - 5, 31, { align: 'right' });
  doc.text(`Due: ${dueDate}`, pageWidth - margin - 5, 36, { align: 'right' });
  doc.text(`Place of Supply: ${placeOfSupply}`, pageWidth - margin - 5, 41, { align: 'right' });

  // Buyer Details Box
  let y = 52;
  doc.setFillColor(24, 26, 32);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO / RECIPIENT DETAILS:', margin + 5, y + 6);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(buyer.name, margin + 5, y + 12);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  if (buyer.address) {
    doc.text(buyer.address.substring(0, 80), margin + 5, y + 17);
  }
  doc.text(`Attn: ${buyer.ownerName || 'Accounts'} | Ph: ${buyer.phone} ${buyer.email ? '| ' + buyer.email : ''}`, margin + 5, y + 21);

  // Buyer Right column
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  if (buyer.pan && buyer.pan !== 'N/A') doc.text(`PAN: ${buyer.pan}`, pageWidth - margin - 5, y + 10, { align: 'right' });
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  if (buyer.state) doc.text(`State: ${buyer.state}`, pageWidth - margin - 5, y + 15, { align: 'right' });

  // Items Table
  y = 80;
  doc.setFillColor(245, 158, 11); // Amber Header
  doc.roundedRect(margin, y, contentWidth, 7, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('#', margin + 3, y + 5);
  doc.text('DESCRIPTION OF SERVICES', margin + 12, y + 5);
  doc.text('SAC CODE', margin + 105, y + 5, { align: 'center' });
  doc.text('RATE (Rs.)', margin + 135, y + 5, { align: 'right' });
  doc.text('QTY', margin + 152, y + 5, { align: 'center' });
  doc.text('AMOUNT (Rs.)', pageWidth - margin - 5, y + 5, { align: 'right' });

  y += 9;

  items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(26, 28, 35);
      doc.rect(margin, y - 2, contentWidth, 7, 'F');
    }

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${idx + 1}`, margin + 3, y + 3);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text((item.description || 'Service').substring(0, 50), margin + 12, y + 3);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(item.sacCode || '998314', margin + 105, y + 3, { align: 'center' });

    doc.text(`Rs. ${Number(item.unitRate || 0).toLocaleString('en-IN')}`, margin + 135, y + 3, { align: 'right' });
    doc.text(`${item.quantity || 1}`, margin + 152, y + 3, { align: 'center' });

    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${Number(item.amount || 0).toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 3, { align: 'right' });

    y += 7.5;
  });

  // Advance Payments Breakdown in Professional PDF
  if (advancePayments.length > 0) {
    y += 4;
    doc.setFillColor(6, 44, 34); // Deep Emerald
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');

    doc.setTextColor(52, 211, 153); // Emerald
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('2. ADVANCE PAYMENTS & ADJUSTMENTS', margin + 3, y + 4.8);
    doc.text(`Total Adjusted: Rs. ${advanceTotal.toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 4.8, { align: 'right' });

    y += 8;

    // Mini subheader for advance table
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 5, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', margin + 3, y + 3.5);
    doc.text('PAID BY / RECEIVED FROM', margin + 32, y + 3.5);
    doc.text('PAYMENT MODE', margin + 112, y + 3.5);
    doc.text('ADVANCE AMOUNT', pageWidth - margin - 5, y + 3.5, { align: 'right' });

    y += 6;

    advancePayments.forEach((adv, advIdx) => {
      if (advIdx % 2 === 0) {
        doc.setFillColor(24, 33, 47);
        doc.rect(margin, y - 2, contentWidth, 6, 'F');
      }

      doc.setTextColor(203, 213, 225);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(adv.date || issuedDate, margin + 3, y + 2.2);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text((adv.paidBy || 'Studio Partner').substring(0, 35), margin + 32, y + 2.2);

      doc.setTextColor(167, 139, 250);
      doc.setFont('helvetica', 'bold');
      doc.text(`[${adv.paymentMode || 'UPI'}]`, margin + 112, y + 2.2);

      doc.setTextColor(52, 211, 153);
      doc.setFont('helvetica', 'bold');
      doc.text(`- Rs. ${Number(adv.amount || 0).toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 2.2, { align: 'right' });

      y += 5.8;
    });
  }

  y += 3;

  // Bottom Summary Grid
  // Left: GST Matrix & Words
  const leftW = 100;
  doc.setFillColor(24, 26, 32);
  doc.roundedRect(margin, y, leftW, 40, 3, 3, 'F');

  if (gstEnabled && data.showTaxMatrix !== false) {
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`GST TAX MATRIX (${gstTaxType === 'intra' ? 'CGST + SGST @ ' + gstRate + '%' : 'IGST @ ' + gstRate + '%'})`, margin + 4, y + 6);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Taxable Value: Rs. ${taxableAmount.toLocaleString('en-IN')}`, margin + 4, y + 12);

    if (gstTaxType === 'intra') {
      doc.text(`CGST (${gstRate / 2}%): Rs. ${cgstAmount.toLocaleString('en-IN')}`, margin + 4, y + 17);
      doc.text(`SGST (${gstRate / 2}%): Rs. ${sgstAmount.toLocaleString('en-IN')}`, margin + 4, y + 22);
    } else {
      doc.text(`IGST (${gstRate}%): Rs. ${igstAmount.toLocaleString('en-IN')}`, margin + 4, y + 17);
    }
    doc.setTextColor(52, 211, 153);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Tax: Rs. ${totalGstAmount.toLocaleString('en-IN')}`, margin + 4, y + 27);
  } else {
    doc.setTextColor(245, 158, 11);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(gstEnabled ? 'GST APPLICABLE BILL' : 'BILL OF SUPPLY / NON-GST INVOICE', margin + 4, y + 8);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Taxable Value: Rs. ${taxableAmount.toLocaleString('en-IN')}`, margin + 4, y + 16);
    if (gstEnabled) {
      doc.text(`Tax @ ${gstRate}%: Rs. ${totalGstAmount.toLocaleString('en-IN')}`, margin + 4, y + 22);
    }
  }

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT IN WORDS:', margin + 4, y + 33);
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'normal');
  doc.text(amountInWords.substring(0, 55), margin + 4, y + 37);

  // Right: Net Calculation
  const rightX = margin + leftW + 4;
  const rightW = contentWidth - leftW - 4;

  doc.setFillColor(30, 34, 43);
  doc.roundedRect(rightX, y, rightW, 40, 3, 3, 'F');

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Taxable Subtotal:', rightX + 4, y + 7);
  doc.text(`Rs. ${taxableAmount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 7, { align: 'right' });

  if (gstEnabled) {
    doc.text(`GST Tax (${gstRate}%):`, rightX + 4, y + 12);
    doc.text(`+ Rs. ${totalGstAmount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 12, { align: 'right' });
  }

  if (previousBalance > 0) {
    doc.setTextColor(245, 158, 11);
    doc.text('Previous Balance:', rightX + 4, y + 17);
    doc.text(`+ Rs. ${previousBalance.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 17, { align: 'right' });
  }

  if (advanceTotal > 0) {
    doc.setTextColor(52, 211, 153);
    doc.text('Advance Adjusted:', rightX + 4, y + 22);
    doc.text(`- Rs. ${advanceTotal.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 22, { align: 'right' });
  }

  if (discount > 0) {
    doc.setTextColor(248, 113, 113);
    doc.text('Discount:', rightX + 4, y + 27);
    doc.text(`- Rs. ${discount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y + 27, { align: 'right' });
  }

  // Net Total Bar
  doc.setFillColor(245, 158, 11);
  doc.roundedRect(rightX + 2, y + 30, rightW - 4, 8, 1.5, 1.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BALANCE PAYABLE:', rightX + 5, y + 35.5);
  doc.text(`Rs. ${totalPayable.toLocaleString('en-IN')}`, pageWidth - margin - 5, y + 35.5, { align: 'right' });

  // Bank Details Footer
  y += 44;
  doc.setFillColor(24, 26, 32);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BANK & UPI PAYMENT DETAILS:', margin + 5, y + 6);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Account Name: ${bank.accountHolder}   |   Bank: ${bank.bankName}`, margin + 5, y + 12);
  doc.text(`A/C No: ${bank.accountNumber}   |   IFSC Code: ${bank.ifscCode}`, margin + 5, y + 17);
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.text(`UPI ID: ${bank.upiId}`, margin + 5, y + 22);

  // Authorized Signatory & Signature
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`For ${supplier.name}`, pageWidth - margin - 5, y + 8, { align: 'right' });

  // If digital signature image is provided, draw it cleanly
  if (data.showSignature !== false && data.signatureImageUrl) {
    try {
      doc.addImage(data.signatureImageUrl, 'PNG', pageWidth - margin - 28, y + 9.5, 23, 7.5, undefined, 'FAST');
    } catch (sigErr) {
      console.warn('Vector PDF signature image embedding notice:', sigErr);
    }
  }

  if (data.signatureSignatoryName && data.showSignature !== false && data.signatureImageUrl) {
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(6);
    doc.text(data.signatureSignatoryName, pageWidth - margin - 5, y + 18, { align: 'right' });
  }

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Authorized Signatory', pageWidth - margin - 5, y + 22, { align: 'right' });

  return doc;
}
