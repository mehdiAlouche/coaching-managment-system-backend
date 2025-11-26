/**
 * Email Service Utility
 * 
 * This is a placeholder for email functionality.
 * In production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Nodemailer with SMTP
 * - Other transactional email providers
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

/**
 * Send an email
 * @param options Email configuration
 * @returns Promise indicating success/failure
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // TODO: Implement actual email sending logic
  // Example integration with SendGrid:
  // 
  // import sgMail from '@sendgrid/mail';
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // 
  // const msg = {
  //   to: options.to,
  //   from: process.env.EMAIL_FROM,
  //   subject: options.subject,
  //   text: options.text,
  //   html: options.html,
  //   attachments: options.attachments,
  // };
  // 
  // await sgMail.send(msg);

  console.log('📧 Email queued for sending:', {
    to: options.to,
    subject: options.subject,
    hasAttachments: !!options.attachments?.length,
  });

  // For now, log the email details
  // In production, this should actually send the email
  return true;
}

/**
 * Send invoice email with PDF attachment
 */
export async function sendInvoiceEmail(
  recipientEmail: string,
  recipientName: string,
  invoiceNumber: string,
  pdfBuffer: Buffer,
  organizationName?: string
): Promise<boolean> {
  const subject = `Invoice ${invoiceNumber} from ${organizationName || 'Coaching Management System'}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Invoice ${invoiceNumber}</h2>
      <p>Dear ${recipientName},</p>
      <p>Please find attached your invoice <strong>${invoiceNumber}</strong>.</p>
      <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        ${organizationName || 'Coaching Management System'}<br>
        This is an automated email. Please do not reply.
      </p>
    </div>
  `;

  const text = `
    Invoice ${invoiceNumber}
    
    Dear ${recipientName},
    
    Please find attached your invoice ${invoiceNumber}.
    
    If you have any questions about this invoice, please don't hesitate to contact us.
    
    ${organizationName || 'Coaching Management System'}
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    text,
    html,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
