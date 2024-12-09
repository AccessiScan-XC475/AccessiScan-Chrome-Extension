import { WEBSITE } from "./domain.js";

const signIn = document.getElementById("sign-in");
const signOutButton = document.getElementById("sign-out-button");
const loginButton = document.getElementById("github-login-icon");
const ghIcon = document.getElementById("github-login-icon").src;

export function setSecret(secret) {
  chrome.storage.local.set({ secret });
  if (secret) {
    signIn.style.visibility = "hidden";
    signOutButton.style.visibility = "visible";
    fetch(`${WEBSITE}/api/picture/github?secret=${secret}`, {
      credentials: "omit",
    })
      .then((res) => {
        console.log("HTTP Status Code:", res.status); // Log the status code

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`); // Handle non-2xx status codes
        }

        return res.text(); // Process the response as text
      })
      .then((src) => {
        loginButton.src = src; // Set the GitHub icon source
      })
      .catch((error) => {
        console.error("Error fetching profile picture:", error); // Handle errors
      });
  } else {
    loginButton.src = ghIcon;
    signIn.style.visibility = "visible";
    signOutButton.style.visibility = "hidden";
  }
}

// load previously saved value on page load
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local
    .get(["secret"])
    .then((res) => res.secret)
    .then((savedValue) => {
      console.log("savedValue:", savedValue);
      if (savedValue) {
        signIn.style.visibility = "hidden";
        signOutButton.style.visibility = "visible";
        fetch(`${WEBSITE}/api/picture/github?secret=${savedValue}`, {
          credentials: "omit",
        })
          .then((res) => {
            console.log("HTTP Status Code:", res.status); // Log the status code

            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`); // Handle non-2xx status codes
            }

            return res.text(); // Process the response as text
          })
          .then((src) => {
            loginButton.src = src; // Set the GitHub icon source
          })
          .catch((error) => {
            console.error("Error fetching profile picture:", error); // Handle errors
            setSecret("");
          });
      } else {
        signIn.style.visibility = "visible";
        signOutButton.style.visibility = "hidden";
      }
    });
});

signOutButton.addEventListener("click", () => {
  setSecret("");
});
