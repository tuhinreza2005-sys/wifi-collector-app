import { Customer, Transaction, MonthBillingRecord, Expense, CompanySettings } from '../types';
import { formatBnDate, formatCurrency, getPaymentMethodLabel, getExpenseCategoryLabel, formatYearMonth } from '../utils/bengali';

function downloadFile(content: string, filename: string, mimeType: string) {
  // UTF-8 BOM \uFEFF ensures Bengali characters display properly in MS Excel
  const blob = new Blob(['\uFEFF' + content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const ExportService = {
  /**
   * Export all customers to CSV/Excel
   */
  exportCustomersToExcel(customers: Customer[], filename = 'wifi_customers.csv') {
    const headers = ['আইডি (Member ID)', 'গ্রাহকের নাম', 'মোবাইল নম্বর', 'প্যাকেজ', 'মাসিক বিল (টাকা)', 'এলাকা', 'ঠিকানা', 'সংযোগ তারিখ', 'স্ট্যাটাস'];
    const rows = customers.map((c) => [
      `"${c.memberId}"`,
      `"${c.name}"`,
      `"${c.mobile}"`,
      `"${c.packageName}"`,
      c.monthlyBill,
      `"${c.area}"`,
      `"${c.address}"`,
      `"${c.connectionDate}"`,
      `"${c.status === 'active' ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    downloadFile(csvContent, filename, 'text/csv');
  },

  /**
   * Export Monthly Billing & Outstanding report to Excel
   */
  exportMonthlyReportToExcel(
    yearMonth: string,
    customers: Customer[],
    billings: Record<string, MonthBillingRecord>,
    filename?: string
  ) {
    const fn = filename || `billing_report_${yearMonth}.csv`;
    const headers = ['গ্রাহক আইডি', 'গ্রাহকের নাম', 'মোবাইল', 'এলাকা', 'মাসিক বিল', 'আদায়কৃত টাকা', 'বকেয়া টাকা', 'অবস্থা', 'সর্বশেষ পরিশোধ তারিখ'];
    
    const rows = customers.map((c) => {
      const key = `${c.id}_${yearMonth}`;
      const record = billings[key];
      const bill = record ? record.netBill : c.monthlyBill;
      const paid = record ? record.paidAmount : 0;
      const due = record ? record.dueAmount : bill;
      const statusText = record?.status === 'paid' ? 'পরিশোধিত' : (record?.status === 'partial' ? 'আংশিক' : 'বকেয়া');
      const lastDate = record?.lastPaymentDate ? formatBnDate(record.lastPaymentDate) : '-';

      return [
        `"${c.memberId}"`,
        `"${c.name}"`,
        `"${c.mobile}"`,
        `"${c.area}"`,
        bill,
        paid,
        due,
        `"${statusText}"`,
        `"${lastDate}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    downloadFile(csvContent, fn, 'text/csv');
  },

  /**
   * Export Transactions to Excel
   */
  exportTransactionsToExcel(transactions: Transaction[], filename = 'collection_history.csv') {
    const headers = ['রসিদ নং', 'ট্রানজেকশন আইডি', 'গ্রাহক আইডি', 'গ্রাহকের নাম', 'মোবাইল', 'এলাকা', 'বিলের মাস', 'আদায়কৃত টাকা', 'পদ্ধতি', 'সংগ্রহকারী', 'তারিখ ও সময়', 'স্ট্যাটাস'];

    const rows = transactions.map((t) => [
      `"${t.receiptNo}"`,
      `"${t.id}"`,
      `"${t.customerMemberId}"`,
      `"${t.customerName}"`,
      `"${t.customerMobile}"`,
      `"${t.customerArea}"`,
      `"${t.targetMonths.join(', ')}"`,
      t.totalAmount,
      `"${getPaymentMethodLabel(t.paymentMethod)}"`,
      `"${t.collectedBy}"`,
      `"${formatBnDate(t.timestamp, true)}"`,
      `"${t.isReversed ? 'বাতিলকৃত' : 'সফল'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    downloadFile(csvContent, filename, 'text/csv');
  },

  /**
   * Export Expenses to Excel
   */
  exportExpensesToExcel(expenses: Expense[], filename = 'business_expenses.csv') {
    const headers = ['আইডি', 'খরচের বিবরণ', 'ক্যাটাগরি', 'টাকার পরিমাণ', 'তারিখ', 'বিলের মাস', 'ভাউচার নং', 'রেকর্ডকারী'];

    const rows = expenses.map((e) => [
      `"${e.id}"`,
      `"${e.title}"`,
      `"${getExpenseCategoryLabel(e.category)}"`,
      e.amount,
      `"${e.date}"`,
      `"${e.month}"`,
      `"${e.receiptNumber || '-'}"`,
      `"${e.recordedBy}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    downloadFile(csvContent, filename, 'text/csv');
  },

  /**
   * Generate Print Window for Digital Receipt
   */
  printReceipt(params: {
    transaction: Transaction;
    settings: CompanySettings;
    currentDue: number;
    billingMonth: string;
  }) {
    const { transaction, settings, currentDue, billingMonth } = params;

    const printHtml = `
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="utf-8">
        <title>মানি রসিদ - ${transaction.receiptNo}</title>
        <style>
          @page { size: 80mm 150mm; margin: 4mm; }
          body {
            font-family: 'Hind Siliguri', -apple-system, sans-serif;
            margin: 0;
            padding: 10px;
            color: #111;
            font-size: 13px;
          }
          .receipt {
            border: 1px dashed #444;
            padding: 12px;
            border-radius: 8px;
            max-width: 380px;
            margin: 0 auto;
          }
          .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 10px; }
          .title { font-size: 18px; font-weight: bold; color: #15803d; margin: 0; }
          .subtitle { font-size: 11px; color: #555; margin: 2px 0; }
          .badge {
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            padding: 2px 8px;
            font-size: 11px;
            border-radius: 12px;
            font-weight: bold;
            margin-top: 4px;
          }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .label { color: #666; font-size: 12px; }
          .val { font-weight: 600; text-align: right; }
          .highlight {
            background: #f0fdf4;
            border-top: 1px dashed #16a34a;
            border-bottom: 1px dashed #16a34a;
            padding: 6px 0;
            margin: 8px 0;
          }
          .amount-val { font-size: 18px; font-weight: bold; color: #15803d; }
          .footer { text-align: center; font-size: 10px; color: #777; margin-top: 12px; border-top: 1px solid #eee; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="title">${settings.companyName}</div>
            <div class="subtitle">${settings.tagline}</div>
            <div class="subtitle">ফোন: ${settings.phone}</div>
            <div class="badge">মানি রসিদ (আদায় ভাউচার)</div>
          </div>

          <div class="row">
            <span class="label">রসিদ নম্বর:</span>
            <span class="val">${transaction.receiptNo}</span>
          </div>
          <div class="row">
            <span class="label">তারিখ ও সময়:</span>
            <span class="val">${formatBnDate(transaction.timestamp, true)}</span>
          </div>
          <div class="row">
            <span class="label">বিলের মাস:</span>
            <span class="val">${formatYearMonth(billingMonth)}</span>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 6px 0;">

          <div class="row">
            <span class="label">গ্রাহকের নাম:</span>
            <span class="val">${transaction.customerName}</span>
          </div>
          <div class="row">
            <span class="label">মেম্বার আইডি:</span>
            <span class="val">${transaction.customerMemberId}</span>
          </div>
          <div class="row">
            <span class="label">মোবাইল নম্বর:</span>
            <span class="val">${transaction.customerMobile}</span>
          </div>
          <div class="row">
            <span class="label">এলাকা:</span>
            <span class="val">${transaction.customerArea}</span>
          </div>

          <div class="highlight">
            <div class="row">
              <span class="label" style="font-weight: bold; color: #15803d;">আদায়কৃত টাকা:</span>
              <span class="amount-val">${formatCurrency(transaction.totalAmount)}</span>
            </div>
            <div class="row">
              <span class="label">পেমেন্ট মাধ্যম:</span>
              <span class="val">${getPaymentMethodLabel(transaction.paymentMethod)}</span>
            </div>
          </div>

          <div class="row">
            <span class="label">অবশিষ্ট বকেয়া:</span>
            <span class="val" style="color: ${currentDue > 0 ? '#b91c1c' : '#15803d'}">${formatCurrency(currentDue)}</span>
          </div>
          <div class="row">
            <span class="label">বিল সংগ্রহকারী:</span>
            <span class="val">${transaction.collectedBy}</span>
          </div>
          <div class="row">
            <span class="label">TXN ট্র্যাকিং আইডি:</span>
            <span class="val" style="font-size: 10px; font-family: monospace;">${transaction.id}</span>
          </div>

          <div class="footer">
            <p style="margin: 0;">আমাদের ওয়াইফাই সেবা ব্যবহার করার জন্য ধন্যবাদ!</p>
            <p style="margin: 2px 0 0 0;">সফটওয়্যার: WiFi Collector Smart Manager</p>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=450,height=600');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    }
  },

  /**
   * Parse CSV content for bulk customer import
   */
  parseCustomerCSV(csvText: string): Partial<Customer>[] {
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const result: Partial<Customer>[] = [];
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // handle CSV quotes
      const values = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
      if (values.length >= 3) {
        const memberId = values[0] || `WF-${1000 + i}`;
        const name = values[1];
        const mobile = values[2];
        const packageName = values[3] || '২০ এমবিপিএস সুপার';
        const monthlyBill = parseFloat(values[4]) || 500;
        const area = values[5] || 'মিরপুর';
        const address = values[6] || '';
        const connectionDate = values[7] || new Date().toISOString().slice(0, 10);

        if (name && mobile) {
          result.push({
            memberId,
            name,
            mobile,
            packageName,
            monthlyBill,
            area,
            address,
            connectionDate,
            status: 'active',
          });
        }
      }
    }
    return result;
  }
};
