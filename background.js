// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startGithubOAuth") {
        startGithubOAuthFlow()
            .then(profileData => {
                sendResponse({ profileData }); // Send the profile data back to the sender
            })
            .catch(error => {
                console.error("OAuth error:", error);
                sendResponse({ error: "OAuth failed" });
            });
        return true; // Keep the message channel open for async response
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    const clientId = "Ov23licgT5DhZLZE1spq"; // Replace with your GitHub client ID
    const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
    const state = Math.random().toString(36).substring(2, 15); // Generate a random state value
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=user&state=${state}`;

    console.log("Starting OAuth flow with URL:", authUrl);

    try {
        // Clear any existing access token before starting OAuth
        await chrome.storage.local.remove(["accessToken", "profileData"]);

        // Launch the OAuth flow using chrome.identity
        const redirectUrl = await chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true, // Force the OAuth window to prompt the user
        });

        console.log("Redirect URL received:", redirectUrl);

        // Extract the authorization code from the redirect URL
        const urlParams = new URL(redirectUrl).searchParams;
        const code = urlParams.get("code");

        if (!code) {
            throw new Error("Authorization code not found");
        }

        console.log("Authorization code:", code);

        // Exchange the code for an access token
        const accessToken = await exchangeCodeForToken(code);

        // Fetch the user's profile information
        const profileData = await fetchUserProfile(accessToken);

        // Save profile data in local storage
        await chrome.storage.local.set({ accessToken, profileData });

        console.log("OAuth flow complete.");
        return profileData;
    } catch (error) {
        console.error("Error in OAuth flow:", error);
        throw error;
    }
}


// Function to exchange the authorization code for an access token
async function exchangeCodeForToken(code) {
    try {
        const response = await fetch("http://localhost:4200/api/auth/github/callback/extension", { // Replace with deployed server URL if needed
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code })
        });

        const data = await response.json();
        if (!data.access_token) {
            throw new Error("Access token not received");
        }

        console.log("Access token received:", data.access_token);

        // Store the access token in local storage for later use
        await chrome.storage.local.set({ accessToken: data.access_token });
        console.log("Access token saved.");

        return data.access_token;
    } catch (error) {
        console.error("Error exchanging code for token:", error);
        throw error;
    }
}

async function revokeToken(accessToken) {
    const clientId = "Ov23licgT5DhZLZE1spq"; // Your GitHub client ID
    const clientSecret = "your_client_secret"; // Your GitHub client secret

    const response = await fetch(`https://api.github.com/applications/${clientId}/token`, {
        method: "DELETE",
        headers: {
            "Authorization": `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: accessToken }),
    });

    if (response.ok) {
        console.log("Token successfully revoked.");
    } else {
        console.error("Failed to revoke token:", await response.text());
    }
}

// Function to fetch the user's GitHub profile information
async function fetchUserProfile(accessToken) {
    try {
        const response = await fetch("https://api.github.com/user", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user profile");
        }

        const data = await response.json();
        console.log("Fetched user profile:", data);

        return data; // This includes profile information like avatar_url, login, name, etc.
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
    }
}
