import { NextFunction, Request, Response } from "express";
import { default as Post, PostModel } from "../models/Post";

/**
 * GET /
 * Home page.
 */
export let index = (req: Request, res: Response, next: NextFunction) => {
  Post
    .find(
      {},
      undefined,
      { sort: { "createdAt": "desc" } },
    (err, posts: Array<PostModel>) => {
      if (err) {
        return next(err);
      }

      const opts = [{
        path: "image"
      }, {
        path: "owner",
        select: "profile username"
      }, {
        path: "comments",
        populate: {
          path: "owner",
          select: "username"
        }
      }];

      const fullUrl = `${req.protocol}://${req.get("host")}`;
      console.log(posts);
      Post.populate(posts, opts, (err, posts: Array<PostModel>) => {
        res.render("home", {
          posts,
          baseUrl: fullUrl,
        });
      });
    });
};
