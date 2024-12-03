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
  const client_id_res = await fetch(`${domain}/api/extension-client-id/github`);
  const github_client_id = await client_id_res.text();
  const redirectUri = `${domain}/api/extension-exchange/github`;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${github_client_id}&redirect_uri=${encodeURIComponent(
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
