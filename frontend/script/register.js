const API_URL = "";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#register-form");
  const errorElement = document.querySelector("#register-error");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;
    const confirmPassword = document.querySelector("#confirm-password").value;

    errorElement.textContent = "";

    if (!username || !email || !password || !confirmPassword) {
      errorElement.textContent = "Please fill in all fields.";
      return;
    }

    if (password !== confirmPassword) {
      errorElement.textContent = "Passwords do not match.";
      return;
    }

    if (password.length < 8) {
      errorElement.textContent = "Password must contain at least 8 characters.";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        errorElement.textContent =
          data?.error || "Unable to create your account.";
        return;
      }

      window.location.href = "/login";
    } catch (error) {
      console.error("Registration error:", error);

      errorElement.textContent = "Unable to connect to the server.";
    }
  });
});
