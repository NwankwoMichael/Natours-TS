import { Request, Response, NextFunction } from "express";
import { Review } from "../models/reviewModel";
import { Booking } from "../models/bookingModel";
import { Tour } from "../models/tourModel";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import * as factory from "./handlerFactory";

// MIDDLEWARE TO INTERCEPT NESTED ROUTE PARAMETERS FOR CREATION
export const setTourUserIds = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Assign tourId parameter
  if (!req.body.tour) req.body.tour = req.params.tourId;

  // Pull the direct primary key context string from your session matrix
  if (!req.body.user) req.body.user = req.user!._id;

  next();
};

// BACKEND SECURITY LAYER: Restricts API submissions strictly to authenticated, experienced customers
export const restrictToExperiencedBookers = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fetch any booking matching this specific user and target tour ID
    const tourId = req.params.tourId || req.body.tour;
    const booking = await Booking.findOne({
      user: req.user!.id,
      tour: tourId,
    });

    if (!booking)
      return next(
        new AppError(
          "You can only review tours that you have officially booked",
          403,
        ),
      );

    // Fetch the target tour to inspect its date parameters array matrix
    const tour = await Tour.findById(tourId);
    if (!tour) return next(new AppError("No tour found with that ID.", 404));

    // Confirm that at least one departure date occurred in the past
    const now = new Date();
    const pastDates =
      tour.startDates?.filter((date: Date) => new Date(date) < now) || [];

    if (pastDates.length === 0)
      return next(
        new AppError(
          "You can not review this tour until you have actually completed the experience!",
          403,
        ),
      );

    next();
  },
);

// AUTOMATEDD FACTORY CRUD HANDLERS
export const getAllReviews = factory.getAll(Review);
export const getReview = factory.getOne(Review);
export const createReview = factory.createOne(Review);
export const updateReview = factory.updateOne(Review);
export const deleteReview = factory.deleteOne(Review);
