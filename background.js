require("dotenv").config();

const WEBSITE_BACKEND = "https://accessiscan.vercel.app/"; // Replace with your production backend URL

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startGithubOAuth") {
    startGithubOAuthFlow()
      .then((profileData) => {
        sendResponse({ profileData }); // Send the profile data back to the sender
      })
      .catch((error) => {
        console.error("OAuth error:", error);
        sendResponse({ error: "OAuth failed" });
      });
    return true; // Keep the message channel open for async response
  }
});

chrome.runtime.onMessage.addListener((request, sendResponse) => {
  if (request.action === "revokeToken") {
    revokeToken(request.accessToken)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error("Error revoking token:", error);
        sendResponse({ success: false, error });
      });
    return true; // Keep the message channel open for async response
  }
});

// Function to start the GitHub OAuth flow
async function startGithubOAuthFlow() {
  const state = Math.random().toString(36).substring(2, 15); // Generate a random state value
  const authUrl = `${WEBSITE_BACKEND}/github/login?state=${state}`; // Redirect to website backend

  console.log("Starting OAuth flow with URL:", authUrl);

  try {
    // Launch the OAuth flow using chrome.identity
    const redirectUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true, // Ensure the OAuth window prompts the user
    });

    console.log("Redirect URL received:", redirectUrl);

    // Fetch user info from the backend after successful OAuth
    const response = await fetch(`${WEBSITE_BACKEND}/api/user-info`, {
      credentials: "include", // Include cookies for session handling
    });

    if (!response.ok) throw new Error("Failed to fetch user profile");

    const profileData = await response.json();
    console.log("OAuth flow complete. User data:", profileData);

    return profileData;
  } catch (error) {
    console.error("Error in OAuth flow:", error);
    throw error;
  }
}

// Function to revoke the token
async function revokeToken(accessToken) {
  try {
    const response = await fetch(`${WEBSITE_BACKEND}/api/logout`, {
      method: "POST",
      credentials: "include", // Include cookies for session handling
    });

    if (!response.ok) {
      throw new Error("Failed to revoke token");
    }

    console.log("Token successfully revoked.");
  } catch (error) {
    console.error("Error revoking token:", error);
    throw error;
  }
}
