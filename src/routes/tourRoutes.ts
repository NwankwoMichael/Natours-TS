import express from "express";
import * as tourController from "../controllers/tourController";
import * as authController from "../controllers/authController";
import reviewRouter from "../routes/reviewRoutes";

const router = express.Router();

// NESTED ROUTE
router.use("/:tourId/reviews", reviewRouter);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan,
  );

// Special Alias Routes
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Aggregation Analytics Open Data Pipelines
router.route("/tour-stats").get(tourController.getTourStats);

//   Geospatial Routing Engine
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour,
  );

// STANDARD LOOKUP PARAMETER CATCHER
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour,
  );

// Export Router
export default router;
