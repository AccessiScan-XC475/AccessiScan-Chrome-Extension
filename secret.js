const SECRET = "secret";
const input = document.getElementById("secret-input");

// save input to localstorage
input.addEventListener("input", () => {
  const value = input.value;
  localStorage.setItem(SECRET, value);
  console.log(`Saved to localStorage: ${value}`);
});

// load previously saved value on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedValue = getSecret();
  if (savedValue) {
    input.value = savedValue;
    console.log(`Loaded from localStorage: ${savedValue}`);
  }
});

export function getSecret() {
  return localStorage.getItem(SECRET);
}
