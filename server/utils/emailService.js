import nodemailer from 'nodemailer';
import 'dotenv/config';

// Create a transporter using SMTP settings from .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'placeholder@ethereal.email',
        pass: process.env.SMTP_PASS || 'password'
    }
});

/**
 * Send an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body 
 */
export async function sendEmail(to, subject, text, html) {
    // If SMTP is not configured, just log to console
    if (!process.env.SMTP_HOST && process.env.NODE_ENV === 'production') {
        console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
        console.log(`Body: ${text}`);
        return { success: true, mock: true };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"THESL HR System" <hr@thesl.co.za>',
            to,
            subject,
            text,
            html
        });
        console.log(`[EMAIL SENT] ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (err) {
        console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Send Leave Action Notification (Approved/Rejected)
 */
export async function sendLeaveNotification(user, requestType, action, details) {
    const subject = `Leave Request ${action} - THESL HR`;
    const actionColor = action === 'Approved' ? '#10b981' : '#ef4444';
    
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Leave Request Update</h2>
            <p>Hi ${user.name},</p>
            <p>Your <strong>${requestType} Leave</strong> request has been <span style="color: ${actionColor}; font-weight: bold; text-transform: uppercase;">${action}</span>.</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Details:</p>
                <p style="margin: 5px 0 0; color: #1e293b; font-weight: 600;">${details}</p>
            </div>
            <p>If you have any questions, please contact your manager.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 0.8rem; text-align: center;">This is an automated notification from the THESL Employee Portal.</p>
        </div>
    `;
    
    return await sendEmail(user.email, subject, `Your ${requestType} leave was ${action}. Details: ${details}`, html);
}

/**
 * Send KPI Upload Notification
 */
export async function sendKpiNotification(user, kpiTitle) {
    const subject = `New KPI Sheet Uploaded - THESL Performance`;
    
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Performance Update</h2>
            <p>Hi ${user.name},</p>
            <p>A new KPI result sheet has been uploaded for you:</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #dcfce7;">
                <p style="margin: 0; color: #166534; font-weight: 600;">${kpiTitle}</p>
            </div>
            <p>You can view and download this sheet from the <strong>Performance</strong> section of your dashboard.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 0.8rem; text-align: center;">THESL Performance Management</p>
        </div>
    `;
    
    return await sendEmail(user.email, subject, `A new KPI sheet (${kpiTitle}) has been uploaded for you.`, html);
}

/**
 * Send Daily Digest to Managers
 */
export async function sendDailyDigest(manager, onLeaveToday, pendingApprovals) {
    const subject = `Daily HR Digest - ${new Date().toLocaleDateString()}`;
    
    const leaveHtml = onLeaveToday.length > 0 
        ? onLeaveToday.map(u => `<li><strong>${u.name}</strong> (${u.type} Leave)</li>`).join('')
        : '<li>No one is on leave today</li>';
        
    const pendingHtml = pendingApprovals.length > 0
        ? pendingApprovals.map(p => `<li><strong>${p.name}</strong> - ${p.type} (${p.duration} days)</li>`).join('')
        : '<li>No pending approvals</li>';

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">Manager's Daily Digest</h2>
            <p>Hi ${manager.name},</p>
            <p>Here is your team overview for today:</p>
            
            <div style="margin: 20px 0;">
                <h3 style="color: #334155; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">On Leave Today</h3>
                <ul style="color: #475569;">${leaveHtml}</ul>
            </div>

            <div style="margin: 20px 0;">
                <h3 style="color: #334155; font-size: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Pending Approvals</h3>
                <ul style="color: #475569;">${pendingHtml}</ul>
            </div>

            <p style="margin-top: 30px;">Click <a href="${process.env.FRONTEND_URL || '#'}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">here</a> to access the portal.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="color: #94a3b8; font-size: 0.8rem; text-align: center;">THESL HR Management System</p>
        </div>
    `;
    
    return await sendEmail(manager.email, subject, `Managers Daily Digest for today.`, html);
}
