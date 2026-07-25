const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require('../utils/wrapAsync.js');
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");
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

// NEW: powers the "My Profile" navbar link
router.get("/profile", isLoggedIn, userController.renderProfile);

module.exports = router;