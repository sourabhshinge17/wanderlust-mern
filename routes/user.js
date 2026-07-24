const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require('../utils/wrapAsync.js');
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/user.js");

//signUp
router
    .route("/signUp")
    .get(userController.renderSignUpForm)
    .post(wrapAsync(userController.UserSignUp));

    //login
router
    .route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        userController.UserLogin
    );

router.get("/logout", userController.UserLogOut);

module.exports = router;