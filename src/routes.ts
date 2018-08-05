import express from "express";
import passport from "passport";

import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
import * as uploadController from "./controllers/upload";
import * as passportConfig from "./config/passport";
import * as apiController from "./controllers/api";

const router = express.Router();

// home
router.get("/", homeController.index);

// user
router.get("/user", passportConfig.isAuthenticated, userController.getAccount);
router.get( "/user/login", userController.getLogin);
router.post( "/user/login", userController.postLogin);
router.get( "/user/logout", userController.logout);
router.get( "/user/forgot", userController.getForgot);
router.post( "/user/forgot", userController.postForgot);
router.get( "/user/reset/:token", userController.getReset);
router.post( "/user/reset/:token", userController.postReset);
router.get( "/user/signup", userController.getSignup);
router.post( "/user/signup", userController.postSignup);
router.post( "/user/settings", passportConfig.isAuthenticated, userController.postUpdateProfile);
router.post( "/user/password", passportConfig.isAuthenticated, userController.postUpdatePassword);
router.post( "/user/delete", passportConfig.isAuthenticated, userController.postDeleteAccount);
router.get( "/user/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink);
router.get("/user/post", passportConfig.isAuthenticated, userController.getPostPage);
router.post(
  "/user/post/new",
  passportConfig.isAuthenticated,
  uploadController.uploadMiddleware,
  uploadController.postUpload,
  userController.createPost
);
router.get("/user/posts", passportConfig.isAuthenticated, userController.getPostsPage);
router.get("/user/:name", userController.getUserPage);

// upload
router.post(
  "/upload",
  passportConfig.isAuthenticated,
  uploadController.uploadMiddleware,
  uploadController.postUpload
);
router.get("/upload/:uploadId", uploadController.getUpload);

// api
router.get("/api/facebook", passportConfig.isAuthenticated, passportConfig.isAuthorized, apiController.getFacebook);

// OAuth authentication routes. (Sign-in with 3rd party apps)
router.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email", "public_profile"] }));
router.get("/auth/facebook/callback", passport.authenticate("facebook", { failureRedirect: "/user/login" }), (req, res) => {
  res.redirect(req.session.returnTo || "/");
});

// 404
router.get("*", (req, res) => {
  res.render("404");
});

export default router;
