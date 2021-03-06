import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import { default as User, UserModel, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";

import "../config/passport";
import { default as Post, PostModel } from "../models/Post";

/**
 * GET /login
 * Login page.
 */
export let getLogin = (req: Request, res: Response) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("user/login", {
    title: "Login"
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
export let postLogin = (req: Request, res: Response, next: NextFunction) => {
  req.assert("email", "Email is not valid").isEmail();
  req.assert("password", "Password cannot be blank").notEmpty();
  req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash("errors", errors);
    return res.redirect("/user/login");
  }

  passport.authenticate("local", (err: Error, user: UserModel, info: IVerifyOptions) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      req.flash("errors", info.message);
      return res.redirect("/user/login");
    }
    req.logIn(user, err => {
      if (err) {
        return next(err);
      }
      req.flash("success", { msg: "Success! You are logged in." });
      res.redirect(req.session.returnTo || "/");
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
export let logout = (req: Request, res: Response) => {
  req.logout();
  res.redirect("/");
};

/**
 * GET /sign-nup
 * Sign-up page.
 */
export let getSignup = (req: Request, res: Response) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("user/signup", {
    title: "Create Account"
  });
};

/**
 * POST /sig-nup
 * Create a new local account.
 */
export let postSignup = (req: Request, res: Response, next: NextFunction) => {
  req.assert("email", "Email is not valid").isEmail();
  req.assert("password", "Password must be at least 4 characters long").len({ min: 4 });
  req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);
  req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash("errors", errors);
    return res.redirect("/user/signup");
  }

  const user = new User({
    email: req.body.email,
    password: req.body.password,
    username: req.body.email.split("@")[0]
  });

  User.findOne({ email: req.body.email }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    if (existingUser) {
      req.flash("errors", { msg: "Account with that email address already exists." });
      return res.redirect("/user/signup");
    }
    user.save(err => {
      if (err) {
        return next(err);
      }
      req.logIn(user, err => {
        if (err) {
          return next(err);
        }
        res.redirect("/");
      });
    });
  });
};

/*
 * GET /user
 * settings page.
 */
export let getAccount = (req: Request, res: Response) => {
  console.log(req.user);
  res.render("user/settings", {
    title: "Account Management"
  });
};

/*
* GET /user/post
*/
export let getPostPage = (req: Request, res: Response) => {
  res.render("user/new-post", {
    title: "Create post"
  });
};

/*
* POST /user/post
*/
export let createPost = (req: any, res: Response, next: NextFunction) => {
  // upload.postUpload
  const newPost = new Post({
    owner: req.user.id,
    caption: req.body.caption,
    title: req.body.title,
    image: req.upload._id
  });

  newPost
    .save()
    .then((result: PostModel) => {
      // populat post"s author
      req.flash("success", { msg: "Post successfully created." });
      User.findById(req.user.id, (err, user: UserModel) => {
        if (err) { return next(err); }
        user.posts.push(result);
        user.save((err: WriteError) => {
          if (err) {
            req.flash("errors", { msg: "User is not available." });
            return next(err);
          }
          res.redirect("/user/posts");
        });
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
};

/*
* GET /user/posts
* current logged-in User posts page
*/
export let getPostsPage = (req: Request, res: Response, next: NextFunction) => {
  User.findById(req.user.id)
    .populate({
      path: "posts",
      options: { sort: { createdAt: "desc" } },
      populate: [
        {
          path: "owner"
        },
        {
          path: "image"
        },
        {
          path: "comments",
          populate: {
            path: "owner",
            select: "username"
          }
        }
      ]
    })
    .exec((err, user: UserModel) => {
      if (err) {
        req.flash("errors", { msg: "Posts not available." });
        return next(err);
      }
      const posts = user.posts;
      console.log(posts);
      const fullUrl = `${req.protocol}://${req.get("host")}`;
      res.render("user/posts", {
        posts,
        baseUrl: fullUrl
      });
    });
};

/*
* GET /user/:name
* User profile page
*/
export let getUserPage = (req: Request, res: Response, next: NextFunction) => {
  const userName = req.params.username;
  User.findOne({ username: userName }, (err, user: UserModel) => {
    if (err || !user) {
      res.status(404);
      return next(err);
    }
    const opts = [
      {
        path: "posts",
        options: { sort: { createdAt: "desc" } },
        populate: [
           {path: "image" },
          { path: "owner" }
        ]
      }
    ];
    const fullUrl = `${req.protocol}://${req.get("host")}`;
    User.populate(user, opts, (err: any, user: UserModel) => {
      const posts = user.posts;
      res.render("user/show", {
        posts,
        username: userName,
        baseUrl: fullUrl
      });
    });
  });
};

/**
 * POST /user
 * Update profile information.
 */
export let postUpdateProfile = (req: Request, res: Response, next: NextFunction) => {
  req.assert("email", "Please enter a valid email address.").isEmail();
  req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash("errors", errors);
    return res.redirect("/user");
  }

  User.findById(req.user.id, (err, user: UserModel) => {
    if (err) {
      return next(err);
    }
    user.email = req.body.email || "";
    user.username = req.body.username || "";
    user.profile.name = req.body.name || "";
    user.profile.gender = req.body.gender || "";
    user.profile.location = req.body.location || "";
    user.profile.website = req.body.website || "";
    user.save((err: WriteError) => {
      if (err) {
        if (err.code === 11000) {
          req.flash("errors", {
            msg: "The email address or the username you have entered is already associated with an account."
          });
          return res.redirect("/user");
        }
        return next(err);
      }
      req.flash("success", { msg: "Profile information has been updated." });
      res.redirect("/user");
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
export let postUpdatePassword = (req: Request, res: Response, next: NextFunction) => {
  req.assert("password", "Password must be at least 4 characters long").len({ min: 4 });
  req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash("errors", errors);
    return res.redirect("/user");
  }

  User.findById(req.user.id, (err, user: UserModel) => {
    if (err) {
      return next(err);
    }
    user.password = req.body.password;
    user.save((err: WriteError) => {
      if (err) {
        return next(err);
      }
      req.flash("success", { msg: "Password has been changed." });
      res.redirect("/user");
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
export let postDeleteAccount = (req: Request, res: Response, next: NextFunction) => {
  User.remove({ _id: req.user.id }, err => {
    if (err) {
      return next(err);
    }
    req.logout();
    req.flash("info", { msg: "Your account has been deleted." });
    res.redirect("/");
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
export let getOauthUnlink = (req: Request, res: Response, next: NextFunction) => {
  const provider = req.params.provider;
  User.findById(req.user.id, (err, user: any) => {
    if (err) {
      return next(err);
    }
    user[provider] = undefined;
    user.tokens = user.tokens.filter((token: AuthToken) => token.kind !== provider);
    user.save((err: WriteError) => {
      if (err) {
        return next(err);
      }
      req.flash("info", { msg: `${provider} account has been unlinked.` });
      res.redirect("/user");
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
export let getReset = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  User.findOne({ passwordResetToken: req.params.token })
    .where("passwordResetExpires")
    .gt(Date.now())
    .exec((err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        req.flash("errors", { msg: "Password reset token is invalid or has expired." });
        return res.redirect("/user/forgot");
      }
      res.render("user/reset", {
        title: "Password Reset"
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
export let postReset = (req: Request, res: Response, next: NextFunction) => {
  req.assert("password", "Password must be at least 4 characters long.").len({ min: 4 });
  req.assert("confirm", "Passwords must match.").equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash("errors", errors);
    return res.redirect("back");
  }

  async.waterfall(
    [
      function resetPassword(done: Function) {
        User.findOne({ passwordResetToken: req.params.token })
          .where("passwordResetExpires")
          .gt(Date.now())
          .exec((err, user: any) => {
            if (err) {
              return next(err);
            }
            if (!user) {
              req.flash("errors", { msg: "Password reset token is invalid or has expired." });
              return res.redirect("back");
            }
            user.password = req.body.password;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            user.save((err: WriteError) => {
              if (err) {
                return next(err);
              }
              req.logIn(user, err => {
                done(err, user);
              });
            });
          });
      },
      function sendResetPasswordEmail(user: UserModel, done: Function) {
        const transporter = nodemailer.createTransport({
          service: "SendGrid",
          auth: {
            user: process.env.SENDGRID_USER,
            pass: process.env.SENDGRID_PASSWORD
          }
        });
        const mailOptions = {
          to: user.email,
          from: "express-ts@starter.com",
          subject: "Your password has been changed",
          text: `Hello,\n\nThis is a confirmation that the password for your account ${
            user.email
          } has just been changed.\n`
        };
        transporter.sendMail(mailOptions, err => {
          req.flash("success", { msg: "Success! Your password has been changed." });
          done(err);
        });
      }
    ],
    err => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    }
  );
};

/**
 * GET /forgot
 * Forgot Password page.
 */
export let getForgot = (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("user/forgot", {
    title: "Forgot Password"
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
export let postForgot = (req: Request, res: Response, next: NextFunction) => {
  req.assert("email", "Please enter a valid email address.").isEmail();
  req.sanitize("email").normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash("errors", errors);
    return res.redirect("/user/forgot");
  }

  async.waterfall(
    [
      function createRandomToken(done: Function) {
        crypto.randomBytes(16, (err, buf) => {
          const token = buf.toString("hex");
          done(err, token);
        });
      },
      function setRandomToken(token: AuthToken, done: Function) {
        User.findOne({ email: req.body.email }, (err, user: any) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            req.flash("errors", { msg: "Account with that email address does not exist." });
            return res.redirect("/user/forgot");
          }
          user.passwordResetToken = token;
          user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          user.save((err: WriteError) => {
            done(err, token, user);
          });
        });
      },
      function sendForgotPasswordEmail(token: AuthToken, user: UserModel, done: Function) {
        const transporter = nodemailer.createTransport({
          service: "SendGrid",
          auth: {
            user: process.env.SENDGRID_USER,
            pass: process.env.SENDGRID_PASSWORD
          }
        });
        const mailOptions = {
          to: user.email,
          from: "hackathon@starter.com",
          subject: "Reset your password on Hackathon Starter",
          text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/user/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };
        transporter.sendMail(mailOptions, err => {
          req.flash("info", { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
          done(err);
        });
      }
    ],
    err => {
      if (err) {
        return next(err);
      }
      res.redirect("/user/forgot");
    }
  );
};
