// Import the express module
const express = require("express");
const{register,login, refreshToken} = require("../controllers/auth.js");
// Create an instance of the express router
const router = express.Router();
// Define a route on the router
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.get("/about", (req, res) => {
  res.send("This is the about route!");
});
// Export the router so that it can be used in other files
module.exports = router;
