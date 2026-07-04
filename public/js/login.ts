import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

/**
 * Sends user credentials to the authentication API endpoint
 * @param email User email address string
 * @param password User plain text password string
 */

export const login = async (email: string, password: string): Promise<void> => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err: unknown) {
    // Safe Axios checking
    if (isAxiosError(err) && err.response?.data) {
      showAlert("error", err.response.data.message);
    } else {
      showAlert("error", "Network connection failed. Please try again.");
    }
  }
};

/**
 * Request the server to invalidate the active JWT cookie session
 */

export const logout = async (): Promise<void> => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/logout",
    });
    if (res.data.status === "success")
      // Reload login page
      location.assign("/login");
  } catch (err: unknown) {
    console.log(err);
    // Safe Axios checking
    if (isAxiosError(err) && err.response) {
      console.log(err.response);
    }
    showAlert("error", "Error logging out! Try again.");
  }
};

// Reload page programatically
// location.reload()
