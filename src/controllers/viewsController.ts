import { Request, Response, NextFunction } from "express";

import { Tour } from "../models/tourModel";
import { User } from "../models/userModel";
import { Booking } from "../models/bookingModel";
import { Review } from "../models/reviewModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import { getAllBookings } from "./bookingController";

// WEBHOOK ALERTS INTERCEPTION MIDDLEWARE
export const alerts = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { alert } = req.query;

  if (alert === "booking")
    res.locals.alert =
      "Your booking was successful! Please check your email for confirmation. If you booking doesn't show up here immediately, please come back later.";

  next();
};

// RENDER HOMEPAGE | OVERVIEW PAGE
export const getOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get all the tour data from collection
    const tours = await Tour.find();

    // Render that template using the tour data from step 1
    res.status(200).render("overview", {
      title: "All Tours",
      tours,
    });
  },
);

// RENDER THE DETAILED TOUR PAGE
export const getTour = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get the data for the requested tour (reviews & users included)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: "reviews",
      select: "review rating user",
    });

    // Error handler
    if (!tour)
      return next(new AppError("There is no tour with that name.", 404));

    // Initialize a default booking & experienced status tracker
    let isBooked = false;
    let isExperienced = false;

    // Check if user is logged in, then verify if they already booked this specific tour
    if (res.locals.user) {
      const booking = await Booking.findOne({
        user: res.locals.user.id,
        tour: tour.id,
      });

      // If a booking document is found, set your status flag to true!
      if (booking) {
        isBooked = true;

        // Check if at least one start date in the array has occurred
        const now = new Date();
        const pastDates =
          tour.startDates?.filter((date: Date) => new Date(date) < now) || [];

        if (pastDates.length > 0) {
          isExperienced = true;
        }
      }
    }

    // RENDER TEMPLATE
    res.status(200).render("tour", {
      title: `${tour.name} Tour`,
      tour,
      isBooked,
      isExperienced,

      //   Inject mapbox access token from back-end
      mapboxToken: process.env.MAPBOX_ACCESS_TOKEN,

      //   Inject strip public key from back-end
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    });
  },
);

// RENDER SIGNUP FORM
export const getSignupForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Build template
  res.status(200).render("signup", { title: "Sign up to create an account." });
};

// RENDER LOGIN FORM
export const getLoginForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Build template
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

// RENDER USER ACCOUNT DASHBOARD PANEL
export const getAccount = (req: Request, res: Response): void => {
  res.status(200).render("account", {
    title: "Your account settings",
    user: req.user,
  });
};

// RENDER USER BOOKINGS (MY TOURS) SHEET PAGE
export const getMyTours = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Find all bookings
    const bookings = await Booking.find({ user: req.user!.id });

    // Extract the tour IDs from the booking document array list
    const tourIDs = bookings.map((el: any) => el.tour._id);

    // Query the tour collection to pull all matching document matching thos IDs
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render("my-bookings", {
      title: "My Tour Bookings",
      tours,
      user: req.user,
    });
  },
);

// RENDER UPDATE USER PAGE
export const updatedUserData = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // find User
    const updatedUser = await User.findByIdAndUpdate(
      req.user!.id,
      {
        // Update User's data
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).render("account", {
      title: "Your account",
      user: updatedUser,
    });
  },
);

// RENDER FORGOT PASSWORD INTERFACE REQUEST FORM
export const getForgotPasswordForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(200).render("forgotPassword", {
    title: "Recover Your Password",
  });
};

// RENDER RESET PASSWORD CONFIGURATION TARGET FORM
export const getResetPasswordForm = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  res.status(200).render("resetPassword", {
    title: "Reset New Password",
    token: req.params.token,
  });
};

// RENDER MY HISTORICAL REVIEWS MATRIX TAP PANEL
export const getMyReviews = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Find all reviews matching the active logged-in user profile indentifier
    const reviews = await Review.find({ user: req.user!.id }).populate({
      path: "tour",
      select: "name slug imageCover",
    });

    // Compile the dedicated dashboard view frame
    res.status(200).render("reviews", {
      title: "My Historical Reviews",
      reviews,
    });
  },
);
