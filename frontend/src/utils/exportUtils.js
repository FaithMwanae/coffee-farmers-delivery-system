import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ============================================
// PDF EXPORT
// ============================================
export const exportToPDF = ({
  title,
  subtitle = '',
  columns,
  rows,
  fileName = 'report.pdf',
  orientation = 'portrait',
}) => {
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header banner
  doc.setFillColor(40, 167, 69);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KALILUNI FARMERS CO-OPERATIVE SOCIETY', pageWidth / 2, 10, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Coffee Farmers Delivery System', pageWidth / 2, 16, { align: 'center' });

  // Report title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, 33, { align: 'center' });

  // Subtitle
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageWidth / 2, 39, { align: 'center' });
  }

  // Metadata
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, 14, 48);
  doc.text(`Total Records: ${rows.length}`, pageWidth - 14, 48, { align: 'right' });

  // Table
  autoTable(doc, {
    startY: 53,
    head: [columns.map((c) => c.label)],
    body: rows.map((row) => columns.map((c) => row[c.key] ?? '—')),
    theme: 'striped',
    headStyles: {
      fillColor: [40, 167, 69],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [245, 255, 245] },
    styles: { overflow: 'linebreak', cellPadding: 2.5 },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
      doc.text(
        'Kaliluni Farmers Co-operative Society — Confidential',
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  doc.save(fileName);
};

// ============================================
// EXCEL EXPORT
// ============================================
export const exportToExcel = ({
  sheetName = 'Report',
  title = 'Kaliluni Coffee Report',
  columns,
  rows,
  fileName = 'report.xlsx',
}) => {
  const wb = XLSX.utils.book_new();

  // Build data array with header rows
  const header = [['KALILUNI FARMERS CO-OPERATIVE SOCIETY']];
  const subHeader = [[title]];
  const meta = [[`Generated: ${new Date().toLocaleString('en-GB')}`, '', `Total: ${rows.length} records`]];
  const blank = [['']];
  const colHeaders = [columns.map((c) => c.label)];
  const bodyRows = rows.map((row) => columns.map((c) => row[c.key] ?? ''));

  const data = [
    ...header,
    ...subHeader,
    ...meta,
    ...blank,
    ...colHeaders,
    ...bodyRows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column widths
  ws['!cols'] = columns.map(() => ({ wch: 20 }));

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
};

// ============================================
// FILENAME HELPER
// ============================================
export const makeFileName = (base) => {
  const date = new Date().toISOString().split('T')[0];
  return `${base}_${date}`;
};