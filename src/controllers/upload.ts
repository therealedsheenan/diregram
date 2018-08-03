import { Request, Response } from "express";
import multer  from "multer";
import { default as Upload, UploadModel } from "../models/Upload";
import mongoose from "mongoose";

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(undefined, "./uploads/");
  },
  filename: function(req, file, cb) {
    cb(undefined, new Date().toISOString() + file.originalname);
  }
});

const fileFilter = (req: Request, file: any, cb: any) => {
  // reject a file
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(undefined, true);
  } else {
    cb(undefined, false);
  }
};

const opts = {
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
};

const upload = multer(opts);

export let uploadMiddleware = upload.single("image");

/*
* uploading image
*/
export let post = (req: Request, res: Response) => {
  const newUpload = new Upload({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    image: req.file.path
  });

  newUpload
    .save()
    .then(result => {
      console.log(result);
      res.status(201).json({
        message: "Created product successfully",
        uploadedImage: {
          name: result.name,
          _id: result._id,
          request: {
            type: "GET",
            url: "http://localhost:8000/uploads/" + result._id
          }
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


/*
* getting image
*/
export let get = (req: Request, res: Response) => {
  const id = req.params.uploadId;
  Upload.findById(id)
    .select("name image _id owner")
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json({
          product: doc,
          request: {
            type: "GET",
            url: "http://localhost:8000/uploads/"
          }
        });
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};
