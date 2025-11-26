import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { IPayment } from '../../modules/payment/model/payment.model';
import { IUser } from '../../modules/user/model/user.model';
import { IOrganization } from '../../modules/organization/model/organization.model';

interface InvoiceData {
  payment: IPayment;
  coach: IUser;
  organization?: IOrganization;
}

/**
 * Generate PDF invoice from payment data using Puppeteer
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const { payment, coach, organization } = data;

  // Load HTML template
  const templatePath = path.join(__dirname, '../../templates/invoice.html');
  let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

  // Format dates
  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Prepare template data
  const templateData = {
    organizationName: organization?.name || 'Coaching Management System',
    invoiceNumber: payment.invoiceNumber,
    invoiceDate: formatDate((payment as any).createdAt || new Date()),
    dueDate: formatDate(payment.dueDate),
    status: payment.status,
    statusLabel: payment.status.toUpperCase(),
    coachName: `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || 'Unknown Coach',
    coachEmail: coach.email,
    coachPhone: coach.phone || '',
    periodStart: payment.period?.startDate ? formatDate(payment.period.startDate) : '',
    periodEnd: payment.period?.endDate ? formatDate(payment.period.endDate) : '',
    hasPeriod: !!payment.period,
    lineItems: payment.lineItems.map((item: any) => ({
      description: item.description || 'Coaching Session',
      duration: item.duration,
      rate: item.rate.toFixed(2),
      amount: item.amount.toFixed(2),
      currency: payment.currency,
    })),
    amount: payment.amount.toFixed(2),
    taxAmount: payment.taxAmount.toFixed(2),
    totalAmount: payment.totalAmount.toFixed(2),
    currency: payment.currency,
    paidAt: payment.paidAt,
    paidDate: formatDate(payment.paidAt),
    notes: payment.notes || '',
    generatedDate: formatDate(new Date()),
  };

  // Simple template replacement (for production, consider using a proper template engine like Handlebars)
  htmlTemplate = htmlTemplate
    .replace(/\{\{organizationName\}\}/g, templateData.organizationName)
    .replace(/\{\{invoiceNumber\}\}/g, templateData.invoiceNumber)
    .replace(/\{\{invoiceDate\}\}/g, templateData.invoiceDate)
    .replace(/\{\{dueDate\}\}/g, templateData.dueDate)
    .replace(/\{\{status\}\}/g, templateData.status)
    .replace(/\{\{statusLabel\}\}/g, templateData.statusLabel)
    .replace(/\{\{coachName\}\}/g, templateData.coachName)
    .replace(/\{\{coachEmail\}\}/g, templateData.coachEmail)
    .replace(/\{\{coachPhone\}\}/g, templateData.coachPhone)
    .replace(/\{\{periodStart\}\}/g, templateData.periodStart)
    .replace(/\{\{periodEnd\}\}/g, templateData.periodEnd)
    .replace(/\{\{amount\}\}/g, templateData.amount)
    .replace(/\{\{taxAmount\}\}/g, templateData.taxAmount)
    .replace(/\{\{totalAmount\}\}/g, templateData.totalAmount)
    .replace(/\{\{currency\}\}/g, templateData.currency)
    .replace(/\{\{paidDate\}\}/g, templateData.paidDate)
    .replace(/\{\{notes\}\}/g, templateData.notes)
    .replace(/\{\{generatedDate\}\}/g, templateData.generatedDate);

  // Handle conditional sections
  if (templateData.coachPhone) {
    htmlTemplate = htmlTemplate.replace(/\{\{#if coachPhone\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    htmlTemplate = htmlTemplate.replace(/\{\{#if coachPhone\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  if (templateData.hasPeriod) {
    htmlTemplate = htmlTemplate.replace(/\{\{#if period\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '$1');
  } else {
    htmlTemplate = htmlTemplate.replace(/\{\{#if period\}\}[\s\S]*?\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  }

  if (templateData.paidAt) {
    htmlTemplate = htmlTemplate.replace(/\{\{#if paidAt\}\}([\s\S]*?)\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '$1');
  } else {
    htmlTemplate = htmlTemplate.replace(/\{\{#if paidAt\}\}[\s\S]*?\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  }

  if (templateData.notes) {
    htmlTemplate = htmlTemplate.replace(/\{\{#if notes\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
  } else {
    htmlTemplate = htmlTemplate.replace(/\{\{#if notes\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  }

  // Handle line items loop
  const lineItemsHtml = templateData.lineItems
    .map(
      (item) => `
    <tr>
        <td>${item.description}</td>
        <td class="text-right">${item.duration} min</td>
        <td class="text-right">${item.currency}${item.rate}/hr</td>
        <td class="text-right">${item.currency}${item.amount}</td>
    </tr>
  `
    )
    .join('');

  htmlTemplate = htmlTemplate.replace(
    /\{\{#each lineItems\}\}[\s\S]*?\{\{\/each\}\}/g,
    lineItemsHtml
  );

  // Launch Puppeteer and generate PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
