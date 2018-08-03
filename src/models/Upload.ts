import mongoose from "mongoose";

export type UploadModel = mongoose.Document & {
  _id: mongoose.Schema.Types.ObjectId,
  name: string,
  image: string,
  // owner: { type: mongoose.Schema.Types.ObjectId, ref: "User"}
  // // , required: [true, "can't be blank"]
};

const uploadSchema = new mongoose.Schema({
  name: String,
  image: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  // required: [true, "can't be blank"]
});

// declare model
const Upload = mongoose.model("Upload", uploadSchema);
export default Upload;
