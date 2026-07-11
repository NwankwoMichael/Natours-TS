// import "@babel/polyfill";
import { displayMap } from "./mapbox";
import { login, logout } from "./login";
import { signup } from "./signup";
import { forgotPassword, resetPassword } from "./retrievePassword";
import { createReview } from "./review";

import { updateSettings } from "./updateSettings";
import { bookTour } from "./stripe";
import { showAlert } from "./alerts";

// EXTEND WINDOW INTERFACE FOR THE MAPBOX GL VARIABLE CHECK
interface Window {
  mapboxgl?: any;
}

// DOM ELEMENTS SELECTION MATRIX WITH EXPLICI TYPES
const mapBox = document.getElementById("map") as HTMLDivElement | null;
const loginForm = document.querySelector(
  ".form--login",
) as HTMLFormElement | null; //--login
const signupForm = document.querySelector(
  ".form--signup",
) as HTMLFormElement | null;
const logoutBtn = document.querySelector(
  ".nav__el--logout",
) as HTMLAnchorElement | null;
const userUpdateForm = document.querySelector(
  ".form-user-data",
) as HTMLFormElement | null;
const userPasswordForm = document.querySelector(
  ".form-user-settings",
) as HTMLFormElement | null;
const bookBtn = document.getElementById(
  "book-tour",
) as HTMLButtonElement | null;
const forgotForm = document.querySelector(
  ".form--forgot-password",
) as HTMLFormElement | null;
const resetForm = document.querySelector(
  ".form--reset-password",
) as HTMLElement | null;
const reviewForm = document.querySelector(
  ".form--review",
) as HTMLFormElement | null;

// ////////// ACTION EVENT DELEGATIONS ////////////

// MAPBOX INITIATOR
if (mapBox) {
  // Force execution only after CDN Library loads completely
  if (typeof (window as any).mapboxgl !== "undefined") {
    // dataset variables can technically be undefined; force string handling
    const locationsData = mapBox.dataset.locations || "[]";
    const mapboxToken = mapBox.dataset.mapboxToken || "";
    const locations = JSON.parse(locationsData);
    displayMap(locations, mapboxToken);
  } else {
    console.error("Mapbox script not loaded from CDN");
  }
}

// ATTACH SIGNUP ACTION LISTENER
if (signupForm) {
  signupForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    // Select input element parameters
    const nameEl = document.getElementById("name") as HTMLInputElement | null;
    const emailEl = document.getElementById("email") as HTMLInputElement | null;
    const passwordEl = document.getElementById(
      "password",
    ) as HTMLInputElement | null;
    const passwordConfirmEl = document.getElementById(
      "password-confirm",
    ) as HTMLInputElement | null;

    // Select role-input only if it exists (e.g., on special admin panels)
    const roleEl = document.getElementById("role") as HTMLInputElement | null;

    if (nameEl && emailEl && passwordEl && passwordConfirmEl) {
      try {
        const body = {
          name: nameEl.value,
          email: emailEl.value,
          password: passwordEl.value,
          passwordConfirm: passwordConfirmEl.value,
          role: roleEl ? roleEl.value : "user",
        };

        console.log("Communicating with registration API...");

        await signup(body);

        console.log("Account creation lifycycle complete!");
      } catch (error) {
        console.log("💥 CRITICAL FRONTEND BREAKDOWN:", error);
      }
    } else {
      console.error(
        "❌ Critical Error: One or more registration DOM fields are missing!",
      );
    }
  });
}

// USER LOGIN FORM SUBMISSION INTERCEPTOR
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById("email") as HTMLInputElement | null;
    const passwordEl = document.getElementById(
      "password",
    ) as HTMLInputElement | null;

    if (emailEl && passwordEl) await login(emailEl.value, passwordEl.value);
  });
}

// USER LOGOUT ACTION TRIGGER
if (logoutBtn)
  logoutBtn.addEventListener("click", async (e: Event) => {
    e.preventDefault();
    await logout();
  });

// PROFILE RE-METRICS UPDATE FORM INTERCEPTOR (Multer Data Layer Processing)
if (userUpdateForm)
  userUpdateForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    // PROGRAMATICALLY CREATE A MULTIPART FORM DATA
    const form = new FormData();
    const nameInput = document.getElementById(
      "name",
    ) as HTMLInputElement | null;
    const emailInput = document.getElementById(
      "email",
    ) as HTMLInputElement | null;
    const photoInput = document.getElementById(
      "photo",
    ) as HTMLInputElement | null;

    // One append for each data we intend to send
    if (nameInput) form.append("name", nameInput.value);
    if (emailInput) form.append("email", emailInput.value);

    // Select the image file. (.files = [], hence index[0])
    if (photoInput && photoInput.files && photoInput.files[0])
      form.append("photo", photoInput.files[0]);

    // axios recognizes form as an object & works as it should
    await updateSettings(form, "data");
  });

// ACCOUNT PASSWORD MODIFICATION SUBMISSION INTERCEPTOR
if (userPasswordForm)
  userPasswordForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();
    const savePasswordBtn = document.querySelector(
      ".btn--save-password",
    ) as HTMLButtonElement | null;

    if (savePasswordBtn) savePasswordBtn.textContent = "Updating...";

    const passwordCurrent = (
      document.getElementById("password-current") as HTMLInputElement
    ).value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;
    const passwordConfirm = (
      document.getElementById("password-confirm") as HTMLInputElement
    ).value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password",
    );

    if (savePasswordBtn) savePasswordBtn.textContent = "Save password";

    //  Clear inputs out cleanly for security
    userPasswordForm.reset();
  });

// STRIPE BILLING TRANSACTION REDIRECT TRIGGER
if (bookBtn)
  bookBtn.addEventListener("click", (e: Event) => {
    // style the display text
    const target = e.target as HTMLButtonElement;
    target.textContent = "Processing...";

    //Get tour id
    const { tourId, stripePublicKey } = target.dataset;

    if (tourId && stripePublicKey) {
      // Call bookTour
      bookTour(tourId, stripePublicKey);
    } else {
      target.textContent = "Book tour now!";
      showAlert("error", "Missing critcal checkout parameter data.");
    }
  });

// FORGOT PASSWORD SUBMISSTION INTERCEPTION
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    const emailEl = document.getElementById("email") as HTMLInputElement | null;

    if (emailEl) {
      const email = emailEl.value;
      await forgotPassword(email);

      // Clear input field
      forgotForm.reset();
    }
  });
}

// RESET PASSWORD SUBMISSION INTERCEPTOR
if (resetForm) {
  resetForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    // Extract raw cryptographic token parameter from form element data-attribute metadata
    const token = resetForm.dataset.token || "";

    const passwordEl = document.getElementById(
      "password",
    ) as HTMLInputElement | null;
    const passwordConfirmEl = document.getElementById(
      "password",
    ) as HTMLInputElement | null;

    if (passwordEl && passwordConfirmEl && token) {
      const body = {
        password: passwordEl.value,
        passwordConfirm: passwordConfirmEl.value,
      };

      await resetPassword(token, body);
    } else {
      showAlert(
        "error",
        "Critical initialization failure: Token metadata missing.",
      );
    }
  });
}

if (reviewForm) {
  reviewForm.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    const tourId = reviewForm.dataset.tourId || "";
    const ratingEl = document.getElementById(
      "review-rating",
    ) as HTMLSelectElement | null;
    const textEl = document.getElementById(
      "review-text",
    ) as HTMLTextAreaElement | null;

    if (tourId && ratingEl && textEl) {
      await createReview(tourId, textEl.value, +ratingEl.value);

      // Clear input fields
      reviewForm.reset();
    }
  });
}

// INBOUND WEV+BHOOK ALERTS INTERCEPTOR
const bodyElement = document.querySelector("body") as HTMLBodyElement | null;
const alertMessage = bodyElement?.dataset.alert;
if (alertMessage) showAlert("success", alertMessage, 20);
