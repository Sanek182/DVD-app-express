const isUserAuthenticated = (req, res, next) => {
    if (req.cookies.user_sid && req.session.user.id) {
      next();
    } else {
      res.status(401).json({ success: false, message: "Unauthorized" });
    }
  };
  