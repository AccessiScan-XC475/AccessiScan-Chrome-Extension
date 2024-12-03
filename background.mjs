// import { WEBSITE } from "./domain";
// import { setSecret } from "./secret";

const GITHUB_CLIENT_ID = "Ov23licgT5DhZLZE1spq"; // Your GitHub Client ID

if (!GITHUB_CLIENT_ID) {
  console.error("GitHub Client ID is missing. Ensure it's set correctly.");
}

// Listen for messages from `scan.mjs`
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("ON MESSAGE");
  if (request.action === "startGithubOAuth") {
    console.log("SHOULD START AUTH");
    startGithubOAuthFlow()
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("OAuth flow error:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep the message channel open for async response
  }
});

// Start the GitHub OAuth flow
async function startGithubOAuthFlow() {
  const WEBSITE = "http://localhost:3000";
  console.log("start github flow");
  const redirectUri = `${WEBSITE}/api/extension-exchange/github`;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&scope=user&state=${chrome.runtime.id}`;

  console.log("Starting OAuth flow with URL:", authUrl);

  try {
    // Launch the OAuth flow
    const redirectUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });

    console.log("Redirect URL received:", redirectUrl);

    // Extract the code from the redirect URL
    const urlParams = new URL(redirectUrl).searchParams;
    const secret = urlParams.get("secret");
    console.log("GOT SECRET", secret);

    if (!code) {
      throw new Error("Authorization code not found.");
    }

    console.log("Authorization code received:", code);

    // Send the code to the backend
    const response = await fetch(`${BACKEND_URL}?code=${code}`);
    console.log("Backend response:", response);

    if (!response.ok) {
      console.error(
        "Failed to exchange code with backend. Status:",
        response.status,
      );
      throw new Error("Failed to exchange code with backend.");
    }

    // const secret = await response.text();
    // console.log("Secret received from backend:", secret);

    // Save the secret in Chrome storage
    chrome.storage.local.set({ SECRET: secret }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Failed to save secret in Chrome storage:",
          chrome.runtime.lastError,
        );
      } else {
        console.log("Secret saved in Chrome storage.");
      }
    });

    // setSecret(secret);
    console.log("SECRET:", secret);

    console.log("OAuth flow completed successfully.");
  } catch (error) {
    console.error("Error during OAuth flow:", error);
    throw error;
  }
}
