import mongoose from "mongoose";

export type CommentModel = mongoose.Document & {
  _id: mongoose.Schema.Types.ObjectId,
  owner: string,
  content: string,
  post: string
};

const commentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  content: String,
}, { timestamps: true });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
