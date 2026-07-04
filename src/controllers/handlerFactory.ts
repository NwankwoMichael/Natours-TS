import mongoose, { Model, Document } from "mongoose";
import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import APIFeatures from "../utils/apiFeatures";

// FACTORY HANDLER TO DELETE A DOCUMENT BY ID
export const deleteOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new AppError("No document found with that ID", 404));
      }

      res.status(204).json({
        status: "success",
        data: null,
      });
    },
  );

//   FACTORY TO UPDATE A DOCUMENT BY ID
export const updateOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        returnDocument: "after",
        runValidators: true,
      });

      if (!doc) {
        return next(new AppError("No document found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    },
  );

//   FACTORY HANDLER TO CREATE A NEW DOCUMENT
export const createOne = <T extends Document>(Model: Model<T>) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const doc = await Model.create(req.body);

      res.status(201).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    },
  );

//   FACTORY TO GET A SINGLE DOCUMENT (with optional populate options)
export const getOne = <T extends Document>(Model: Model<T>, popOptions?: any) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      let query = Model.findById(req.params.id);
      if (popOptions) query = query.populate(popOptions);

      const doc = await query;

      if (!doc) {
        return next(new AppError("No document found with that ID", 404));
      }

      res.status(200).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    },
  );

//   FACTORY HANDLER TO FETCH ALL DOCUMENTs
export const getAll = <T extends Document>(Model: Model<T>) =>
  catchAsync(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      // Keep the filter signature dynamic
      let filter: Record<string, any> = {};

      // Capture nested routes identifiers cleanly
      if (req.params.tourId) {
        filter = { tour: req.params.tourId };
      }

      // Cast 'filter as any' to bypass strict generic checking seamlessly
      const features = new APIFeatures<T, {}>(
        Model.find(filter as any),
        req.query,
      )
        .filter()
        .sort()
        .limitFields()
        .paginate();

      const doc = await features.query;

      // Send Response
      res.status(200).json({
        status: "success",
        results: doc.length,
        data: {
          data: doc,
        },
      });
    },
  );
