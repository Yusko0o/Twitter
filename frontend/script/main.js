async function getPfp() {

    let pfp = document.getElementById("profile-picture");

    const response = await fetch("/api/profile", {
        credentials: "include"
    });

    const user = await response.json();

    pfp.src = user.profile_image_url;
}

window.addEventListener("DOMContentLoaded", getPfp);