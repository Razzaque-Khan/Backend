import { Router } from "express";
import {
  changeCurrentPassword,
  deleteUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/delete-user").delete(verifyJWT, deleteUser)
router.route("/").get(verifyJWT, getCurrentUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-user").post(verifyJWT, updateAccountDetails);
router.route("/update-avatar").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  updateUserAvatar
);

router.route("/update-cover-image").post(
  upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  updateUserCoverImage
);

export default router;
