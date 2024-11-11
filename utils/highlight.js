export function highlightInaccessibleElements(inaccessibleElements) {
  console.log("initial inaccessible elements", inaccessibleElements);
  inaccessibleElements.forEach((htmlElement) => {
    console.log("html element", htmlElement);
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlElement, "text/html");
    const inaccessibleElement = doc.body.firstChild;

    let selector = "";

    if (inaccessibleElement.id) {
      selector = `#${inaccessibleElement.id}`;
    } else if (inaccessibleElement.className) {
      selector = `${inaccessibleElement.tagName.toLowerCase()}.${inaccessibleElement.className.split(" ").join(".")}`;
    } else {
      // Use tag name only since querySelectorAll doesn't support :contains()
      selector = inaccessibleElement.tagName.toLowerCase();
    }

    console.log("Generated selector: ", selector);

    // Query elements by the selector and filter them by text content, if necessary
    const matchingElements = Array.from(
      document.querySelectorAll(selector),
    ).filter(
      (elementInPage) =>
        inaccessibleElement.textContent.trim() === "" ||
        elementInPage.textContent.trim() ===
          inaccessibleElement.textContent.trim(),
    );

    matchingElements.forEach((elementInPage) => {
      if (elementInPage && !elementInPage.getAttribute("data-processed")) {
        console.log("Processing element:", elementInPage);

        // Store original styles if the element hasn't been processed
        elementInPage.setAttribute(
          "data-original-style",
          JSON.stringify({
            backgroundColor: elementInPage.style.backgroundColor,
            outline: elementInPage.style.outline,
          }),
        );

        // Apply highlight styles
        elementInPage.style.outline = "3px solid red";
        elementInPage.style.backgroundColor = "yellow";

        // Mark as processed
        elementInPage.classList.add("highlighted-element");
        elementInPage.setAttribute("data-processed", "true");

        console.log("Element highlighted:", elementInPage);
      }
    });
  });
}

// Removes the highlights and restores webpage to original view
export function clearHighlights() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: () => {
        // This function runs in the web page context
        const highlightedElements = document.querySelectorAll(
          ".highlighted-element",
        );
        console.log("Elements to clear:", highlightedElements);

        highlightedElements.forEach((element) => {
          // Get original styles from the data attribute
          const originalStyles = JSON.parse(
            element.getAttribute("data-original-style"),
          );
          console.log("Original styles in clear function", originalStyles);

          // Restore original styles
          element.style.backgroundColor = originalStyles.backgroundColor;
          element.style.outline = originalStyles.outline;

          // Remove the class, data attributes, and flag used for processing
          element.classList.remove("highlighted-element");
          element.removeAttribute("data-original-style");
          element.removeAttribute("data-processed"); // Remove the data-processed flag

          console.log(
            "Cleared highlight and restored original styles:",
            element,
          );
        });

        console.log("Finished clearing highlights");
      },
    });
  });
}
