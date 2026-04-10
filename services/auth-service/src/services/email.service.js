const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL || 'noreply.zerophone@gmail.com',
        pass: process.env.SMTP_PASS || 'demo'
      }
    });
  }

  async sendOtp(toParams, otp, type = 'register') {
    let subject = '';
    let html = '';

    if (type === 'register') {
      subject = 'Mã xác thực đăng ký tài khoản ZeroPhone';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #059669; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ZeroPhone</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #1f2937; margin-top: 0;">Xin chào,</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Cảm ơn bạn đã đăng ký tài khoản tại ZeroPhone. Vui lòng sử dụng mã OTP dưới đây để xác thực địa chỉ email của bạn:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="color: #ef4444; font-size: 14px;">* Mã này sẽ hết hạn sau 5 phút.</p>
            <p style="color: #4b5563; font-size: 14px; margin-bottom: 0;">Nếu bạn không yêu cầu đăng ký, vui lòng phớt lờ email này.</p>
          </div>
        </div>
      `;
    } else if (type === 'forgot') {
      subject = 'Mã khôi phục mật khẩu ZeroPhone';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #059669; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ZeroPhone</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #1f2937; margin-top: 0;">Yêu cầu Đặt lại mật khẩu,</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hệ thống nhận thấy yêu cầu lấy lại mật khẩu từ tài khoản của bạn. Đây là mã xác thực OTP của bạn:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="color: #ef4444; font-size: 14px;">* Mã này sẽ hết hạn sau 5 phút.</p>
            <p style="color: #4b5563; font-size: 14px; margin-bottom: 0;">Nếu máy chủ này bị nhầm, mong bạn vui lòng xoá email này.</p>
          </div>
        </div>
      `;
    }

    const mailOptions = {
      from: '"ZeroPhone System" <noreply.zerophone@gmail.com>',
      to: toParams,
      subject: subject,
      html: html
    };

    try {
      const isDemo = !process.env.SMTP_PASS || process.env.SMTP_PASS === 'demo' || process.env.SMTP_PASS === '"demo"';
      if (isDemo) {
         console.log('====== [DEV] EMAIL OTP MOCK ======');
         console.log(`To: ${toParams} | OTP: ${otp} | Type: ${type}`);
         console.log('==================================');
         return true;
      }
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Lỗi gửi email:', error);
      throw new Error('Không thể gửi mã qua Email. Vui lòng thử lại sau.');
    }
  }
}

module.exports = new EmailService();
