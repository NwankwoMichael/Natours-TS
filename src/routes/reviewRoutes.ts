import express from "express";
// import * as userController from "../controllers/userController";
import * as authController from "../controllers/authController";
import * as reviewController from "../controllers/reviewController";

// MERGE PARAMS: PASSES THE :TOURID PARAMETER FROM THE TOUR ROUTER
const router = express.Router({ mergeParams: true });

// PROTECT MATRIX: ALL REVIEW ACTIVITY REQUIRE AN AUTHENTICATED LOGIN SESSION
router.use(authController.protect);

// STANDARD BASE & NESTED ENDPOINTS MATRIX
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.restrictToExperiencedBookers,
    reviewController.createReview,
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo("admin", "user"),
    reviewController.deleteReview,
  );

export default router;
