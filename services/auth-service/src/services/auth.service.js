const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { redis } = require('../middlewares/cache');
const emailService = require('./email.service');

class AuthService {
  async sendRegisterOtp(email, password, name) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email đã được đăng ký');
    
    // Tạo mã OTP 6 số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Lưu tạm thời thông tin và OTP vào Redis (5 phút)
    const payload = { email, password: hashedPassword, name, otp };
    await redis.setex(`OTP_REGISTER:${email}`, 300, JSON.stringify(payload));
    
    // Gửi email
    await emailService.sendOtp(email, otp, 'register');
    return { success: true, message: 'Đã gửi mã OTP đăng ký' };
  }

  async verifyRegisterOtp(email, inputOtp) {
    const dataStr = await redis.get(`OTP_REGISTER:${email}`);
    if (!dataStr) throw new Error('Mã OTP không tồn tại hoặc đã hết hạn');
    
    const data = JSON.parse(dataStr);
    if (data.otp !== inputOtp) throw new Error('Mã OTP không chính xác');
    
    // Chèn User vào DB 
    const user = await prisma.user.create({
      data: { email: data.email, password: data.password, name: data.name }
    });
    
    // Xoá OTP
    await redis.del(`OTP_REGISTER:${email}`);
    
    const token = this.generateToken(user.id, user.email, user.role);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    };
  }

  async sendForgotPasswordOtp(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Địa chỉ email không tồn tại trong hệ thống');
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.setex(`OTP_FORGOT:${email}`, 300, otp);
    
    await emailService.sendOtp(email, otp, 'forgot');
    return { success: true, message: 'Đã gửi mã OTP khôi phục mật khẩu' };
  }

  async resetPasswordWithOtp(email, inputOtp, newPassword) {
    const savedOtp = await redis.get(`OTP_FORGOT:${email}`);
    if (!savedOtp) throw new Error('Mã OTP không tồn tại hoặc đã hết hạn');
    if (savedOtp !== inputOtp) throw new Error('Mã OTP không chính xác');
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    await redis.del(`OTP_FORGOT:${email}`);
    return { success: true, message: 'Đổi mật khẩu thành công' };
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Email hoặc mật khẩu không đúng');
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new Error('Email hoặc mật khẩu không đúng');
    
    const token = this.generateToken(user.id, user.email, user.role);
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Không tìm thấy tài khoản');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error('Mật khẩu hiện tại không chính xác');
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  }

  generateToken(userId, email, role) {
    return jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new AuthService();
