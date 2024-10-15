import * as msgs from './misc/display.js';
import { captureDOMAndCSS } from './misc/extract.js';

let selection = "";

// Adding event listeners to the option buttons
document.getElementById("contrasting-colors-button").addEventListener("click", () => {
    selection = "Contrasting Colors";
    updateButtonState("contrasting-colors-button");
    msgs.clearScoreDisplay();
    msgs.hideErrorMessage();
    msgs.hideOtherMessage();
    msgs.hideNotImplementedMessage();
  });
  
document.getElementById("large-text-button").addEventListener("click", () => {
    selection = "Large Text";
    updateButtonState("large-text-button");
    msgs.clearScoreDisplay();
    msgs.hideErrorMessage();
    msgs.hideOtherMessage();
    msgs.hideNotImplementedMessage();
});
  
document.getElementById("labeled-images-button").addEventListener("click", () => {
    selection = "Labeled Images";
    updateButtonState("labeled-images-button");
    msgs.clearScoreDisplay();
    msgs.hideErrorMessage();
    msgs.hideOtherMessage();
    msgs.hideNotImplementedMessage();
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

function performScan(scanType) {
  // Clear any previous score display
  msgs.clearScoreDisplay();

  // Hide the "not implemented" and "other" messages by default
  msgs.hideNotImplementedMessage();
  msgs.hideOtherMessage();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        function: captureDOMAndCSS, // Use this to capture if needed
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          const { dom, css } = results[0].result;

          chrome.runtime.sendMessage({ message: dom }, function (response) {
            console.log("Response from background:", response);
          });

          let apiEndpoint = "";
          let highlightSelector = "";

          switch (scanType) {
            case "Contrasting Colors":
              highlightSelector = "p"; // Example: highlight paragraphs
              break;
            case "Large Text":
              highlightSelector = "h1, h2, h3"; // Example: highlight headings
              break;
            default:
              msgs.showNotImplementedMessage();
              return;
          }

          // Inject the script to highlight elements
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            function: highlightElements,
            args: [highlightSelector] // Pass the selector to the function
          });
        }
      }
    );
  });
}

// Function to highlight elements on the page
function highlightElements(selector) {
  const elements = document.querySelectorAll(selector); // Select all matching elements
  elements.forEach((element) => {
    element.style.backgroundColor = "yellow"; // Or use another visual indicator like a border
    element.style.border = "2px solid red"; // Optional: add a border
  });
}
