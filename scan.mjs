import * as msgs from "./utils/display.js";
import { captureDOMAndCSS } from "./utils/extract.js";
import {
  highlightInaccessibleElements,
  clearHighlights,
} from "./utils/highlight.js";
import { createScoreGradient, displayScoreMessage } from "./utils/score.js";
import { SCANNER, WEBSITE } from "./domain.js";
import { setSecret } from "./secret.js";

let selection = "";

function showLoading() {
  document.getElementById("loading-text").style.display = "block";
}

function hideLoading() {
  document.getElementById("loading-text").style.display = "none";
}

// Adding event listeners to the choices buttons
document
  .getElementById("contrasting-colors-button")
  .addEventListener("click", () => {
    clearScan();
    selection = "Contrasting Colors";
    updateButtonState("contrasting-colors-button");
    msgs.clearAll();
    performScan(selection); //scan when user selects this button
  });

document.getElementById("large-text-button").addEventListener("click", () => {
  selection = "Large Text";
  clearScan();
  updateButtonState("large-text-button");
  msgs.clearAll();
  performScan(selection); //scan when user selects this button
});

document
  .getElementById("labeled-images-button")
  .addEventListener("click", () => {
    clearScan();
    selection = "Labeled Images";
    updateButtonState("labeled-images-button");
    msgs.clearAll();
    performScan(selection); //scan when user selects this button
  });

document.getElementById("line-spacing-button").addEventListener("click", () => {
  clearScan();
  selection = "Line Spacing";
  updateButtonState("line-spacing-button");
  msgs.clearAll();
  performScan(selection); //scan when user selects this button
});

document
  .getElementById("overall-accessibility-button")
  .addEventListener("click", () => {
    clearScan();
    msgs.clearAll();
    updateButtonState("overall-accessibility-button");
    performScan("Contrasting Colors", false);
    performScan("Large Text", false);
    performScan("Labeled Images", false);
    performScan("Line Spacing", false);
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

function clearScan() {
  // Hide the score display and accessiscan link
  // document.getElementById("score-display").style.visibility = "hidden";
  // document.getElementById("score").innerHTML = ""; // Clear the score
  // document.getElementById("accessiscan-link").style.visibility = "hidden";
  // document.getElementById("score-bar").style.visibility = "hidden";
  // document.getElementById("score-message").style.visibility = "hidden";
  // document.getElementById("score-container").style.visibility = "hidden";
  clearHighlights();
}

//clear button
document.getElementById("clear-button").addEventListener("click", function () {
  clearScan();

  // Deselect any selected button
  const selectedButton = document.querySelector(".selection-button.selected");
  if (selectedButton) {
    selectedButton.classList.remove("selected");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const githubLoginIcon = document.getElementById("github-login-icon");
  const profileContainer = document.getElementById("profile-container");
  const profilePicture = document.getElementById("profile-picture");
  const logoutButton = document.getElementById("logout-button");

  if (!githubLoginIcon) {
    console.error("GitHub login icon not found!");
    return;
  }

  // Show GitHub login button
  githubLoginIcon.style.display = "block";

  // Add click event listener
  githubLoginIcon.addEventListener("click", () => {
    console.log("GitHub login button clicked.");
    chrome.runtime.sendMessage(
      { action: "startGithubOAuth", domain: WEBSITE },
      (response) => {
        console.log("response", response);
        if (response && response.success) {
          console.log("GitHub OAuth flow finished successfully.");
          setSecret(response.secret);
          // Optionally refresh UI or take action
        } else {
          console.error("GitHub OAuth flow failed:", response?.error);
        }
      },
    );
  });
});

// Unified function to perform the scan based on the selection
function performScan(scanType, overwrite = true) {
  showLoading();

  // Hide the "not implemented" and "other" messages by default
  msgs.hideNotImplementedMessage();
  msgs.hideOtherMessage();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const href = tabs[0].url;
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

          chrome.storage.local
            .get(["secret"])
            .then((res) => res.secret)
            .then((secret) => {
              fetch(`${SCANNER}${apiEndpoint}`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  dom,
                  css,
                  secret: secret,
                  href,
                }),
              })
                .then((res) => res.json())
                .then((data) => {
                  hideLoading();

                  let score = "N/A";
                  if (scanType === "Labeled Images") {
                    score = `${data.images_with_alt}/${data.total_images}`;
                  } else {
                    score = `${data.score}%`;
                  }
                  const scoreDisplay = `<p class="score-display">${scanType}: <span class="score">${score}</span></p>`;

                  const gradientElement = createScoreGradient(data.score);
                  const scoreMessageElement = displayScoreMessage(
                    scanType,
                    data,
                  );

                  const newScoreElement = `
                <div>
                  ${scoreDisplay}
                  ${gradientElement}
                  ${scoreMessageElement}
                </div>
              `;

                  if (overwrite) {
                    console.log("overwriting");
                    document.getElementById("score-container").innerHTML =
                      newScoreElement;
                  } else {
                    console.log("appending", scoreMessageElement);
                    document.getElementById("score-container").innerHTML +=
                      newScoreElement;
                  }

                  // Show the clear button
                  document.getElementById("clear-button").style.display =
                    "block";

                  // Make the AccessiScan link visible
                  document.getElementById("accessiscan-link").style.visibility =
                    "visible";

                  console.log("Score:", data.score);
                  console.log(
                    "Inaccessible elements:",
                    data.inaccessible_elements,
                  );

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
            });
        }
      },
    );
  });
}
