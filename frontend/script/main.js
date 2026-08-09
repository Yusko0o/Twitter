async function loadProfilePicture() {
    try {
        const response = await fetch("http://localhost:3000/api/profile");

        if (!response.ok) {
            throw new Error("Impossible de récupérer le profil");
        }

        const data = await response.json();

        const profilePicture = document.getElementById("profile-picture");

        profilePicture.src = data.profilePicture;

    } catch (error) {
        console.error("Erreur :", error);
    }
}

loadProfilePicture();