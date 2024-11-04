import * as msgs from './utils/display.js';
import { captureDOMAndCSS } from './utils/extract.js';

let selection = "";

// Adding event listeners to the choices buttons
document.getElementById("contrasting-colors-button").addEventListener("click", () => {
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
  
document.getElementById("labeled-images-button").addEventListener("click", () => {
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

// Tooltip content for each info button
const tooltips = {
  'info-contrasting-colors': 'This button checks if the text on the page has sufficient color contrast for readability. It checks for at least a 4.5:1 ratio of rbg values for the background color and text color.',
  'info-large-text': 'This button checks if the text size is large enough (at least size 16) for visually impaired users.',
  'info-labeled-images': 'This button checks if images have labels, which improves accessibility for screen reader users.'
};

// Get the tooltip element
const tooltip = document.getElementById('tooltip');

// Function to show the tooltip
function showTooltip(event, message) {
  tooltip.style.display = 'block';
  tooltip.textContent = message;
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.top = `${event.pageY + 10}px`;
}

// Function to hide the tooltip
function hideTooltip() {
  tooltip.style.display = 'none';
}

// Add event listeners to info icons
document.getElementById('info-contrasting-colors').addEventListener('mouseenter', (event) => {
  showTooltip(event, tooltips['info-contrasting-colors']);
});

document.getElementById('info-contrasting-colors').addEventListener('mouseleave', hideTooltip);

document.getElementById('info-large-text').addEventListener('mouseenter', (event) => {
  showTooltip(event, tooltips['info-large-text']);
});

document.getElementById('info-large-text').addEventListener('mouseleave', hideTooltip);

document.getElementById('info-labeled-images').addEventListener('mouseenter', (event) => {
  showTooltip(event, tooltips['info-labeled-images']);
});

document.getElementById('info-labeled-images').addEventListener('mouseleave', hideTooltip);

//clear button
document.getElementById("clear-button").addEventListener("click", function() {
  // Hide the score display and accessiscan link
  document.getElementById("score-display").style.visibility = "hidden";
  document.getElementById("score").innerHTML = ""; // Clear the score
  document.getElementById("accessiscan-link").style.visibility = "hidden";

  // Deselect any selected button
  const selectedButton = document.querySelector(".selection-button.selected");
  if (selectedButton) {
      selectedButton.classList.remove("selected");
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
            
            .then((res) => res.json())
            .then((data) => {
              document.getElementById("score-display").style.visibility = "visible";
              document.getElementById("score").innerHTML = data.score;

              // Make the AccessiScan link visible
              document.getElementById("accessiscan-link").style.visibility = "visible";

              console.log("Score:", data.score);
              console.log("Inaccessible elements:", data.inaccessible_elements);

              if (scanType == "Contrasting Colors" || scanType == "Large Text") {
                console.log("test console log");
                chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                function: highlightInaccessibleElements,
                args: [data.inaccessible_elements]  // Pass inaccessible elements to the function
              });
            }
            })
            .catch((err) => console.error(err));
        }
      },
    );
  });
}

function highlightInaccessibleElements(inaccessibleElements) {
  console.log("initial inaccessible elements", inaccessibleElements);
  inaccessibleElements.forEach((htmlElement) => {
      console.log("html element", htmlElement);
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlElement, 'text/html');
      const inaccessibleElement = doc.body.firstChild;

      let selector = "";

      if (inaccessibleElement.id) {
          selector = `#${inaccessibleElement.id}`;
      } else if (inaccessibleElement.className) {
          selector = `${inaccessibleElement.tagName.toLowerCase()}.${inaccessibleElement.className.split(' ').join('.')}`;
      } else {
          // Use tag name only since querySelectorAll doesn't support :contains()
          selector = inaccessibleElement.tagName.toLowerCase();
      }

      console.log("Generated selector: ", selector);

      // Query elements by the selector and filter them by text content, if necessary
      const matchingElements = Array.from(document.querySelectorAll(selector)).filter(
          (elementInPage) => inaccessibleElement.textContent.trim() === "" ||
                             elementInPage.textContent.trim() === inaccessibleElement.textContent.trim()
      );

      matchingElements.forEach((elementInPage) => {
          if (elementInPage && !elementInPage.getAttribute('data-processed')) {
              console.log("Processing element:", elementInPage);

              // Store original styles if the element hasn't been processed
              elementInPage.setAttribute('data-original-style', JSON.stringify({
                  backgroundColor: elementInPage.style.backgroundColor,
                  outline: elementInPage.style.outline
              }));

              // Apply highlight styles
              elementInPage.style.outline = "3px solid red";
              elementInPage.style.backgroundColor = "yellow";

              // Mark as processed
              elementInPage.classList.add("highlighted-element");
              elementInPage.setAttribute('data-processed', 'true');

              console.log("Element highlighted:", elementInPage);
          }
      });
  });
}

// Removes the highlights and restores webpage to original view
function clearHighlights() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        // This function runs in the web page context
        const highlightedElements = document.querySelectorAll(".highlighted-element");
        console.log("Elements to clear:", highlightedElements);

        highlightedElements.forEach((element) => {
          // Get original styles from the data attribute
          const originalStyles = JSON.parse(element.getAttribute('data-original-style'));
          console.log("Original styles in clear function", originalStyles);

          // Restore original styles
          element.style.backgroundColor = originalStyles.backgroundColor;
          element.style.outline = originalStyles.outline;

          // Remove the class, data attributes, and flag used for processing
          element.classList.remove("highlighted-element");
          element.removeAttribute('data-original-style');
          element.removeAttribute('data-processed');  // Remove the data-processed flag

          console.log("Cleared highlight and restored original styles:", element);
        });

        console.log("Finished clearing highlights");
      }
    });
  });
}
