const API_URL = "";

document.addEventListener("DOMContentLoaded", async () => {
  await loadProfile();

  setupLogout();
  setupEditProfile();
});

async function loadProfile() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      window.location.href = "/login";
      return;
    }

    const data = await response.json();
    const user = data.user || data;

    const username = document.querySelector("#profile-username");
    const handle = document.querySelector("#profile-handle");
    const bio = document.querySelector("#profile-bio");
    const picture = document.querySelector("#profile-picture");
    const createdAt = document.querySelector("#profile-created-at");

    username.textContent = user.username;
    handle.textContent = `@${user.username}`;
    bio.textContent = user.bio || "No bio yet.";

    picture.src = user.avatar || "/images/default-profile.png";

    if (user.created_at) {
      const date = new Date(user.created_at);

      createdAt.textContent = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    }

    document.querySelector("#following-count").textContent =
      user.following_count || 0;

    document.querySelector("#followers-count").textContent =
      user.followers_count || 0;

    document.querySelector("#posts-count").textContent = user.posts_count || 0;

    await loadUserPosts(user.id);
  } catch (error) {
    console.error("Profile error:", error);
  }
}

async function loadUserPosts(userId) {
  try {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch posts");
    }

    const posts = await response.json();

    const userPosts = posts.filter(
      (post) => Number(post.user_id) === Number(userId),
    );

    displayUserPosts(userPosts);
  } catch (error) {
    console.error("Posts error:", error);
  }
}

function displayUserPosts(posts) {
  const container = document.querySelector("#user-posts");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = `       <div class="empty-profile">         <h2>You haven't posted anything yet</h2>         <p>Your posts will appear here.</p>       </div>
    `;

    return;
  }

  posts.forEach((post) => {
    const article = document.createElement("article");
    article.classList.add("post");

    const avatar = document.createElement("div");
    avatar.classList.add("post-avatar");

    const avatarImage = document.createElement("img");

    avatarImage.src = post.profile_picture || "/images/default-profile.png";

    avatarImage.alt = "Profile picture";

    avatar.appendChild(avatarImage);

    const body = document.createElement("div");
    body.classList.add("post-body");

    const userInfo = document.createElement("div");
    userInfo.classList.add("post-user-info");

    const username = document.createElement("strong");
    username.textContent = post.username;

    const handle = document.createElement("span");
    handle.textContent = `@${post.username}`;

    const separator = document.createElement("span");
    separator.textContent = "·";

    const date = document.createElement("span");
    date.textContent = formatPostDate(post.created_at);

    userInfo.append(username, handle, separator, date);

    body.appendChild(userInfo);

    if (post.content) {
      const content = document.createElement("p");

      content.textContent = post.content;

      body.appendChild(content);
    }

    const footer = document.createElement("div");
    footer.classList.add("post-footer");

    const likes = document.createElement("button");
    likes.textContent = `❤️ ${post.likes_count || 0}`;

    const comments = document.createElement("button");
    comments.textContent = `💬 ${post.comments_count || 0}`;

    const share = document.createElement("button");
    share.textContent = "↗️";

    const save = document.createElement("button");
    save.textContent = "🔖";

    footer.append(likes, comments, share, save);

    body.appendChild(footer);

    article.append(avatar, body);

    container.appendChild(article);
  });
}

function formatPostDate(createdAt) {
  if (!createdAt) {
    return "";
  }

  const date = new Date(createdAt);
  const now = new Date();

  const difference = Math.floor((now - date) / 1000);

  if (difference < 60) {
    return `${difference}s`;
  }

  if (difference < 3600) {
    return `${Math.floor(difference / 60)}m`;
  }

  if (difference < 86400) {
    return `${Math.floor(difference / 3600)}h`;
  }

  if (difference < 604800) {
    return `${Math.floor(difference / 86400)}d`;
  }

  return date.toLocaleDateString();
}

function setupLogout() {
  const logoutButton = document.querySelector("#logout-button");

  if (!logoutButton) {
    return;
  }

  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  });
}

function setupEditProfile() {
  const editButton = document.querySelector("#edit-profile-button");
  const modal = document.querySelector("#edit-profile-modal");
  const closeButton = document.querySelector("#close-edit-profile");
  const overlay = document.querySelector(".modal-overlay");
  const form = document.querySelector("#edit-profile-form");

  if (!editButton || !modal || !form) {
    return;
  }

  editButton.addEventListener("click", async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        window.location.href = "/login";
        return;
      }

      const data = await response.json();
      const user = data.user || data;

      document.querySelector("#edit-username").value = user.username || "";

      document.querySelector("#edit-bio").value = user.bio || "";

      document.querySelector("#edit-profile-error").textContent = "";

      modal.classList.remove("hidden");
    } catch (error) {
      console.error("Edit profile error:", error);
    }
  });

  closeButton.addEventListener("click", closeEditModal);

  overlay.addEventListener("click", closeEditModal);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.querySelector("#edit-username").value.trim();

    const bio = document.querySelector("#edit-bio").value.trim();

    const errorElement = document.querySelector("#edit-profile-error");

    if (username.length < 3 || username.length > 50) {
      errorElement.textContent =
        "Username must contain between 3 and 50 characters.";

      return;
    }

    if (bio.length > 160) {
      errorElement.textContent = "Bio cannot contain more than 160 characters.";

      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorElement.textContent = data.error || "Failed to update profile.";

        return;
      }

      closeEditModal();

      await loadProfile();
    } catch (error) {
      console.error("Update profile error:", error);

      errorElement.textContent = "Unable to update your profile.";
    }
  });
}

function closeEditModal() {
  const modal = document.querySelector("#edit-profile-modal");

  if (modal) {
    modal.classList.add("hidden");
  }
}
