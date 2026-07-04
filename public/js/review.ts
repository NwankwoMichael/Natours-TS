import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

export const createReview = async (
  tourId: string,
  review: string,
  rating: number,
): Promise<void> => {
  try {
    const res = await axios({
      method: "POST",
      url: `/api/v1/tours/${tourId}/my-reviews`,
      data: { review, rating },
      headers: { "Content-Type": "application/json" },
    });

    if (res.data.status === "success") {
      showAlert("success", "Thank you! Your review has been saved.");
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.data) {
      showAlert("error", "Network error. Review submission failed.");
    }
  }
};
