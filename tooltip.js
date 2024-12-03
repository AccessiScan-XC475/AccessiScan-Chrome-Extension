import { showTooltip, hideTooltip } from "./utils/tooltip.js";

// Tooltip content for each info button
const tooltips = {
  "info-contrasting-colors":
    "This button checks if the text on the page has sufficient color contrast for readability. It checks for at least a 4.5:1 ratio of rbg values for the background color and text color.",
  "info-labeled-images":
    "This button checks if images have labels, which improves accessibility for screen reader users.",
  "info-line-spacing":
    "This button checks if the space between lines has at least a 1.5 ratio of line height relative to font size.",
  "info-large-text":
    "This button checks if the text size is large enough (at least size 16) for visually impaired users.",
  };

// Add event listeners to info icons
document
  .getElementById("info-contrasting-colors")
  .addEventListener("mouseenter", (event) => {
    showTooltip(event, tooltips["info-contrasting-colors"]);
  });

document
  .getElementById("info-contrasting-colors")
  .addEventListener("mouseleave", hideTooltip);

document
  .getElementById("info-labeled-images")
  .addEventListener("mouseenter", (event) => {
    showTooltip(event, tooltips["info-labeled-images"]);
  });

document
  .getElementById("info-labeled-images")
  .addEventListener("mouseleave", hideTooltip);

document
  .getElementById("info-line-spacing")
  .addEventListener("mouseenter", (event) => {
    showTooltip(event, tooltips["info-line-spacing"]);
  });

document
  .getElementById("info-line-spacing")
  .addEventListener("mouseleave", hideTooltip);

document
  .getElementById("info-large-text")
  .addEventListener("mouseenter", (event) => {
    showTooltip(event, tooltips["info-large-text"]);
  });

document
  .getElementById("info-large-text")
  .addEventListener("mouseleave", hideTooltip);

