import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

/**
 * Sends profile updates or password updates to the backend API
 * @param data object containing text data or a formData instance for files/photos
 * @param type Strict filter: "data" or "password"
 */

// Type is either password || "data"
export const updateSettings = async (
  data: Object | FormData,
  type: "data" | "password",
): Promise<void> => {
  try {
    const url =
      type === "password"
        ? "/api/v1/users/updateMyPassword"
        : "/api/v1/users/updateMe";

    // Configure strict headers so Axios handles raw oobjects and formData correctly
    const isForm = data instanceof FormData;

    const res = await axios({
      method: "PATCH",
      url,
      data,
      headers: isForm ? {} : { "content-Type": "application/json" },
    });

    if (res.data.status === "success") {
      showAlert("success", `${type.toUpperCase()} updated successfully!`);

      // Force a slight pause so the user can read the green banner before refresh
      window.setTimeout(() => {
        location.reload();
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
