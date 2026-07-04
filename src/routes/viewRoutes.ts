import express from "express";
import * as viewsController from "../controllers/viewsController";
import * as authController from "../controllers/authController";
import * as bookingController from "../controllers/bookingController";

// INITIALIZE ROUTER
const router = express.Router();

// WEBHOOK ALERTS MATRIX

// Runs At The Very Top To Catch Stripe Success Parameters Before rendering Any Views Context
router.use(viewsController.alerts);

// PUBLIC VIEW TEMPLATE ROUTES

// Applies isLoggedIn Globally to Expose User Sessions to your Top Header Bars Automatically (Development)
// router.get(
//   "/",
//   bookingController.createBookingCheckout,
//   authController.isLoggedIn,
//   viewsController.getOverview,
// );

//  LIVE PRODUCTION STANDARD ROUTE (Clean, fast, and optimized):
router.get("/", authController.isLoggedIn, viewsController.getOverview);

router.get("/tour/:slug", authController.isLoggedIn, viewsController.getTour);

router.get("/login", authController.isLoggedIn, viewsController.getLoginForm);

router.get("/signup", authController.isLoggedIn, viewsController.getSignupForm);

// SECURED PRIVATE VIEW DASHBOARD ROUTES

// Uses Protect Inline to Redirect or Block Unauthenticated Guest From Accessing Dashboards
router.get("/me", authController.protect, viewsController.getAccount);
router.get("/my-tours", authController.protect, viewsController.getMyTours);

// SECURELY REGISTERS THE USER REVIEWS DASHBOARD PATH MAPPING
router.get("/my-reviews", authController.protect, viewsController.getMyReviews);

// PASSWORD RECOVERY WORKFLOW VIEW PATHS
router.get(
  "/forgot-password",
  authController.isLoggedIn,
  viewsController.getForgotPasswordForm,
);

router.get(
  "/reset-password/:token",
  authController.isLoggedIn,
  viewsController.getResetPasswordForm,
);

// HTML FORM LIFECYCLE ACTION SUBMISSIONS
router.post(
  "/submit-user-data",
  authController.protect,
  viewsController.updatedUserData,
);

export default router;
