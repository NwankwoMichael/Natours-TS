import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import sharp from "sharp";
import { Tour, ITour } from "../models/tourModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import * as factory from "./handlerFactory";

// Configure Multer Memory Storage
const multerStorage = multer.memoryStorage();

// Configure Multer File Filter to Stricty Accept Images
const multerFilter = (
  req: Request,
  file: Express.Multer.File, // Using the globally available multer file type
  cb: FileFilterCallback, // Using the official callback type
): void => {
  //Accept the file
  if (file.mimetype.startsWith("image")) return cb(null, true);

  // Reject the file
  cb(
    new AppError("Not an Image! Please upload only images.", 400) as any,
    false,
  );
};

// Create the Upload instance config
export const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB size limit
});

export const uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// IMAGE PROCESSOR MIDDLEWARE
export const resizeTourImages = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Cast req.file safely to an object dictionary containing multer file arrays
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    // Safely check if both fields exists before proceeding
    if (!files || !files.imageCover || !files.images) return next();

    // ////// Process Cover Image ////////

    // Grab the First (and only) File in ImageCover Array
    const imageCoverFile = files.imageCover[0];
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(imageCoverFile.buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);

    // ////////  Process Images Array  /////////

    // Initialize an empty array on req.body.images to store filenames
    req.body.images = [];

    // Use Promise.all to resize all images concurrently for optional speed
    await Promise.all(
      files.images.map(async (file, index) => {
        // Initialize File Name
        const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

        // Use Sharp Image Processor to Resize and Process each Image File
        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${filename}`);

        //   Push the compiled filename into your body array matrix
        req.body.images.push(filename);
      }),
    );
    next();
  },
);

// /////////////// MIDDLEWARE ////////////////
export const aliasTopTours = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty,";
  next();
};

// ////////////// ROUTE HANDLERS ////////////////
// Get All Tours
export const getAllTours = factory.getAll(Tour);

// Get Single Tour
export const getTour = factory.getOne(Tour, { path: "reviews" }); // Passing populate configuration

// Create Tour
export const createTour = factory.createOne(Tour);

// Update Tour
export const updateTour = factory.updateOne(Tour);

// Delete Tour
export const deleteTour = factory.deleteOne(Tour);

//  Get Tour Stats
export const getTourStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: { $toUpper: "$difficulty" },
          numTours: { $sum: 1 },
          numRatings: { $sum: "$ratingsQuantity" },
          avgRating: { $avg: "$ratingsAverage" },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
    ]);
    res.status(200).json({ status: "success", data: { stats } });
  },
);

// Get Monthly Plan
export const getMonthlyPlan = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const year = +req.params.year;

    const plan = await Tour.aggregate([
      {
        $unwind: "$startDates",
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$startDates" },
          numTourStarts: { $sum: 1 },
          tours: { $push: "$name" },
        },
      },
      {
        $addFields: { month: "$_id" },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: {
          numTourStarts: -1,
        },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({ status: "success", data: { plan } });
  },
);

// Define Interface For Specific Routes Params
interface TourWithinParams {
  distance: string;
  latlng: string;
  unit: string;
  [key: string]: string | undefined; // Fallback index signature required by express 5
}
// Get Tour Within
export const getToursWithin = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get Route Parameters
    const { distance, latlng, unit } =
      req.params as unknown as TourWithinParams;

    //   Guard clause to ensure both strings exists before calling split
    if (!latlng)
      return next(
        new AppError("Please provide latitude and longitude parameters.", 400),
      );

    // Get latitude & longitude from latlng
    const [lat, lng] = latlng.split(",");

    // Ensure lat, lng exists
    if (!lat || !lng)
      return next(
        new AppError(
          "Please provide latitude and longitude in the format lat,lng.",
          400,
        ),
      );

    // Convert strings to float metrics for geospatial math radius boundaries
    const radius = unit === "mi" ? +distance / 3963.2 : +distance / 6378.1;

    //   Get Tours That Match Geospatial Query
    const tours = await Tour.find({
      startLocation: {
        $geoWithin: { $centerSphere: [[Number(lng), Number(lat)], radius] },
      },
    });

    res.status(200).json({
      status: "success",
      results: tours.length,
      data: { data: tours },
    });
  },
);

// Get Distances
export const getDistances = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get parameters using casting pattern
    const { latlng, unit } = req.params as unknown as TourWithinParams;

    // Guard clause to ensure latlng exists before calling split
    if (!latlng)
      return next(
        new AppError(
          "Please provide a latitude and longitude in format lat,lng.",
          400,
        ),
      );

    // Get latitude & longitude from latlng
    const [lat, lng] = latlng.split(",");

    // Testing for the unit
    const multiplier = unit === "mi" ? 0.000621371 : 0.001;

    // Guard clause to ensure lat & lng exists
    if (!lat || !lng)
      return next(
        new AppError(
          "Please provide a latitude and a longitude in the format lat,lng",
          400,
        ),
      );

    // Commence Geospatial aggregation
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [+lng, +lat], // longitude first, latitude second
          },
          distanceField: "distance",
          distanceMultiplier: multiplier,
        },
      },
      {
        $project: {
          distance: 1,
          name: 1,
        },
      },
    ]);

    // Send Response to client
    res.status(200).json({
      status: "success",
      data: { data: distances },
    });
  },
);
