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

document.getElementById("line-spacing-button").addEventListener("click", () => {
  selection = "Line Spacing";
  updateButtonState("line-spacing-button");
  msgs.clearAll();
  performScan(selection); //scan when user selects this button
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

document.addEventListener("DOMContentLoaded", async () => {
  const githubLoginIcon = document.getElementById("github-login-icon");
  const profileContainer = document.getElementById("profile-container");
  const profilePicture = document.getElementById("profile-picture");

  const resetToLoginState = () => {
    if (profileContainer) profileContainer.style.display = "none";
    if (githubLoginIcon) {
      githubLoginIcon.style.display = "block";
      console.log("Reset to login state. Showing GitHub login icon.");
    }
  };

  try {
    // Send a message to background.js to check if the user is authenticated
    chrome.runtime.sendMessage({ action: "checkAuth" }, (response) => {
      if (response && response.success) {
        const { avatar_url } = response.userData;
        if (profileContainer) profileContainer.style.display = "block";
        if (profilePicture) profilePicture.src = avatar_url;
        if (githubLoginIcon) githubLoginIcon.style.display = "none";
        console.log("User is authenticated. Showing profile container.");
      } else {
        console.warn("User is not authenticated. Resetting to login state.");
        resetToLoginState();
      }
    });
  } catch (error) {
    console.error("Failed to check authentication:", error);
    resetToLoginState();
  }

  // Add event listener for GitHub login icon
  if (githubLoginIcon) {
    githubLoginIcon.addEventListener("click", () => {
      console.log("GitHub login button clicked.");
      chrome.runtime.sendMessage({ action: "startGithubOAuth" });
    });
  }
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
            case "Line Spacing":
              apiEndpoint = "/api/scan-line-spacing";
              break;
            default:
              msgs.showNotImplementedMessage();
              return;
          }

          fetch(`${WEBSITE}/api/accessibility-selection?name=${selection}`, {
            method: "POST",
          }).catch((e) => {
            console.error("Could not update statistics");
            console.error(e);
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
                scanType == "Labeled Images" ||
                scanType == "Line Spacing"
              ) {
                chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  function: highlightInaccessibleElements,
                  args: [data.inaccessible_elements], // Pass inaccessible elements to the function
                });
              }
            })
            .catch((err) => {
              console.error("Could not call scanner.");
              console.error(err);
            });
        }
      },
    );
  });
}