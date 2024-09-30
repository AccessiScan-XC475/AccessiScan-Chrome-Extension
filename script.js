document.getElementById('captureDom').addEventListener('click', () => {
  const selection = document.getElementById("accessibility-selection").value
  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    // Inject the content script
    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        function: captureDOM
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          // Log the captured DOM
          const dom = results[0].result;
          // console.log(dom);

          chrome.runtime.sendMessage({ message: dom }, function(response) {
            console.log("Response from background:", response)
          })

          if (selection != "") {
            fetch(`http://localhost:3000/api/accessibility-selection?name=${selection}`, {
              method: "POST"
            })
          }

          // Send the DOM to an API endpoint
          fetch('http://localhost:4200/api/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dom })
          })
            .then(res => res.text())
            .then(score => {
              document.getElementById("score-display").style.visibility = "visible";
              document.getElementById("score").innerHTML = score;
              console.log(score);
            })
            .catch(err => console.error(err))
        }
      }
    );
  });
});

// This function will be injected into the active tab
function captureDOM() {
  const capturedDom = document.documentElement.outerHTML;
  console.log(capturedDom);

  return capturedDom;
}

