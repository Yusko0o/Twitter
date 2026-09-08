const API_URL = "";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#login-form");
  const errorElement = document.querySelector("#login-error");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value;

    errorElement.textContent = "";

    if (!email || !password) {
      errorElement.textContent = "Please fill in all fields.";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        errorElement.textContent = data?.error || "Invalid email or password.";
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      errorElement.textContent = "Unable to connect to the server.";
    }
  });
});
