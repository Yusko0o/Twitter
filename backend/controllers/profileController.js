const { getUserById } = require("../models/userModel");

const getProfile = async (req, res) => {
    try {
        const user = await getUserById(1);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            id: user.id,
            username: user.username,
            profilePicture: user.profile_picture
        });

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    getProfile
};