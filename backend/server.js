const express = require("express");
const cors = require("cors");

const pfpRoutes = require("./routes/pfp");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());


app.use("/api/profile", pfpRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Backend is running!"
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});