import { playConfetti } from "./play-confetti.js";

//score range
export function createScoreGradient(score) {
  // Calculates arrow position based on score (0-100)
  const arrowPosition = (score / 100) * 100;

  // Applies gradient colors
  const gradientElement = `
    <div class="score-bar" style="background:linear-gradient(to right, red, yellow, green);">
      <div class="score-arrow" style="left:${arrowPosition}%;">
      </div>
    </div>
  `;

  return gradientElement;
}

// Score feedback message
export function displayScoreMessage(scanType, data) {
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
  } else if (scanType == "Line Spacing") {
    if (data.score < 100) {
      message =
        "The space between lines in the highlighted elements must have a ratio of at least a 1.5 ratio of line height relative to font size. Increase the line spacing to improve your score.";
    } else {
      message = "Great job!";
      playConfetti();
    }
  }

  // Set the message in the DOM
  return `<div class="score-message">${message}</div>`;
}
