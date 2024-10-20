import * as msgs from './utils/display.js';
import { captureDOMAndCSS } from './utils/extract.js';

let selection = "";

// Adding event listeners to the choices buttons
document.getElementById("contrasting-colors-button").addEventListener("click", () => {
    selection = "Contrasting Colors";
    updateButtonState("contrasting-colors-button");
    msgs.clearAll();
  });
  
document.getElementById("large-text-button").addEventListener("click", () => {
    selection = "Large Text";
    updateButtonState("large-text-button");
    msgs.clearAll();
});
  
document.getElementById("labeled-images-button").addEventListener("click", () => {
    selection = "Labeled Images";
    updateButtonState("labeled-images-button");
    msgs.clearAll();
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
  
// Event listener for the "Scan" button
document.getElementById("captureDom").addEventListener("click", () => {
    // Check if a scan type is selected before proceeding
    if (selection !== "") {
      performScan(selection);
    } else {
      // If no selection is made, show the error message
      msgs.showErrorMessage();
    }
});

// Function to update button state
function updateButtonState(selectedButtonId) {
    // Remove highlights when different button is pressed
    // clearHighlights();

    // Get all selection buttons
    const selectionButtons = document.querySelectorAll(".selection-button");
  
    // Remove 'selected' class from all buttons
    selectionButtons.forEach((btn) => {
      btn.classList.remove("selected");
    });
  
    // Add 'selected' class to the clicked button
    document.getElementById(selectedButtonId).classList.add("selected");
}

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
            default:
              msgs.showNotImplementedMessage();
              return;
          }

          fetch(
            `http://localhost:3000/api/accessibility-selection?name=${selection}`,
            {
              method: "POST",
            },
          );

          fetch(`http://localhost:4200${apiEndpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ dom, css }),
          })
            .then((res) => res.text())
            .then((score) => {
              document.getElementById("score-display").style.visibility = "visible";
              document.getElementById("score").innerHTML = score;
              console.log(score);
            })
            .catch((err) => console.error(err));
        }
      },
    );
  });
}