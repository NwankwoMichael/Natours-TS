import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

/**
 * Dispatches a password recovery request link to the user's email address
 * @param email The account email input string
 */

export const forgotPassword = async (email: string): Promise<void> => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/forgotPassword",
      data: { email },
      headers: { "Content-Type": "application/json" },
    });

    if (res.data.status === "success") {
      showAlert("success", "Token sent to email! Check your inbox.");
    }

    // Redirect back home after a brief delay
    window.setTimeout(() => {
      location.assign("/");
    }, 2000);
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.data) {
      showAlert(
        "error",
        err.response.data.message || "Failed to dispatch reset link.",
      );
    } else {
      showAlert("error", "Network connection failed. Please try again.");
    }
  }
};

/**
 * Transmits the new password configuration fields directly to the server database
 * @param token The raw unhashed crypto parameter string extracted from the active viewport URL path
 * @param data Object containing the raw string parameters password and passwordConfirm
 */

export const resetPassword = async (
  token: string,
  data: Object,
): Promise<void> => {
  try {
    const res = await axios({
      method: "PATCH",
      url: `/api/v1/users/resetPassword/${token}`,
      data,
      headers: { "Content-Type": "application/json" },
    });

    if (res.data.status === "success") {
      showAlert(
        "success",
        "Password updated successfully! Redirecting to accout...",
      );

      // Automatically land user on main account profile screen
      window.setTimeout(() => {
        location.assign("/me");
      }, 1500);
    }
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.data) {
      showAlert(
        "error",
        err.response.data.message || "Token is invalid or has expired.",
      );
    } else {
      showAlert(
        "error",
        "Network connection error. Token verification failed.",
      );
    }
  }
};
