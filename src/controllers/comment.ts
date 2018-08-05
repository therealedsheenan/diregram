import { Request, Response, NextFunction } from "express";

import { default as Comment, CommentModel } from "../models/Comment";
import { default as User, UserModel } from "../models/User";
import { default as Post, PostModel } from "../models/Post";

/*
* POST comment
* create comment
*/
export let postComment = (req: Request, res: Response, next: NextFunction) => {
  const postId = req.params.postId;
  console.log(postId);
  const newComment = new Comment({
    owner: req.user._id,
    post: postId,
    content: req.body.content
  });

  newComment
    .save()
    .then((response: CommentModel) => {
      req.flash("success", { msg: "Comment successfully created!" });
      User.findById(req.user._id, (err, user: UserModel) => {
        if (err) { return next(err); }
        user.comments.push(response);
        user.save();
      });
      Post.findById(postId, (err, post: PostModel) => {
        if (err) { return next(err); }
        post.comments.push(response);
        post.save();
      });
      res.redirect("/");
    })
    .catch(err => {
      req.flash("errors", { msg: "Comment failure." });
      res.status(500).json({
        error: err
      });
    });
};
