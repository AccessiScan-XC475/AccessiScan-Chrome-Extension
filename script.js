let selection = "";

// Adding event listeners to the option buttons
document.getElementById("contrasting-colors-button").addEventListener("click", () => {
  selection = "Contrasting Colors";
  updateButtonState("contrasting-colors-button");
  clearScoreDisplay();
  hideErrorMessage();
  hideOtherMessage();
  hideNotImplementedMessage();
});

document.getElementById("large-text-button").addEventListener("click", () => {
  selection = "Large Text";
  updateButtonState("large-text-button");
  clearScoreDisplay();
  hideErrorMessage();
  hideOtherMessage();
  hideNotImplementedMessage();
});

document.getElementById("labeled-images-button").addEventListener("click", () => {
  selection = "Labeled Images";
  updateButtonState("labeled-images-button");
  clearScoreDisplay();
  hideErrorMessage();
  hideOtherMessage();
  hideNotImplementedMessage();
});

// Event listeners for "other" buttons
const otherButtons = ["other-button-1", "other-button-2", "other-button-3"];

otherButtons.forEach((buttonId) => {
  document.getElementById(buttonId).addEventListener("click", () => {
    selection = "Other";
    updateButtonState(buttonId);
    hideErrorMessage();
    hideNotImplementedMessage();
    showOtherMessage(); // Show the other message when an "Other" button is clicked
  });
});

// Function to show the "other" message
function showOtherMessage() {
  clearScoreDisplay();
  document.getElementById("other-message").style.display = "block";
}

// Function to hide the "other" message
function hideOtherMessage() {
  document.getElementById("other-message").style.display = "none";
}

// Function to show the error message when no selection is made
function showErrorMessage() {
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "block";
}

// Function to hide the error message when a selection is made
function hideErrorMessage() {
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "none";
}

// Function to show the "not implemented" message
function showNotImplementedMessage() {
  const message = document.getElementById("not-implemented-message");
  message.style.display = "block";
}

// Function to hide the "not implemented" message
function hideNotImplementedMessage() {
  const message = document.getElementById("not-implemented-message");
  message.style.display = "none";
}

// Function to clear the score display
function clearScoreDisplay() {
  document.getElementById("score-display").style.visibility = "hidden";
  document.getElementById("score").innerHTML = "";
}

// Event listener for the "Scan" button
document.getElementById("captureDom").addEventListener("click", () => {
  // Check if a scan type is selected before proceeding
  if (selection !== "") {
    performScan(selection);
  } else {
    // If no selection is made, show the error message
    showErrorMessage();
  }
});

// Function to update button state
function updateButtonState(selectedButtonId) {
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
  // Clear any previous score display
  clearScoreDisplay();

  // Hide the "not implemented" and "other" messages by default
  hideNotImplementedMessage();
  hideOtherMessage();

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
              showNotImplementedMessage();
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

// This function will be injected into the active tab and will capture both the DOM and CSS
function captureDOMAndCSS() {
  const capturedDom = document.documentElement.outerHTML;

  // Extract inline styles
  const allElements = document.querySelectorAll("*");
  let inlineStyles = "";
  allElements.forEach((el) => {
    if (el.style.cssText) {
      inlineStyles += `${el.tagName.toLowerCase()} { ${el.style.cssText} }\n`;
    }
  });

  // Extract styles from <style> tags in the HTML
  const styleTags = document.querySelectorAll("style");
  let styleTagCSS = "";
  styleTags.forEach((tag) => {
    styleTagCSS += tag.innerHTML + "\n";
  });

  // Extract CSS from all external and internal stylesheets
  let cssRules = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const rules =
        document.styleSheets[i].cssRules || document.styleSheets[i].rules;
      for (let j = 0; j < rules.length; j++) {
        cssRules.push(rules[j].cssText);
      }
    } catch (e) {
      console.error("Could not access stylesheet:", e);
    }
  }

  // Combine all CSS
  const capturedCss = inlineStyles + styleTagCSS + cssRules.join("\n");

  return { dom: capturedDom, css: capturedCss };
}
