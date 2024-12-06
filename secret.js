import { WEBSITE } from "./domain.js";
const SECRET_KEY = "SECRET";

const signedInElement = document.getElementById("signed-in");
const signOutButton = document.getElementById("sign-out-button");
const loginButton = document.getElementById("github-login-icon");
const ghIcon = document.getElementById("github-login-icon").src;

export function getSecret() {
  return localStorage.getItem(SECRET_KEY);
}

export function setSecret(secret) {
  localStorage.setItem(SECRET_KEY, secret);
  if (secret) {
    signedInElement.style.visibility = "hidden";
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
    signedInElement.style.visibility = "visible";
    signedInElement.innerText = "Not Signed In";
    signOutButton.style.visibility = "hidden";
  }
}

// load previously saved value on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedValue = getSecret();
  console.log("savedValue:", savedValue);
  if (savedValue) {
    signedInElement.style.visibility = "hidden";
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
    });  
  } else {
    signedInElement.innerText = "Not Signed In";
    signOutButton.style.visibility = "hidden";
  }
});

signOutButton.addEventListener("click", () => {
  setSecret("");
});
