
const router = require("express").Router();

const auth = require("../controllers/authController");
const authenticate = require("../middleware/auth");

router.post("/register/request-otp", auth.requestRegistrationOTP);
router.post("/register/verify-otp", auth.verifyRegistrationOTP);

router.post("/login", auth.login);

router.get("/profile", authenticate, auth.profile);

router.post("/forgot-password", auth.requestPasswordReset);
router.post("/reset-password", auth.resetPassword);

module.exports = router;
