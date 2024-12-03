const SECRET_KEY = "SECRET";

export function getSecret() {
  return localStorage.getItem(SECRET_KEY);
}

export function setSecret(secret) {
  localStorage.setItem(SECRET_KEY, secret);
}

// load previously saved value on page load
document.addEventListener("DOMContentLoaded", () => {
  const signedInElement = document.getElementById("signed-in");
  const savedValue = getSecret();
  if (savedValue) {
    signedInElement.innerText = "Signed In";
  } else {
    signedInElement.innerText = "Not Signed In";
  }
});
