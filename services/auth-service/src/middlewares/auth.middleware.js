const authService = require('../services/auth.service');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực'
    });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = authService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
  
  req.user = decoded;
  next();
};

module.exports = { verifyToken };
