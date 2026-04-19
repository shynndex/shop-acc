// services/mailService.js
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email, token, displayName) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "✅ Xác thực tài khoản ShopSam",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(to right, #06b6d4, #f97316); -webkit-background-clip: text; color: transparent; margin: 0;">ShopSam</h1>
          </div>
          
          <h2 style="font-size: 20px; color: #1e293b; margin-bottom: 12px;">Chào ${displayName || "bạn"}! 👋</h2>
          <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
            Cảm ơn bạn đã đăng ký tài khoản tại <strong>ShopSam</strong>. Để hoàn tất và kích hoạt tài khoản, vui lòng nhấn vào nút bên dưới:
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" 
               style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background 0.2s;">
              Xác thực email ngay
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
            Hoặc copy đường link sau vào trình duyệt:<br/>
            <span style="color: #0ea5e9; word-break: break-all;">${verifyUrl}</span>
          </p>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Link này sẽ hết hạn sau 24 giờ. Nếu bạn không tạo tài khoản, vui lòng bỏ qua email này.<br/>
              © ${new Date().getFullYear()} ShopSam. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] Error sending email:", error);
      throw new Error("Không thể gửi email xác thực");
    }

    console.log("[Resend] Email sent successfully:", data?.id);
    return data;
  } catch (error) {
    console.error("[Resend] Exception:", error);
    throw error;
  }
};
