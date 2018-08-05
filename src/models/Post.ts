import mongoose from "mongoose";
import { CommentModel } from "./Comment";


export type PostModel = mongoose.Document & {
  _id: mongoose.Schema.Types.ObjectId,
  owner: string,
  caption: string,
  image: string,
  comments: Array<CommentModel>
};

const postSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  caption: String,
  title: String,
  image: { type: mongoose.Schema.Types.ObjectId, ref: "Upload" },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }]
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);
export default Post;
