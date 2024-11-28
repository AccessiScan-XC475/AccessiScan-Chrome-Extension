require("dotenv").config();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const BACKEND_URL = "https://accessiscan.vercel.app/api/login/github"; // Adjust based on your backend URL

// Listen for messages from scan.mjs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startGithubOAuth") {
    startGithubOAuthFlow()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("OAuth flow failed:", error);
        sendResponse({ success: false, error });
      });
    return true; // Keep the message channel open for async response
  }

  if (request.action === "checkAuth") {
    checkAuthStatus()
      .then((userData) => sendResponse({ success: true, userData }))
      .catch((error) => {
        console.error("Auth check failed:", error);
        sendResponse({ success: false });
      });
    return true; // Keep the message channel open for async response
  }
});

// Function to start the GitHub OAuth flow
async function startGithubOAuthFlow() {
  const redirectUri = chrome.identity.getRedirectURL(); // Use Chrome extension redirect URL
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user`;

  console.log("Starting OAuth flow with URL:", authUrl);

  // Launch the OAuth flow
  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  console.log("Redirect URL received:", redirectUrl);

  // Extract the authorization code from the redirect URL
  const urlParams = new URL(redirectUrl).searchParams;
  const code = urlParams.get("code");

  if (!code) {
    throw new Error("Authorization code not found in redirect URL");
  }

  console.log("Authorization code:", code);

  // Exchange the authorization code for a token/secret via backend
  const response = await fetch(`${BACKEND_URL}?code=${code}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to exchange authorization code");
  }

  console.log("OAuth flow complete.");
}

// Function to check authentication status
async function checkAuthStatus() {
  const response = await fetch(`${BACKEND_URL}/status`, {
    method: "GET",
    credentials: "include", // Send cookies with the request
  });

  if (!response.ok) {
    throw new Error("Failed to check authentication status");
  }

  const userData = await response.json();
  return userData;
}
