import { format } from "date-fns";

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

// Export data to Excel (using basic XML format for compatibility)
export function exportToExcel(data: any[], filename: string, sheetName: string = "Sheet1"): void {
  const headers = Object.keys(data[0]);

  // Create XML workbook
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${sheetName}">
    <Table>`;

  // Add headers
  xml += `<Row>`;
  for (const header of headers) {
    xml += `<Cell><Data ss:Type="String">${header}</Data></Cell>`;
  }
  xml += `</Row>`;

  // Add data rows
  for (const row of data) {
    xml += `<Row>`;
    for (const header of headers) {
      const value = row[header];
      const type = typeof value === "number" ? "Number" : "String";
      xml += `<Cell><Data ss:Type="${type}">${value ?? ""}</Data></Cell>`;
    }
    xml += `</Row>`;
  }

  xml += `</Table></Worksheet></Workbook>`;

  downloadFile(xml, `${filename}.xls`, "application/vnd.ms-excel");
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
