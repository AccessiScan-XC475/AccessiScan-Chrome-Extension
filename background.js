chrome.identity.launchWebAuthFlow(
    {
      url: "https://accessiscan.vercel.app/api/login/github", // Adjust to match the actual URL path
      interactive: true
    },
    function (redirectUrl) {
      if (chrome.runtime.lastError || !redirectUrl) {
        console.error(chrome.runtime.lastError);
        return;
      }

      // Parse the redirectUrl to retrieve the access token or session ID
      const urlParams = new URL(redirectUrl).searchParams;
      const sessionId = urlParams.get("sessionId"); // Adjust if token/session ID is in a cookie instead

      if (sessionId) {
        console.log("Session ID received:", sessionId);
        // Use the session ID to authorize further requests
      } else {
        console.error("Session ID not found.");
      }
    }
  );
