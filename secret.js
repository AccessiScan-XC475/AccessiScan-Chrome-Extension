const SECRET_KEY = "SECRET";

const signedInElement = document.getElementById("signed-in");
const signOutButton = document.getElementById("sign-out-button");

export function getSecret() {
  return localStorage.getItem(SECRET_KEY);
}

export function setSecret(secret) {
  localStorage.setItem(SECRET_KEY, secret);
  if (secret) {
    signedInElement.style.visibility = "hidden";
    signOutButton.style.visibility = "visible";
  } else {
    signedInElement.style.visibility = "visible";
    signedInElement.innerText = "Not Signed In";
    signOutButton.style.visibility = "hidden";
  }
}

// load previously saved value on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedValue = getSecret();
  if (savedValue) {
    signedInElement.style.visibility = "hidden";
    signOutButton.style.visibility = "visible";
  } else {
    signedInElement.innerText = "Not Signed In";
    signOutButton.style.visibility = "hidden";
  }
});

signOutButton.addEventListener("click", () => {
  setSecret("");
});
