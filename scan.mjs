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
  // Fetch the access token to check if the user is logged in
  const { accessToken } = await chrome.storage.local.get("accessToken");

  const githubLoginIcon = document.getElementById("github-login-icon");
  const profileContainer = document.getElementById("profile-container");
  const profilePicture = document.getElementById("profile-picture");
  const logoutButton = document.getElementById("logout-button");

  const resetToLoginState = () => {
    // Check elements before modifying
    if (profileContainer) {
        profileContainer.style.display = "none";
    } else {
        console.error("profileContainer is undefined.");
    }

    if (githubLoginIcon) {
        githubLoginIcon.style.display = "block";
    } else {
        console.error("githubLoginIcon is undefined.");
    }

    if (logoutButton) {
        logoutButton.style.display = "none";
    } else {
        console.error("logoutButton is undefined.");
    }

    // Add click event to login icon if it exists
    if (githubLoginIcon) {
        githubLoginIcon.addEventListener("click", () => {
            console.log("GitHub login button clicked.");
            chrome.runtime.sendMessage({ action: "startGithubOAuth" });
        });
    }
  };



  if (accessToken) {
      console.log("User is logged in, fetching profile picture...");

      // Fetch the user's profile picture from GitHub
      const response = await fetch('https://api.github.com/user', {
          headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userData = await response.json();
      const profilePictureUrl = userData.avatar_url;

      // Set profile picture and show profile container
      profileContainer.style.display = "block";
      profilePicture.src = profilePictureUrl;

      // Hide the GitHub login icon
      githubLoginIcon.style.display = "none";

      // Toggle logout button visibility on profile picture click
      profilePicture.addEventListener("click", () => {
          logoutButton.style.display = logoutButton.style.display === "none" ? "block" : "none";
      });

      // Handle logout button click
      logoutButton.addEventListener("click", async () => {
        console.log("Logout button clicked.");
        const { accessToken } = await chrome.storage.local.get("accessToken");
    
        if (accessToken) {
            try {
                const response = await fetch("http://localhost:4200/api/auth/github/revoke", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: accessToken }),
                });
                if (!response.ok) throw new Error("Failed to revoke token");
                console.log("Token revoked successfully.");
            } catch (error) {
                console.error("Failed to revoke token:", error);
            }
        }
    
        await chrome.storage.local.remove(["accessToken", "profileData"]);
        console.log("Access token and profile data cleared.");
    
        // Check and remove GitHub session cookie
        chrome.cookies.get({ url: "https://github.com", name: "user_session" }, (cookie) => {
            if (chrome.runtime.lastError) {
                console.error("Error accessing cookies API:", chrome.runtime.lastError);
            } else if (cookie) {
                chrome.cookies.remove(
                    { url: "https://github.com", name: "user_session" },
                    (details) => {
                        if (details) {
                            console.log("GitHub session cookie cleared:", details);
                        } else {
                            console.error("Failed to remove GitHub session cookie.");
                        }
                    }
                );
            } else {
                console.warn("GitHub session cookie does not exist.");
            }
        });
    
        resetToLoginState();
      });
    
    
    

    
  } else {
      // User is not logged in - Show login icon
      profileContainer.style.display = "none"; // Hide the profile container
      githubLoginIcon.style.display = "block"; // Show the GitHub login icon

      // Add click event to initiate login
      githubLoginIcon.addEventListener("click", async () => {
        const { accessToken } = await chrome.storage.local.get("accessToken");
        if (!accessToken) {
            console.log("Starting OAuth flow...");
            chrome.runtime.sendMessage({ action: "startGithubOAuth" });
        } else {
            console.warn("Access token already exists, not starting OAuth.");
        }
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
