// Get the tooltip element
const tooltip = document.getElementById("tooltip");

// Function to show the tooltip
export function showTooltip(event, message) {
  tooltip.style.display = "block";
  tooltip.textContent = message;
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY + 10}px`;
}

// Function to hide the tooltip
export function hideTooltip() {
  tooltip.style.display = "none";
}
