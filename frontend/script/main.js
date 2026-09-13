const API_URL = "";

const DEFAULT_PROFILE_PICTURE = "/images/default-profile.png";

document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  await loadPosts();
  setupPost();
});

async function loadUser() {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const user = data.user || data;
    const profilePicture = document.querySelector("#profile-picture");
    const authButtons = document.querySelector(".auth-buttons");

    if (authButtons) {
      authButtons.style.display = "none";
    }

    if (profilePicture) {
      profilePicture.src = user.avatar || DEFAULT_PROFILE_PICTURE;
    }
  } catch (error) {
    console.error("Erreur lors du chargement de l'utilisateur :", error);
  }
}

async function loadPosts() {
  try {
    const response = await fetch(`${API_URL}/api/posts`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Impossible de récupérer les posts");
    }

    const posts = await response.json();
    displayPosts(posts);
  } catch (error) {
    console.error("Erreur lors du chargement des posts :", error);
  }
}

function setupPost() {
  const input = document.querySelector("#post");
  const publishButton = document.querySelector("#publish-post");

  if (!input) {
    return;
  }

  if (publishButton) {
    publishButton.addEventListener("click", createPost);
  }

  input.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    await createPost();
  });
}

async function createPost() {
  const input = document.querySelector("#post");

  if (!input) {
    return;
  }

  const content = input.value.trim();

  if (!content) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/posts`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      throw new Error(data?.error || "Impossible de créer le post");
    }

    input.value = "";
    await loadPosts();
  } catch (error) {
    console.error("Erreur lors de la création du post :", error);
  }
}

function displayPosts(posts) {
  const container = document.querySelector("#posts-container");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  posts.forEach((post) => {
    const article = document.createElement("article");
    article.classList.add("post");

    const avatarContainer = document.createElement("div");
    avatarContainer.classList.add("post-avatar");

    const avatar = document.createElement("img");
    avatar.src = post.avatar || DEFAULT_PROFILE_PICTURE;
    avatar.alt = "Profile";
    avatarContainer.appendChild(avatar);

    const body = document.createElement("div");
    body.classList.add("post-body");

    const userInfo = document.createElement("div");
    userInfo.classList.add("post-user-info");

    const username = document.createElement("strong");
    username.textContent = post.username || "User";

    const handle = document.createElement("span");
    handle.textContent = `@${post.handle || post.username || "user"}`;

    const separator = document.createElement("span");
    separator.textContent = " · ";

    const date = document.createElement("span");
    date.textContent = formatDate(post.created_at);

    userInfo.appendChild(username);
    userInfo.appendChild(handle);
    userInfo.appendChild(separator);
    userInfo.appendChild(date);
    body.appendChild(userInfo);

    if (post.content) {
      const content = document.createElement("p");
      content.textContent = post.content;
      body.appendChild(content);
    }

    if (post.image_url) {
      const image = document.createElement("img");
      image.classList.add("post-media");
      image.src = post.image_url;
      image.alt = "Post image";
      body.appendChild(image);
    }

    if (post.video_url) {
      const video = document.createElement("video");
      video.classList.add("post-media");
      video.src = post.video_url;
      video.controls = true;
      body.appendChild(video);
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

    footer.appendChild(likes);
    footer.appendChild(comments);
    footer.appendChild(share);
    footer.appendChild(save);
    body.appendChild(footer);
    article.appendChild(avatarContainer);
    article.appendChild(body);
    container.appendChild(article);
  });
}

function formatDate(date) {
  if (!date) {
    return "";
  }

  const createdAt = new Date(date);
  const now = new Date();
  const difference = Math.max(0, Math.floor((now - createdAt) / 1000));

  if (difference < 60) {
    return `${difference}s`;
  }

  const minutes = Math.floor(difference / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d`;
}
