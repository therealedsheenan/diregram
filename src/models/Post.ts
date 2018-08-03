import mongoose from "mongoose";

export type PostModel = mongoose.Document & {
  _id: mongoose.Schema.Types.ObjectId,
  owner: string,
  caption: string,
  image: string
};

const postSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  caption: String,
  image: { type: mongoose.Schema.Types.ObjectId, ref: "Upload" }
});

const Post = mongoose.model("Post", postSchema);
export default Post;
