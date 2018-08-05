import { Request, Response } from "express";
import mongoose from "mongoose";

import { default as Post, PostModel } from "../models/Post";

// create new post
export let post = (req: Request, res: Response) => {
  const newPost = new Post({
    _id: new mongoose.Types.ObjectId(),
    caption: String,
    image: { type: mongoose.Schema.Types.ObjectId, ref: "Upload" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  });

  newPost
    .save()
    .then((result: PostModel) => {
      console.log(result);
      res.status(201).json({
        post: {
          _id: result._id,
          image: result.image,
          owner: result.owner
        }
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
};

export let get = (req: Request, res: Response) => {
  const id = req.params.postId;
  Post.findById(id)
    .then(doc => {
      if (doc) {
        res
          .status(200)
          .json({
            post: doc
          });
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};
