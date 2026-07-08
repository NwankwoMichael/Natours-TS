import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/userModel";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import Email from "../utils/email";

// HELPER FUNCTION TO SIGN JWT TOKEN CLEANLY
const signToken = (id: string): string => {
  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRES_IN) {
    throw new Error(
      "Missing critical JWT environment variables during signing!",
    );
  }
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
};

// HELPER FUNCTION TO COMPILE & SEND THE COOKIE TOKEN PAYLOAD
const createSendToken = (
  user: IUser,
  statusCode: number,
  res: Response,
): void => {
  // Explicit conversion of  internal objectId
  const token = signToken((user._id as any).toString());

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN || 90) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || (res.req as any).secure,
  };

  res.cookie("jwt", token, cookieOptions);

  //   Hide password from response output for security
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

// ///////////////// AUTH ROUTE HANDLERS ////////////////

// SIGNUP HANDLER
export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    // Generate your server application client-side landing dashboard URL
    const url = `${req.protocol}://${req.get("host")}/me`;

    // The Email Dispatch loop (wrapped in try/catch block)
    try {
      await new Email(newUser, url).sendWelcome();
    } catch (err) {
      console.error("💥 ERROR SENDING SIGNUP EMAIL:", err);
    }

    // Finalize session token creation and fire response
    createSendToken(newUser, 201, res);
  },
);

// LOGIN HANDLER
export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password)
      return next(new AppError("Please provide email and password!", 400));

    //   Check if user exists & password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password || "")))
      return next(new AppError("Incorrect email or password", 401));

    // If everything is ok, send token to client
    createSendToken(user, 200, res);
  },
);

// LOGOUT HANDLER
export const logout = (req: Request, res: Response): void => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success" });
};

// PROTECT ACESS GATEKEEPER MIDDLEWARE
export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // Get token from authorization headers or cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token)
      return next(
        new AppError(
          "You are not logged in! Please log in to get access.",
          401,
        ),
      );

    // B) Verify the token
    if (!process.env.JWT_SECRET)
      throw new Error("Missing critical JWT_SECRET enviroment variable!");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as jwt.JwtPayload & {
      id: string;
      iat: number;
    };

    // C) Check if the user still exists in the database
    const currentUser = await User.findById(decoded.id);

    if (!currentUser)
      return next(
        new AppError("The user belonging to this token no longer exists.", 401),
      );

    // D) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat))
      return next(
        new AppError(
          "User recently changed password! Please log in again.",
          401,
        ),
      );

    // Grant access to protected route by appending user data to request context
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  },
);

// IS LOGGED IN MIDDLEWARE (For server-rendered pug viewa templates)
export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check if token is securely stored inside the incoming request cookies
    if (req.cookies && req.cookies.jwt) {
      if (!process.env.JWT_SECRET) {
        throw new Error("Missing critical JWT_SECRET enviroment variable!");
      }

      // A) Verify token signature parameters
      const decoded = jwt.verify(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      ) as jwt.JwtPayload & { id: string; iat: number };

      // B) Check if user still exists in M
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // C) Check if password changed after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user: expose user profile info locally to pug views
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};

// RESTRICT TO ROLE WRAPPER MIDDLEWARE
export const restrictTo = (
  ...roles: ("user" | "guide" | "lead-guide" | "admin")[]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Fallback guard if request is missing
    if (!req.user)
      return next(
        new AppError(
          "You are not logged in! Please log in to get access.",
          401,
        ),
      );

    // Read the role whether it's a flat string, document, or nested data object
    const userRole = req.user.role || (req.user as any)._doc?.role;

    // Check if the user's role is permitted in the routing matrix argument block
    if (!userRole || !roles.includes(userRole)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();

    // Standard structural comparison safety block
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
  };
};

// FORGOT PASSWORD LIFECYCLE FLOW
export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // A) Find user on POSTed email address
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return next(
        new AppError("There is no user with that email address.", 404),
      );

    // B) Generate the random configuration reset token via model instance methods
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false }); // Save token database parameters bypassing strict options validators

    try {
      // C) Send token text back to the user via Email class utility
      const resetURL = `${req.protocol}://${req.get("host")}/reset-Password/${resetToken}`;

      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: "success",
        message: "Token sent to email successfully!",
      });
    } catch (err) {
      // Emergency rollback if email dispatch collapses
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500,
        ),
      );
    }
  },
);

// RESET PASSWORD LIFECYCLE FLOW
export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Force the token parameters to resolve as a strict string literal
    const tokenParam = String(req.params.token);

    // Get user base on hashed token route url matching criteria
    const hashedToken = crypto
      .createHash("sha256")
      .update(tokenParam)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }, //Token must still be valid
    });

    // B) If token has expired or is invalid, throw exception
    if (!user)
      return next(new AppError("Token is invalid or has expired!", 400));

    // Update user password parameters details
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    // Clear out the temporary resetPassword values
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Save forces model pre-save encryption blocks hooks to authomatically compile
    await user.save();

    // D) Log user in, drop cookies and send JWT to the client
    createSendToken(user, 200, res);
  },
);

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get user from collection
    const user = await User.findById(req.user!.id).select("+password");

    // Check if POSTed current password is correct
    if (
      !user ||
      !(await user?.correctPassword(
        req.body.passwordCurrent,
        user.password || "",
      ))
    )
      return next(new AppError("Your current password is wrong", 401));

    // Update password
    console.log("Updating password for user:", req.user!.id);
    user.password = req.body.password;

    console.log("New passwords:", req.body.password);
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    // Log user in, send JWT
    createSendToken(user, 200, res);
  },
);
