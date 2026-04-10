const authService = require('../services/auth.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuthController {
  async sendRegisterOtp(req, res) {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
      }
      const result = await authService.sendRegisterOtp(email, password, name);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifyRegisterOtp(req, res) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email và mã OTP là bắt buộc' });
      }
      const result = await authService.verifyRegisterOtp(email, otp);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });
      const result = await authService.sendForgotPasswordOtp(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin cần thiết' });
      }
      const result = await authService.resetPasswordWithOtp(email, otp, newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
      }
      const result = await authService.login(email, password);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const { userId } = req.user;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, phone: true, gender: true, birthday: true, role: true, createdAt: true }
      });
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const { userId } = req.user;
      const { name, phone, gender, birthday } = req.body;
      const data = {};
      if (name !== undefined)     data.name = name.trim();
      if (phone !== undefined)    data.phone = phone.trim();
      if (gender !== undefined)   data.gender = gender;
      if (birthday !== undefined) data.birthday = birthday ? new Date(birthday) : null;
      const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, email: true, name: true, phone: true, gender: true, birthday: true, role: true }
      });
      res.status(200).json({ success: true, data: user, message: 'Cập nhật thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const { userId } = req.user;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải ít nhất 6 ký tự' });
      }
      await authService.changePassword(userId, currentPassword, newPassword);
      res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true }
      });
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const user = await prisma.user.update({
        where: { id },
        data: { role },
        select: { id: true, email: true, name: true, role: true }
      });
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new AuthController();
