import mongoose, { Schema, model, Document, Types } from "mongoose";
import { throwDeprecation } from "node:process";

// DEFINE THE BOOKING TYPESCRIPT INTERFACE
export interface IBooking extends Document {
  tour: Types.ObjectId | string;
  user: Types.ObjectId | string;
  price: number;
  createdAt: Date;
  paid: boolean;
}

// BUILD THE MONGOOSE SCHEMA MATCHING THE INTERFACE DEFINITIONS
const bookingSchema = new Schema<IBooking>(
  {
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "A booking must belong to a tour!"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A booking must belong to a user!"],
    },
    price: {
      type: Number,
      required: [true, "A booking must have a price!"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    paid: {
      type: Boolean,
      default: true, // Bookings are created post-payment
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// QUERY MIDDLEWARE: Automatically populate tour and user details on lookup
bookingSchema.pre(/^find/, function (this: mongoose.Query<any, IBooking>) {
  this.populate("user").populate({
    path: "tour",
    select: "name", // Only return the tour name to keep payload weight light
  });
});

// COMPILE & EXPORT THE BOOKING MODEL
export const Booking = model<IBooking>("Booking", bookingSchema);
