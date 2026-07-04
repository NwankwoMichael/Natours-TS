import mongoose from "mongoose";
import { Schema, model, Document, Types, Query, Aggregate } from "mongoose";
import slugify from "slugify";
// import { LargeNumberLike } from "node:crypto";

// DEFINE THE TYPESCRIPT INTERFACE

export interface IGeoJSONPoint {
  type: "Point";
  coordinates: number[];
  address?: string;
  description?: string;
  day?: number;
}

export interface ITour extends Document {
  name: string;
  slug?: string;
  duration: number;
  maxGroupSize: number;
  difficulty: "easy" | "medium" | "difficult";
  ratingsAverage: number;
  ratingsQuantity: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description: string;
  imageCover: string;
  images: string[];
  createdAt: Date;
  startDates: Date[];
  secretTour: boolean;
  startLocation: IGeoJSONPoint;

  locations: IGeoJSONPoint[];
  guides: Types.ObjectId[] | string[];
  durationWeeks?: number;
  reviews?: any[];
}

const tourSchema = new mongoose.Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      maxlength: [40, "A tour must have less than or equal 40 characters. "],
      minlength: [10, "A tour must have equal or more than 10 characters."],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: ITour, value: number) {
          // this only points to current doc on new docy=ument creation
          return value < this.price;
        },
        message: `Discount price ({value}) should be less than the reegular price.`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number], // Longitude first and latitude second
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, //Embedding
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// SETTING INDEXES FOR STARTLOCATION
tourSchema.index({ startLocation: "2dsphere" });

// SETTING INDEXES FOR THE PRICE FIELD (single-field index)
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual("durationWeeks").get(function (this: ITour): number {
  return this.duration / 7;
});

// VIRTUAL POPULATE
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create command
tourSchema.pre("save", function (this: ITour) {
  this.slug = slugify(this.name, { lower: true });
});

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (this: Query<any, ITour> & { start?: any }) {
  // 'this' is the query object!
  this.find({ secretTour: { $ne: true } });

  // Create new start property on a fly
  this.start = Date.now();
});

tourSchema.post(
  /^find/,
  function (this: Query<any, ITour> & { start?: any }, docs: Document) {
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  },
);

// AGGREGATION MIDDLEWARE
tourSchema.pre("aggregate", function (this: Aggregate<any>) {
  // Extract the pipeline reference once to optimize memory
  const pipeline = this.pipeline();

  // Safely exit if the pipeline is empty or starts with a geospatial step
  if (pipeline.length > 0 && "$geoNear" in pipeline[0]) return;

  // Inject the data firewall cleanly into the query matrix
  pipeline.unshift({
    $match: { secretTour: { $ne: true } },
  });
});

// THE POPULATION HOOK: Automatically replaces guide IDs with full User documents on all find queries
tourSchema.pre(/^find/, function (this: any, next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt ",
  });
});

export const Tour = model<ITour>("Tour", tourSchema);
