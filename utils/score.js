import { playConfetti } from "./play-confetti.js";

//score range
export function createScoreGradient(score) {
  const gradientContainer = document.getElementById("score-bar");
  const arrow = document.getElementById("score-arrow");

  // Calculates arrow position based on score (0-100)
  const arrowPosition = (score / 100) * 100;

  // Applies arrow position as a percentage
  arrow.style.left = `${arrowPosition}%`;

  // Applies gradient colors
  gradientContainer.style.background =
    "linear-gradient(to right, red, yellow, green)";
}

// Score feedback message
export function displayScoreMessage(scanType, data) {
  const scoreMessageElement = document.getElementById("score-message");

  // Determine the message based on scan type and score
  let message = "";

  if (scanType === "Contrasting Colors") {
    if (data.score < 100) {
      message =
        "The highlighted elements don't satisfy the 4.5:1 rgb ratio for text color and its background color. Adjust the rgb values in the highlighted elements to improve your score.";
    } else {
      message = "Great job!";
      playConfetti();
    }
  } else if (scanType === "Large Text") {
    if (data.score < 100) {
      message =
        "The highlighted elements are less than 16 point font. Increase the size font for these elements to improve your score.";
    } else {
      message = "Great job!";
      playConfetti();
    }
  } else if (scanType === "Labeled Images") {
    if (data.images_with_alt !== data.total_images) {
      message =
        "Some of images are missing alt text. Add alt text to these image tags.";
    } else {
      message = "Great job!";
      playConfetti();
    }
  } else if (scanType == "Labeled Images") {
    message = data.details;
  }

  // Set the message in the DOM
  scoreMessageElement.textContent = message;
}
