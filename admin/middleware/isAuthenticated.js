module.exports = function isAuthenticated(req, res, next) {

    if (req.isAuthenticated()) {
        console.log("isAuthenticated middleware called");
      return next();
    }
    res.redirect('/MiddleWarErrorlogin');
  };
  

