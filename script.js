let selection = "";

// Adding event listeners to the option buttons
document.getElementById('visual-button').addEventListener('click', () => {
  selection = "Visual";
});
document.getElementById('audio-button').addEventListener('click', () => {
  selection = "Audio";
});
document.getElementById('mobility-button').addEventListener('click', () => {
  selection = "Mobility";
});

document.getElementById('captureDom').addEventListener('click', () => {
  const selection = document.getElementById("accessibility-selection").value;
  
  // Get the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];

    // Inject the content script
    chrome.scripting.executeScript(
      {
        target: { tabId: activeTab.id },
        function: captureDOMAndCSS
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          const { dom, css } = results[0].result;
          // console.log(dom);
          // console.log("----------now CSS:");
          // console.log(css);

          chrome.runtime.sendMessage({ message: dom }, function(response) {
            console.log("Response from background:", response);
          });

          if (selection != "") {
            fetch(`http://localhost:3000/api/accessibility-selection?name=${selection}`, {
              method: "POST"
            });
          }

          // Send the DOM and CSS to an API endpoint
          fetch('http://localhost:4200/api/scan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dom, css })
          })
            .then(res => res.text())
            .then(score => {
              document.getElementById("score-display").style.visibility = "visible";
              document.getElementById("score").innerHTML = score;
              console.log(score);
            })
            .catch(err => console.error(err));
        }
      }
    );
  });
});

// This function will be injected into the active tab and will capture both the DOM and CSS
function captureDOMAndCSS() {
  const capturedDom = document.documentElement.outerHTML;

  // Extract inline styles
  const allElements = document.querySelectorAll('*');
  let inlineStyles = '';
  allElements.forEach((el) => {
    if (el.style.cssText) {
      inlineStyles += `${el.tagName.toLowerCase()} { ${el.style.cssText} }\n`;
    }
  });

  // Extract styles from <style> tags in the HTML
  const styleTags = document.querySelectorAll('style');
  let styleTagCSS = '';
  styleTags.forEach((tag) => {
    styleTagCSS += tag.innerHTML + '\n';
  });

  // Extract CSS from all external and internal stylesheets
  let cssRules = [];
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const rules = document.styleSheets[i].cssRules || document.styleSheets[i].rules;
      for (let j = 0; j < rules.length; j++) {
        cssRules.push(rules[j].cssText);
      }
    } catch (e) {
      console.error('Could not access stylesheet:', e);
    }
  }

  // Combine all CSS
  const capturedCss = inlineStyles + styleTagCSS + cssRules.join("\n");

  return { dom: capturedDom, css: capturedCss };
}