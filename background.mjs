// import { WEBSITE } from "./domain";
// import { setSecret } from "./secret";

const GITHUB_CLIENT_ID = "Ov23licgT5DhZLZE1spq"; // Your GitHub Client ID

if (!GITHUB_CLIENT_ID) {
  console.error("GitHub Client ID is missing. Ensure it's set correctly.");
}

// Listen for messages from `scan.mjs`
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startGithubOAuth") {
    startGithubOAuthFlow(request.domain)
      .then((secret) => sendResponse({ success: true, secret }))
      .catch((error) => {
        console.error("OAuth flow error:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep the message channel open for async response
  }
});

// Start the GitHub OAuth flow
async function startGithubOAuthFlow(domain) {
  const redirectUri = `${domain}/api/extension-exchange/github`;
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

    console.log("OAuth flow completed successfully.");
    return secret;
  } catch (error) {
    console.error("Error during OAuth flow:", error);
    throw error;
  }
}
