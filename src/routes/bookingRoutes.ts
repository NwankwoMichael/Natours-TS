import express from "express";
import * as bookingController from "../controllers/bookingController";
import * as authController from "../controllers/authController";
// import * as viewsController from "../controllers/viewsController";

const router = express.Router();

// PROTECT MATRIX
router.use(authController.protect);

// TRANSACTION CHECKOUT ROUTE
router.get("/checkout-session/:tourId", bookingController.getCheckoutSession);

// RESTRICT ACCESS
router.use(authController.restrictTo("admin", "lead-guide"));

// SYSTEM ADMINISTRATIVE LEDGER MANAGEMENT ROUTES
router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

export default router;
