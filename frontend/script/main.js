const API_URL = "";
const DEFAULT_PROFILE_PICTURE = "/images/default-profile.png";
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_VIDEO_SIZE = 2.8 * 1024 * 1024;

let currentUser = null;
let selectedImage = null;
let selectedVideo = null;
let loadedPosts = [];

const isBookmarksView = new URLSearchParams(window.location.search).get("view") === "bookmarks";

document.addEventListener("DOMContentLoaded", async () => {
  setupComposer();
  setupNavigation();
  setupSearch();
  await loadUser();
  await loadPosts();
});

async function apiFetch(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  return { response, data };
}

async function loadUser() {
  try {
    const { response, data } = await apiFetch("/api/auth/me");
    const authButtons = document.querySelector(".auth-buttons");
    const profilePicture = document.querySelector("#profile-picture");

    if (!response.ok) {
      currentUser = null;
      if (authButtons) authButtons.style.display = "flex";
      if (profilePicture) profilePicture.src = DEFAULT_PROFILE_PICTURE;
      return;
    }

    currentUser = data;
    if (authButtons) authButtons.style.display = "none";
    if (profilePicture) profilePicture.src = currentUser.avatar || DEFAULT_PROFILE_PICTURE;
  } catch (error) {
    console.error("Unable to load user:", error);
  }
}

async function loadPosts() {
  const container = document.querySelector("#posts-container");

  try {
    const endpoint = isBookmarksView ? "/api/posts?bookmarked=1" : "/api/posts";
    const { response, data } = await apiFetch(endpoint);

    if (response.status === 401 && isBookmarksView) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) throw new Error(data?.error || "Unable to fetch posts");

    loadedPosts = Array.isArray(data) ? data : [];
    displayPosts(loadedPosts);

    if (window.location.hash.startsWith("#post-")) {
      document.querySelector(window.location.hash)?.scrollIntoView({ block: "center" });
    }
  } catch (error) {
    console.error("Unable to load posts:", error);
    if (container) {
      container.innerHTML = '<p class="feed-message">Unable to load posts.</p>';
    }
  }
}

function setupComposer() {
  const input = document.querySelector("#post");
  const publishButton = document.querySelector("#publish-post");
  const imageButton = document.querySelector("#image-button");
  const videoButton = document.querySelector("#video-button");
  const emojiButton = document.querySelector("#emoji-button");

  if (!input) return;

  publishButton?.addEventListener("click", createPost);
  input.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await createPost();
    }
  });

  imageButton?.addEventListener("click", () => chooseMedia("image"));
  videoButton?.addEventListener("click", () => chooseMedia("video"));
  emojiButton?.addEventListener("click", () => {
    const start = input.selectionStart ?? input.value.length;
    input.value = `${input.value.slice(0, start)}😊${input.value.slice(start)}`;
    input.focus();
    input.selectionStart = input.selectionEnd = start + 2;
  });
}

function chooseMedia(type) {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = type === "image" ? "image/png,image/jpeg,image/webp,image/gif" : "video/mp4,video/webm,video/ogg";

  picker.addEventListener("change", async () => {
    const file = picker.files?.[0];
    if (!file) return;

    const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      showComposerMessage(`${type === "image" ? "Image" : "Video"} is too large.`);
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      if (type === "image") {
        selectedImage = dataUrl;
        selectedVideo = null;
      } else {
        selectedVideo = dataUrl;
        selectedImage = null;
      }
      renderMediaPreview();
    } catch (error) {
      console.error("Unable to read media:", error);
      showComposerMessage("Unable to read the selected media.");
    }
  });

  picker.click();
}

function renderMediaPreview() {
  let preview = document.querySelector("#media-preview");
  const postContent = document.querySelector(".post-content");
  if (!postContent) return;

  if (!preview) {
    preview = document.createElement("div");
    preview.id = "media-preview";
    const actions = document.querySelector(".post-actions");
    postContent.insertBefore(preview, actions);
  }

  preview.innerHTML = "";
  if (!selectedImage && !selectedVideo) {
    preview.remove();
    return;
  }

  const media = selectedImage ? document.createElement("img") : document.createElement("video");
  media.src = selectedImage || selectedVideo;
  media.className = "composer-media-preview";
  if (!selectedImage) media.controls = true;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-media";
  remove.textContent = "×";
  remove.title = "Remove media";
  remove.addEventListener("click", () => {
    selectedImage = null;
    selectedVideo = null;
    renderMediaPreview();
  });

  preview.append(media, remove);
}

async function createPost() {
  const input = document.querySelector("#post");
  if (!input) return;

  if (!currentUser) {
    window.location.href = "/login";
    return;
  }

  const content = input.value.trim();
  if (!content && !selectedImage && !selectedVideo) return;

  const publishButton = document.querySelector("#publish-post");
  if (publishButton) publishButton.disabled = true;

  try {
    const { response, data } = await apiFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({ content, imageUrl: selectedImage, videoUrl: selectedVideo }),
    });

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    if (!response.ok) throw new Error(data?.error || "Unable to create post");

    input.value = "";
    selectedImage = null;
    selectedVideo = null;
    renderMediaPreview();
    showComposerMessage("");
    await loadPosts();
  } catch (error) {
    console.error("Unable to create post:", error);
    showComposerMessage(error.message);
  } finally {
    if (publishButton) publishButton.disabled = false;
  }
}

function displayPosts(posts) {
  const container = document.querySelector("#posts-container");
  if (!container) return;

  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = `<p class="feed-message">${isBookmarksView ? "No bookmarks yet." : "No posts yet."}</p>`;
    return;
  }

  posts.forEach((post) => container.appendChild(createPostElement(post)));
}

function createPostElement(post) {
  const article = document.createElement("article");
  article.className = "post";
  article.id = `post-${post.id}`;
  article.dataset.postId = post.id;

  const avatarContainer = document.createElement("div");
  avatarContainer.className = "post-avatar";
  const avatar = document.createElement("img");
  avatar.src = post.avatar || DEFAULT_PROFILE_PICTURE;
  avatar.alt = "Profile";
  avatarContainer.appendChild(avatar);

  const body = document.createElement("div");
  body.className = "post-body";

  const userInfo = document.createElement("div");
  userInfo.className = "post-user-info";
  const username = document.createElement("strong");
  username.textContent = post.username || "User";
  const handle = document.createElement("span");
  handle.textContent = `@${post.username || "user"}`;
  const separator = document.createElement("span");
  separator.textContent = " · ";
  const date = document.createElement("span");
  date.textContent = formatDate(post.created_at);
  userInfo.append(username, handle, separator, date);

  if (post.is_owner) {
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-post-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deletePost(post.id));
    userInfo.appendChild(deleteButton);
  }

  body.appendChild(userInfo);

  if (post.content) {
    const content = document.createElement("p");
    content.textContent = post.content;
    body.appendChild(content);
  }

  if (post.image_url) {
    const image = document.createElement("img");
    image.className = "post-media";
    image.src = post.image_url;
    image.alt = "Post image";
    body.appendChild(image);
  }

  if (post.video_url) {
    const video = document.createElement("video");
    video.className = "post-media";
    video.src = post.video_url;
    video.controls = true;
    body.appendChild(video);
  }

  const footer = document.createElement("div");
  footer.className = "post-footer";

  const likes = actionButton(`❤️ ${post.likes_count || 0}`, post.liked_by_me, () => toggleLike(post));
  const comments = actionButton(`💬 ${post.comments_count || 0}`, false, () => toggleComments(post.id, article));
  const share = actionButton("↗️", false, () => sharePost(post));
  const save = actionButton(post.bookmarked_by_me ? "🔖 Saved" : "🔖", post.bookmarked_by_me, () => toggleBookmark(post));

  footer.append(likes, comments, share, save);
  body.appendChild(footer);
  article.append(avatarContainer, body);
  return article;
}

function actionButton(text, active, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  if (active) button.classList.add("active");
  button.addEventListener("click", handler);
  return button;
}

async function toggleLike(post) {
  if (!currentUser) return redirectToLogin();
  const method = post.liked_by_me ? "DELETE" : "POST";
  const { response } = await apiFetch(`/api/posts/${post.id}/like`, { method });
  if (response.status === 401) return redirectToLogin();
  if (response.ok) await loadPosts();
}

async function toggleBookmark(post) {
  if (!currentUser) return redirectToLogin();
  const method = post.bookmarked_by_me ? "DELETE" : "POST";
  const { response } = await apiFetch(`/api/posts/${post.id}/bookmark`, { method });
  if (response.status === 401) return redirectToLogin();
  if (response.ok) await loadPosts();
}

async function deletePost(postId) {
  if (!currentUser || !window.confirm("Delete this post?")) return;
  const { response, data } = await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
  if (!response.ok) {
    if (response.status === 401) return redirectToLogin();
    window.alert(data?.error || "Unable to delete post.");
    return;
  }
  await loadPosts();
}

async function toggleComments(postId, article) {
  const existing = article.querySelector(".comments-panel");
  if (existing) {
    existing.remove();
    return;
  }

  const panel = document.createElement("div");
  panel.className = "comments-panel";
  panel.innerHTML = '<p class="comments-loading">Loading comments...</p>';
  article.querySelector(".post-body")?.appendChild(panel);

  const { response, data } = await apiFetch(`/api/posts/${postId}/comments`);
  if (!response.ok) {
    panel.innerHTML = '<p class="comments-loading">Unable to load comments.</p>';
    return;
  }

  renderComments(panel, postId, data);
}

function renderComments(panel, postId, comments) {
  panel.innerHTML = "";

  const list = document.createElement("div");
  list.className = "comments-list";

  comments.forEach((comment) => {
    const row = document.createElement("div");
    row.className = "comment-row";
    const avatar = document.createElement("img");
    avatar.src = comment.avatar || DEFAULT_PROFILE_PICTURE;
    avatar.alt = "";
    const text = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = comment.username;
    const content = document.createElement("p");
    content.textContent = comment.content;
    text.append(name, content);
    row.append(avatar, text);
    list.appendChild(row);
  });

  if (comments.length === 0) {
    const empty = document.createElement("p");
    empty.className = "comments-loading";
    empty.textContent = "No comments yet.";
    list.appendChild(empty);
  }

  panel.appendChild(list);

  const form = document.createElement("form");
  form.className = "comment-form";
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 500;
  input.placeholder = currentUser ? "Write a comment..." : "Log in to comment";
  input.disabled = !currentUser;
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Reply";
  button.disabled = !currentUser;
  form.append(input, button);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) return;

    const { response } = await apiFetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    if (response.status === 401) return redirectToLogin();
    if (response.ok) {
      const refreshed = await apiFetch(`/api/posts/${postId}/comments`);
      renderComments(panel, postId, refreshed.data || []);
      await loadPosts();
    }
  });

  panel.appendChild(form);
}

async function sharePost(post) {
  const url = `${window.location.origin}/#post-${post.id}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: `Post by ${post.username}`, text: post.content || "", url });
    } else {
      await navigator.clipboard.writeText(url);
      window.alert("Post link copied.");
    }
  } catch (error) {
    if (error.name !== "AbortError") console.error("Share error:", error);
  }
}

function setupNavigation() {
  document.querySelector(".create-post")?.addEventListener("click", () => {
    document.querySelector("#post")?.focus();
  });

  const navItems = [...document.querySelectorAll(".nav-item")];
  const searchNav = navItems.find((item) => item.textContent.trim() === "Search");
  const bookmarksNav = navItems.find((item) => item.textContent.trim() === "Bookmarks");

  searchNav?.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector(".search-box input")?.focus();
  });

  if (bookmarksNav) bookmarksNav.href = "/?view=bookmarks";

  if (isBookmarksView) {
    document.querySelector(".feed-header h2").textContent = "Bookmarks";
  }
}

function setupSearch() {
  const search = document.querySelector(".search-box input");
  search?.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    if (!query) return displayPosts(loadedPosts);
    displayPosts(
      loadedPosts.filter((post) =>
        `${post.username || ""} ${post.content || ""}`.toLowerCase().includes(query),
      ),
    );
  });
}

function showComposerMessage(message) {
  let element = document.querySelector("#composer-message");
  if (!element) {
    element = document.createElement("p");
    element.id = "composer-message";
    document.querySelector(".post-content")?.appendChild(element);
  }
  element.textContent = message || "";
}

function redirectToLogin() {
  window.location.href = "/login";
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDate(date) {
  if (!date) return "";
  const createdAt = new Date(date);
  const difference = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 1000));
  if (difference < 60) return `${difference}s`;
  if (difference < 3600) return `${Math.floor(difference / 60)}m`;
  if (difference < 86400) return `${Math.floor(difference / 3600)}h`;
  if (difference < 604800) return `${Math.floor(difference / 86400)}d`;
  return createdAt.toLocaleDateString();
}
