const SECRET_KEY = "SECRET";

export function getSecret() {
  return localStorage.getItem(SECRET_KEY);
}

export function setSecret(secret) {
  localStorage.setItem(SECRET_KEY, secret);
  console.log(`Secret saved to localStorage: ${secret}`);
}
