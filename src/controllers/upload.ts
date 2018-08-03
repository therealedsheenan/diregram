import { Request, Response, NextFunction } from "express";
import multer  from "multer";
import mongoose from "mongoose";

import { default as Upload, UploadModel } from "../models/Upload";

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
export let postUpload = (req: Request, res: Response, next: NextFunction) => {
  const newUpload = new Upload({
    _id: new mongoose.Types.ObjectId(),
    image: req.file.path
  });

  newUpload
    .save()
    .then((result: UploadModel) => {
      // console.log(result);
      req.upload = result;
      next();
      // res.status(201).json({
      //   message: "Uploaded image successfully",
      //   upload: {
      //     _id: result._id,
      //     image: result.image
      //   }
      // });
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
export let getUpload = (req: Request, res: Response) => {
  const id = req.params.uploadId;
  Upload.findById(id)
    .select("name image _id owner")
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json({
          upload: doc
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
