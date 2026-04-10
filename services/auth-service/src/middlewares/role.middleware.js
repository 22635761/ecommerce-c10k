const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập'
    });
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập'
    });
  }
};

module.exports = { isAdmin, isAuthenticated };
