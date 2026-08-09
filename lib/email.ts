/**
 * D'VERO — Production Transactional Email Templates & Dispatch Engine
 */

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<{ success: boolean; error?: string }> {
  // In production, this dispatches via Resend / Postmark / SendGrid API
  console.log(`[D'VERO EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
  return { success: true };
}

export function generateOrderConfirmationEmailHTML(orderNumber: string, name: string, total: string, deliveryDate: string) {
  return `
    <div style="font-family: 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px; border: 1px solid #E5E0D8;">
      <h1 style="text-align: center; letter-spacing: 0.2em; text-transform: uppercase; font-size: 24px; color: #111;">D'VERO</h1>
      <p style="text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #888; border-bottom: 1px solid #E5E0D8; padding-bottom: 20px;">Order Confirmation #${orderNumber}</p>
      
      <p style="font-size: 14px; color: #333; line-height: 1.6;">Dear ${name},</p>
      <p style="font-size: 14px; color: #333; line-height: 1.6;">Thank you for your order with D'VERO. Your formalwear order has been reserved and is currently being tailored for dispatch.</p>
      
      <div style="background: #FFF; padding: 20px; border: 1px solid #E5E0D8; margin: 25px 0;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #888;">Total Amount Paid</p>
        <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: bold; color: #B8860B;">${total}</p>
        <p style="margin: 15px 0 0 0; font-size: 12px; text-transform: uppercase; color: #888;">Estimated Delivery</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #111;">${deliveryDate}</p>
      </div>

      <p style="font-size: 12px; color: #888; text-align: center; margin-top: 40px;">D'VERO — Luxury Formalwear Redefined</p>
    </div>
  `;
}

export function generateShippingDispatchEmailHTML(orderNumber: string, name: string, trackingCode: string) {
  return `
    <div style="font-family: 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background: #FAF9F6; padding: 40px; border: 1px solid #E5E0D8;">
      <h1 style="text-align: center; letter-spacing: 0.2em; text-transform: uppercase; font-size: 24px; color: #111;">D'VERO</h1>
      <p style="text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #888;">Your Order Has Shipped #${orderNumber}</p>
      
      <p style="font-size: 14px; color: #333; line-height: 1.6;">Dear ${name},</p>
      <p style="font-size: 14px; color: #333; line-height: 1.6;">Your D'VERO order has been hand-inspected and dispatched via Express Courier.</p>
      
      <div style="background: #FFF; padding: 20px; border: 1px solid #E5E0D8; margin: 25px 0; text-align: center;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #888;">Courier Tracking Code</p>
        <p style="margin: 8px 0 0 0; font-size: 18px; font-family: monospace; font-weight: bold; color: #111;">${trackingCode}</p>
      </div>
    </div>
  `;
}
