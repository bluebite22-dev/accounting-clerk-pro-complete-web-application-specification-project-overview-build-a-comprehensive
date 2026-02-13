import { format } from "date-fns";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Export data to JSON
export function exportToJSON(data: any[], filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(jsonString, `${filename}.json`, "application/json");
}

// Export data to CSV
export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(headers.join(","));

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if needed
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? "";
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  downloadFile(csvString, `${filename}.csv`, "text/csv");
}

// Export data to Excel (modern format using xlsx library)
export function exportToExcel(
  data: any[],
  filename: string,
  sheetName: string = "Sheet1"
): void {
  if (data.length === 0) return;

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on content
  const columnWidths = Object.keys(data[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? "").length)
    ) + 2,
  }));
  worksheet["!cols"] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, `${filename}.xlsx`);
}

// Export data to PDF (using jsPDF with autoTable)
export function exportToPDF(
  data: any[],
  filename: string,
  title: string,
  options: {
    orientation?: "portrait" | "landscape";
    includeDate?: boolean;
    customStyles?: Record<string, string | number>;
  } = {}
): void {
  if (data.length === 0) return;

  const { orientation = "portrait", includeDate = true, customStyles = {} } = options;

  // Create PDF document
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  // Add title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
    doc.text(title, 14, 20);

  // Add date if requested
  if (includeDate) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 28);
  }

  // Prepare table data
  const headers = Object.keys(data[0]);
  const body = data.map((row) => headers.map((header) => String(row[header] ?? "")));

  // Add table using autoTable
  autoTable(doc, {
    head: [headers],
    body,
    startY: includeDate ? 35 : 25,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      ...customStyles,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue header
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { top: 10, right: 14, bottom: 20, left: 14 },
  });

  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  // Save PDF
  doc.save(`${filename}.pdf`);
}

// Print to PDF (browser print dialog)
export function printToPDF(elementId: string, title: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Element not found:", elementId);
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .header { text-align: center; margin-bottom: 20px; }
          .no-print { display: none; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated: ${format(new Date(), "PPpp")}</p>
        </div>
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

// Import from JSON file
export function importFromJSON<T = any>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(Array.isArray(data) ? data : [data]);
      } catch (error) {
        reject(new Error("Invalid JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// Import from CSV file
export function importFromCSV<T = Record<string, string>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());
        
        if (lines.length < 2) {
          reject(new Error("CSV file must have headers and at least one data row"));
          return;
        }

        const headers = parseCSVLine(lines[0]);
        const data: T[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row: any = {};
          headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() ?? "";
          });
          data.push(row);
        }

        resolve(data);
      } catch (error) {
        reject(new Error("Failed to parse CSV file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// Import from Excel file
export async function importFromExcel<T = Record<string, unknown>>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error("Excel file has no sheets"));
          return;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: T[] = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error("Failed to parse Excel file"));
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

// Parse a CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Helper function to download file
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

// Helper function to download blob
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format currency for display
export function formatCurrencyForExport(amount: number, currency: string = "ZMW"): string {
  return `${currency} ${amount.toFixed(2)}`;
}

// Format date for export
export function formatDateForExport(date: string | Date): string {
  return format(new Date(date), "yyyy-MM-dd");
}

// Bank feed transaction types
export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  reference?: string;
  category?: string;
  isMatched: boolean;
}

// Import bank feed from CSV (supports common bank formats)
export async function importBankFeed(
  file: File,
  options: {
    dateColumn?: string;
    descriptionColumn?: string;
    amountColumn?: string;
    typeColumn?: string;
    hasHeader?: boolean;
  } = {}
): Promise<BankTransaction[]> {
  const data = await importFromCSV<Record<string, string>>(file);
  
  const {
    dateColumn = "Date",
    descriptionColumn = "Description",
    amountColumn = "Amount",
    typeColumn = "Type",
    hasHeader = true,
  } = options;

  const transactions: BankTransaction[] = [];
  const startIndex = hasHeader ? 1 : 0;
  
  for (let i = startIndex; i < data.length; i++) {
    const row = data[i];
    const dateStr = row[dateColumn] || row["date"] || row["Date"];
    const description = row[descriptionColumn] || row["description"] || row["Description"] || "";
    const amountStr = row[amountColumn] || row["amount"] || row["Amount"] || "0";
    const typeStr = row[typeColumn] || row["type"] || row["Type"];

    // Parse amount (handle currency symbols and commas)
    const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ""));
    
    // Determine type from amount sign or type column
    let type: "credit" | "debit" = "credit";
    if (typeStr) {
      type = typeStr.toLowerCase().includes("debit") || typeStr.toLowerCase().includes("payment") ? "debit" : "credit";
    } else if (amount < 0) {
      type = "debit";
    }

    if (dateStr && !isNaN(amount)) {
      transactions.push({
        id: crypto.randomUUID(),
        date: new Date(dateStr).toISOString(),
        description,
        amount: Math.abs(amount),
        type,
        isMatched: false,
      });
    }
  }

  return transactions;
}

// Match bank transactions to system transactions
export function matchBankTransactions(
  bankTransactions: BankTransaction[],
  systemTransactions: Array<{ id: string; amount: number; date: string; description: string }>
): Map<string, string> {
  const matches = new Map<string, string>();
  
  bankTransactions.forEach((bankTx) => {
    // Find matching system transaction
    const match = systemTransactions.find((sysTx) => {
      const dateDiff = Math.abs(
        new Date(bankTx.date).getTime() - new Date(sysTx.date).getTime()
      ) / (1000 * 60 * 60 * 24);
      
      return (
        dateDiff <= 3 && // Within 3 days
        Math.abs(bankTx.amount - sysTx.amount) < 0.01 && // Amount matches
        (sysTx.description.toLowerCase().includes(bankTx.description.toLowerCase().slice(0, 10)) ||
         bankTx.description.toLowerCase().includes(sysTx.description.toLowerCase().slice(0, 10)))
      );
    });

    if (match) {
      matches.set(bankTx.id, match.id);
      bankTx.isMatched = true;
    }
  });

  return matches;
}

// Export multiple sheets to Excel workbook
export function exportMultiSheetExcel(
  sheets: Array<{ name: string; data: any[] }>,
  filename: string
): void {
  const workbook = XLSX.utils.book_new();

  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue;

    const worksheet = XLSX.utils.json_to_sheet(sheet.data);
    
    // Auto-size columns
    const columnWidths = Object.keys(sheet.data[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...sheet.data.map((row) => String(row[key] ?? "").length)
      ) + 2,
    }));
    worksheet["!cols"] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, `${filename}.xlsx`);
}

// Generate invoice PDF
export function generateInvoicePDF(
  invoice: {
    invoiceNumber: string;
    customerName: string;
    customerAddress: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    subtotal: number;
    tax: number;
    total: number;
    dueDate: string;
    notes?: string;
  },
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  }
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Company info (top left)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(companyInfo.name, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(companyInfo.address, 14, 26);
  doc.text(companyInfo.phone, 14, 31);
  doc.text(companyInfo.email, 14, 36);

  // Invoice info (top right)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 150, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 28);
  doc.text(`Date: ${formatDateForExport(new Date())}`, 150, 33);
  doc.text(`Due Date: ${formatDateForExport(invoice.dueDate)}`, 150, 38);

  // Bill to
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.customerName, 14, 61);
  
  // Word wrap address
  const splitAddress = doc.splitTextToSize(invoice.customerAddress, 80);
  doc.text(splitAddress, 14, 67);

  // Items table
  const tableData = invoice.items.map((item) => [
    item.description,
    item.quantity.toString(),
    formatCurrencyForExport(item.unitPrice),
    formatCurrencyForExport(item.quantity * item.unitPrice),
  ]);

  autoTable(doc, {
    head: [["Description", "Qty", "Unit Price", "Total"]],
    body: tableData,
    startY: 85,
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  // Totals
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  
  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal: ${formatCurrencyForExport(invoice.subtotal)}`, 150, finalY + 10);
  doc.text(`Tax: ${formatCurrencyForExport(invoice.tax)}`, 150, finalY + 16);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${formatCurrencyForExport(invoice.total)}`, 150, finalY + 24);

  // Notes
  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, finalY + 35);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(invoice.notes, 180);
    doc.text(splitNotes, 14, finalY + 41);
  }

  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
