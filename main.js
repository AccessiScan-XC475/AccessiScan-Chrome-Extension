import * as msgs from "./utils/display.js";
import { captureDOMAndCSS } from "./utils/extract.js";
import {
  highlightInaccessibleElements,
  clearHighlights,
} from "./utils/highlight.js";
import { createScoreGradient, displayScoreMessage } from "./utils/score.js";
import { SCANNER, WEBSITE } from "./domain.js";

let selection = "";

// Adding event listeners to the choices buttons
document
  .getElementById("contrasting-colors-button")
  .addEventListener("click", () => {
    selection = "Contrasting Colors";
    updateButtonState("contrasting-colors-button");
    msgs.clearAll();
    performScan(selection); //scan when user selects this button
  });

document.getElementById("large-text-button").addEventListener("click", () => {
  selection = "Large Text";
  updateButtonState("large-text-button");
  msgs.clearAll();
  performScan(selection); //scan when user selects this button
});

document
  .getElementById("labeled-images-button")
  .addEventListener("click", () => {
    selection = "Labeled Images";
    updateButtonState("labeled-images-button");
    msgs.clearAll();
    performScan(selection); //scan when user selects this button
  });

// Event listeners for "other" buttons
const otherButtons = ["other-button-1", "other-button-2", "other-button-3"];

otherButtons.forEach((buttonId) => {
  document.getElementById(buttonId).addEventListener("click", () => {
    selection = "Other";
    updateButtonState(buttonId);
    msgs.hideErrorMessage();
    msgs.hideNotImplementedMessage();
    msgs.showOtherMessage(); // Show the other message when an "Other" button is clicked
  });
});

// Function to update button state
function updateButtonState(selectedButtonId) {
  // Remove highlights when different button is pressed
  clearHighlights();

  // Get all selection buttons
  const selectionButtons = document.querySelectorAll(".selection-button");

  // Remove 'selected' class from all buttons
  selectionButtons.forEach((btn) => {
    btn.classList.remove("selected");
  });

  // Add 'selected' class to the clicked button
  document.getElementById(selectedButtonId).classList.add("selected");
}

//clear button
document.getElementById("clear-button").addEventListener("click", function () {
  // Hide the score display and accessiscan link
  document.getElementById("score-display").style.visibility = "hidden";
  document.getElementById("score").innerHTML = ""; // Clear the score
  document.getElementById("accessiscan-link").style.visibility = "hidden";
  document.getElementById("score-bar").style.visibility = "hidden";
  document.getElementById("score-message").style.visibility = "hidden";
  clearHighlights();

  // Deselect any selected button
  const selectedButton = document.querySelector(".selection-button.selected");
  if (selectedButton) {
    selectedButton.classList.remove("selected");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const score = 5; // will fetch later
  createScoreGradient(score);
});

// Unified function to perform the scan based on the selection
function performScan(scanType) {
  // Hide the "not implemented" and "other" messages by default
  msgs.hideNotImplementedMessage();
  msgs.hideOtherMessage();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        function: captureDOMAndCSS,
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          const { dom, css } = results[0].result;

          chrome.runtime.sendMessage({ message: dom }, function (response) {
            console.log("Response from background:", response);
          });

          let apiEndpoint = "";
          switch (scanType) {
            case "Contrasting Colors":
              apiEndpoint = "/api/scan-contrasting-colors";
              break;
            case "Large Text":
              apiEndpoint = "/api/scan-large-text";
              break;
            case "Labeled Images":
              apiEndpoint = "/api/scan-images";
              break;
            default:
              msgs.showNotImplementedMessage();
              return;
          }

          fetch(`${WEBSITE}/api/accessibility-selection?name=${selection}`, {
            method: "POST",
          });

          fetch(`${SCANNER}${apiEndpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ dom, css }),
          })
            .then((res) => res.json())
            .then((data) => {
              document.getElementById("score-display").style.visibility =
                "visible";
              document.getElementById("score-message").style.visibility =
                "visible";
              if (scanType === "Labeled Images") {
                document.getElementById("score").innerHTML =
                  `${data.images_with_alt}/${data.total_images}`;
              } else {
                document.getElementById("score").innerHTML = `${data.score}%`;
              }
              createScoreGradient(data.score);
              displayScoreMessage(selection, data);

              // Show score bar
              document.getElementById("score-bar").style.visibility = "visible";
              // Show the clear button
              document.getElementById("clear-button").style.display = "block";

              // Make the AccessiScan link visible
              document.getElementById("accessiscan-link").style.visibility =
                "visible";

              console.log("Score:", data.score);
              console.log("Inaccessible elements:", data.inaccessible_elements);

              if (
                scanType == "Contrasting Colors" ||
                scanType == "Large Text" ||
                scanType == "Labeled Images"
              ) {
                chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  function: highlightInaccessibleElements,
                  args: [data.inaccessible_elements], // Pass inaccessible elements to the function
                });
              }
            })
            .catch((err) => console.error(err));
        }
      },
    );
  });
}
