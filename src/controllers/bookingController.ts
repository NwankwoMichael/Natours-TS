import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Stripe from "stripe";
import { User } from "../models/userModel";
import { Tour } from "../models/tourModel";
import { Booking } from "../models/bookingModel";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import * as factory from "./handlerFactory";
// import { Review } from "../models/reviewModel";

// INITIALIZE STRIPE SECURELY WITH YOUR ENVIROMENT SECRET KEY CONFIG MATRIX
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// STRIPE CHECKOUT SESSION GENERATOR HANDLER
export const getCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Fetch the target tour document based on route params ID context
    const tour = await Tour.findById(req.params.tourId);

    if (!tour) return next(new AppError("No tour found with that ID", 404));

    // Force the tourId parameters to resolve as a strict string literal
    const tourIdParam = String(req.params.tourId);

    // Generate the secure checkout session config stream via Stripe API
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      // Temporary development query string fallback loop strategy (Refactored later via webhooks)
      // success_url: `${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user!._id}&price=${tour.price}`,

      //  LIVE PRODUCTION STANDARD PATHWAY (Clean, fast, and completely secure):
      success_url: `${req.protocol}://${req.get("host")}/my-tours?alert=booking`,
      cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
      customer_email: req.user!.email,
      client_reference_id: tourIdParam,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              // images: [`https://natours.dev{tour.imageCover"}`],
            },
          },
          quantity: 1,
        },
      ],
      //   mode: "payment",
    } as any);

    // Dispatch checkout session context payload parameters state straight back to client
    res.status(200).json({
      status: "success",
      session,
    });
  },
);

// TEMPORARY INLINE CHECKOUT COMPLETION HANDLER FOR DEVELOPMENT (PUG INTEGRATION FALLBACK)
export const createBookingCheckout = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { tour, user, price } = req.query;

    if (!tour || !user || !price) return next();

    // Create the booking document tracking matrix item manually out of query parameters
    await Booking.create({
      tour: String(tour),
      user: String(user),
      price: Number(price),
    });

    // Strip out the dirty transactional metrics from the browser address bar for security
    res.redirect(req.originalUrl.split("?")[0]);
  },
);

// PIVATE HELPER FUNCTION TO HANDLE WRITING THE BOOKING LEDGER DIRECTLY IN MONGODB
const createBookingCheckoutDirect = async (session: any): Promise<void> => {
  const tour = session.client_reference_id;

  // Fall back to customer_details if customer_email returns undefined!
  const userEmail = session.customer_email || session.customer_details?.email;

  if (!userEmail) {
    console.warn(
      "⚠️ WEBHOOK WARNING: No customer email address detected inside Stripe session data payload.",
    );
    return;
  }
  const user = (await User.findOne({ email: userEmail }))?._id;

  const price = session.amount_total / 100; // Convert cents to base dollar decimals

  // Ensure tour ID is a valid ObjectId structure, to prevent 500 error
  const isValidObjectId = mongoose.Types.ObjectId.isValid(tour);

  if (tour && user && isValidObjectId) {
    await Booking.create({ tour, user, price });
    console.log(
      "✨ WEBHOOK SUCCESS: Booking ledger saved to MongoDB database cleanly!",
    );
  } else {
    console.warn(
      "⚠️ WEBHOOK WARNING: Booking skipped. Missing IDs or client_reference_id is an invalid ObjectId.",
    );
  }
};

// THE SECURE BACKGROUND STRIPE WEBHOOK HANDLER
export const webhookCheckout = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const signature = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;

    try {
      // Cryptographically verify that this request come directly from Stripe's official servers
      event = stripe.webhooks.constructEvent(
        req.body, // un-parsed raw binary buffer from express.raw()
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string,
      );
    } catch (err: any) {
      // If someone tries to forge a payment success request, block asap!
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Intercept the specific payment completion signal event
    if (event.type === "checkout.session.completed") {
      // Execute the database write operation securely in the background
      await createBookingCheckoutDirect(event.data.object);
    }

    // Always return a 200 ok status directly to Stripe to acknoledge receipt of the signal
    res.status(200).json({ received: true });
  },
);

// AUTOMATED FACTORY LEDGER ADMIN CRUD HANDLERS
export const createBooking = factory.createOne(Booking);
export const getBooking = factory.getOne(Booking);
export const getAllBookings = factory.getAll(Booking);
export const updateBooking = factory.updateOne(Booking);
export const deleteBooking = factory.deleteOne(Booking);
