// Function to show the "other" message
export function showOtherMessage() {
  clearScoreDisplay();
  document.getElementById("other-message").style.display = "block";
}

// Function to hide the "other" message
export function hideOtherMessage() {
  document.getElementById("other-message").style.display = "none";
}

// Function to show the error message when no selection is made
export function showErrorMessage() {
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "block";
}

// Function to hide the error message when a selection is made
export function hideErrorMessage() {
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "none";
}

// Function to show the "not implemented" message
export function showNotImplementedMessage() {
  const message = document.getElementById("not-implemented-message");
  message.style.display = "block";
}

// Function to hide the "not implemented" message
export function hideNotImplementedMessage() {
  const message = document.getElementById("not-implemented-message");
  message.style.display = "none";
}

// Function to clear the score display
export function clearScoreDisplay() {
  document.getElementById("score-container").innerHTML = "";
}

// Function combining clearing functions
export function clearAll() {
  clearScoreDisplay();
  hideErrorMessage();
  hideOtherMessage();
  hideNotImplementedMessage();
}
