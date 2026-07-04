import express from "express";
import * as userController from "../controllers/userController";
import * as authController from "../controllers/authController";

const router = express.Router();

// PUBLIC ROUTES
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
router.use(authController.protect);

// SPECIFIC AUTHENTICATED USER LIFECYCLE ROUTES
router.patch("/updateMyPassword", authController.updatePassword);

router.get("/me", userController.getMe, userController.getUser);

router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

router.delete("/deleteMe", userController.deleteMe);

// RESTRICT ALL ROUTES AFTER THIS TO ONLY ADMIN
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

//   DYNAMIC PARAMETER ROUTES
router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(authController.restrictTo("admin"), userController.deleteUser);

export default router;
