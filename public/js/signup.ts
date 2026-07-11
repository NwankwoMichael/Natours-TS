import axios, { isAxiosError } from "axios";
import { showAlert } from "./alerts";
import { login } from "./login";

// INTERFACE FOR THE SIGNUP req.body
interface SignupBody {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: string;
}

export const signup = async (body: SignupBody): Promise<void> => {
  try {
    // Get body properties via destructuring
    const { name, email, password, passwordConfirm, role } = body;

    // Make an api call to the back-end via Axios
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/signup",
      data: {
        name,
        email,
        password,
        passwordConfirm,
        role,
      },
    });

    // CHeck if api call was successful
    if (res.data.status === "success") {
      // Display success message
      showAlert("success", "Welcome. Your signup was successful!");

      // Locate signup form and clear input fields
      const signupForm = document.querySelector(
        ".form--signup",
      ) as HTMLFormElement | null;

      if (signupForm) signupForm.reset();

      //   Initiate delay so user can read message
      window.setTimeout(() => {
        // Redirect user to homepage
        location.assign("/");
      }, 1500);
    }
    // } catch (err: any) {
    //   // Safe Axios checking
    //   if (isAxiosError(err) && err.response?.data) {
    //     showAlert("error", err.response.data.message);
    //   } else {
    //     showAlert(
    //       "error",
    //       "The server encountered an error during registration. Please try again later.",
    //     );
    //   }
    // }
  } catch (err: any) {
    // Use axios object checking & direct object extraction fallback
    const errorMessage =
      err.response?.data?.message || err.message || "Registration failed.";

    console.log("🕵️ SIGNUP FRONTEND ERROR LOGGED:", errorMessage);

    // Display the true server error message natively to your user
    showAlert("error", errorMessage);
  }
};
