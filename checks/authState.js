const isUserAuthenticated = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.id) {
      next();
    } else {
      res.status(401).json({ success: false, message: "Unauthorized" });
    }
  };
  