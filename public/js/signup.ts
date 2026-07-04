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

      //   Initiate delay so user can read message
      window.setTimeout(async () => {
        // Log user in via email and password from body
        await login(email, password);
      }, 1500);
    }
  } catch (err: unknown) {
    // Safe Axios checking
    if (isAxiosError(err) && err.response?.data) {
      showAlert("error", err.response.data.message);
    } else {
      showAlert("error", "Network connection failed. Please try again later.");
    }
  }
};
