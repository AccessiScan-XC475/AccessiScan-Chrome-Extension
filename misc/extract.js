// This function will be injected into the active tab and will capture both the DOM and CSS
export function captureDOMAndCSS() {
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