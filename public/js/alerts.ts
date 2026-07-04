// Finds and removes any existing alert banner from the DOM
export const hideAlert = (): void => {
  const el = document.querySelector(".alert");
  // Remove Child Element
  if (el) el.remove();
};

/**
 * Inject a temporary status banner at the very top of the webpage body view
 * @param type Strict status filter" "success" or "error"
 * @param message The text alert message to display to the user
 * @param time optional duration in seconds before auto-closing (defaults to 7)
 */

export const showAlert = (
  type: "success" | "error",
  message: string,
  time: number = 7,
): void => {
  // Always hide old alert whenever new alert shows up
  hideAlert();

  const markup = `<div class="alert alert--${type}">${message}</div>`;

  // Using optional chaining (?) in case the body element isn't fully loaded yet
  document.querySelector("body")?.insertAdjacentHTML("afterbegin", markup);

  // Hide all alert the specified time limit expires
  window.setTimeout(hideAlert, time * 1000);
};
