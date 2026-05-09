import nodemailer from 'nodemailer';

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const devLog = ({ to, subject, html }) => {
  const otpMatch = html.match(/font-size:40px[^>]*>(\d{6})</);
  const otp = otpMatch ? otpMatch[1] : '(see html)';
  console.log(`\n📧 [DEV EMAIL] To: ${to} | Subject: ${subject} | OTP: ${otp}\n`);
};

export const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    devLog({ to, subject, html });
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"CoZy FoX" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`[EMAIL ERROR] ${err.message}`);
    devLog({ to, subject, html });
  }
};

export const orderConfirmationEmail = (order) => ({
  subject: `Order Confirmed — #${order._id.toString().substring(0, 8)}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#16a34a;">Your order has been placed!</h2>
      <p>Order ID: <strong>#${order._id}</strong></p>
      <p>Total: <strong>Rs ${order.totalPrice.toFixed(0)}</strong></p>
      <p>Payment Method: ${order.paymentMethod}</p>
      <h3>Items:</h3>
      <ul>
        ${order.orderItems.map(i => `<li>${i.name} × ${i.qty} — Rs ${(i.price * i.qty).toFixed(0)}</li>`).join('')}
      </ul>
      <p style="color:#6b7280;">Thank you for shopping with EC-POS!</p>
    </div>
  `,
});

export const paymentConfirmationEmail = (order) => ({
  subject: `Payment Received — #${order._id.toString().substring(0, 8)}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#16a34a;">Payment confirmed!</h2>
      <p>Order ID: <strong>#${order._id}</strong></p>
      <p>Amount Paid: <strong>Rs ${order.totalPrice.toFixed(0)}</strong></p>
      <p>Paid At: ${new Date(order.paidAt).toLocaleString()}</p>
      <p style="color:#6b7280;">Your order is now being processed.</p>
    </div>
  `,
});

const STATUS_LABELS = {
  pending:    { title: 'Order Received',     color: '#3b82f6', msg: 'We have received your order and will start processing it shortly.' },
  processing: { title: 'Order Being Prepared', color: '#f59e0b', msg: 'Your order is now being prepared for shipment.' },
  shipped:    { title: 'Order Shipped',      color: '#8b5cf6', msg: 'Good news — your order has been shipped and is on the way.' },
  delivered:  { title: 'Order Delivered',    color: '#16a34a', msg: 'Your order has been delivered. We hope you enjoy your purchase!' },
  cancelled:  { title: 'Order Cancelled',    color: '#ef4444', msg: 'Your order has been cancelled.' },
};

export const orderStatusEmail = (order, status) => {
  const meta = STATUS_LABELS[status] || STATUS_LABELS.pending;
  const shortId = order._id.toString().substring(0, 8);
  return {
    subject: `${meta.title} — Order #${shortId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
        <div style="background:white;border-radius:12px;padding:28px;border-top:4px solid ${meta.color};">
          <h2 style="color:${meta.color};margin:0 0 8px;">${meta.title}</h2>
          <p style="color:#374151;margin:0 0 20px;">${meta.msg}</p>
          <p style="color:#6b7280;font-size:14px;margin:0;">Order ID: <strong style="color:#111827;">#${order._id}</strong></p>
          <p style="color:#6b7280;font-size:14px;margin:4px 0 16px;">Total: <strong style="color:#111827;">Rs ${order.totalPrice.toFixed(0)}</strong></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">Thank you for shopping with EC-POS.</p>
        </div>
      </div>
    `,
  };
};

export const orderRefundRequestEmail = (order) => ({
  subject: `Refund Request Received — Order #${order._id.toString().substring(0, 8)}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
      <div style="background:white;border-radius:12px;padding:28px;border-top:4px solid #f59e0b;">
        <h2 style="color:#f59e0b;margin:0 0 8px;">Refund Request Received</h2>
        <p style="color:#374151;">Your card-paid order has been cancelled. A refund request of <strong>Rs ${order.totalPrice.toFixed(0)}</strong> has been submitted to your wallet.</p>
        <p style="color:#6b7280;font-size:14px;">Once an administrator approves the refund, the amount will be credited to your EC-POS wallet balance.</p>
        <p style="color:#6b7280;font-size:14px;margin:16px 0 0;">Order ID: <strong style="color:#111827;">#${order._id}</strong></p>
      </div>
    </div>
  `,
});

export const orderRefundApprovedEmail = (order, amount) => ({
  subject: `Refund Approved — Order #${order._id.toString().substring(0, 8)}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
      <div style="background:white;border-radius:12px;padding:28px;border-top:4px solid #16a34a;">
        <h2 style="color:#16a34a;margin:0 0 8px;">Refund Approved</h2>
        <p style="color:#374151;">Your refund of <strong>Rs ${Number(amount).toFixed(0)}</strong> has been credited to your wallet.</p>
        <p style="color:#6b7280;font-size:14px;">Order ID: <strong style="color:#111827;">#${order._id}</strong></p>
      </div>
    </div>
  `,
});

export const sendLowStockAlert = async (productName, currentStock) => {
  const adminEmail = process.env.EMAIL_USER;
  if (!adminEmail) return;
  await sendEmail({
    to: adminEmail,
    subject: `Low Stock Alert: ${productName}`,
    html: `<p>Product <strong>${productName}</strong> is low on stock.</p><p>Current stock: <strong>${currentStock}</strong> units remaining.</p><p>Please restock soon.</p>`,
  });
};
