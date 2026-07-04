import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";

// INFORM TYPESCRIPT ABOUT THE GLOBAL STRIP FUNCTION PROVIDED BY THE CDN SCRIPT TAG
interface Window {
  stripe: (publicKey: string) => any;
}

/**
 * Initiates the checkout flow by generating a Stripe session and redirecting the client
 * @param tourId The 24-character Mongoose Tour object ID string
 * @param stripePublicKey The backend-provided public key string from your environment
 */

export const bookTour = async (
  tourId: string,
  stripePublicKey: string,
): Promise<void> => {
  try {
    //  Acess the global Stripe function via window casting
    const StripeFunc = (window as any).Stripe;

    // Guard clause
    if (!StripeFunc) {
      throw new Error("Stripe script failed to load from CDN!");
    }

    // Initialize stripe dynamically using passed public key
    const stripe = StripeFunc(stripePublicKey);

    // Get checkout session from server
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // Create checkout form + charge credit card + redirect user to Stripe's secure payment overlay screen
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err: unknown) {
    console.error(err);

    // Safely extract error message string properties to display alert banner
    if (isAxiosError(err) && err.response?.data) {
      showAlert(
        "error",
        err.response.data.message || "Checkout transaction failed.",
      );
    } else if (err instanceof Error) {
      showAlert("error", err.message);
    } else {
      showAlert(
        "error",
        "An unknown error occured during trasactional preparation.",
      );
    }
  }
};
