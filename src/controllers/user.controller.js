import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndrefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

//^ OK, Working Properly
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { username, email, fullName, password } = req.body;

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All field are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  req.files.hasOwnProperty = Object.prototype.hasOwnProperty; //// Injection of Object.prototype.hasOwnProperty in req.files to chect if it has a specific property?

  if (existedUser)
    throw new ApiError(409, "User with email or username already exists");
  const avatarLacalPath =
    req.files.hasOwnProperty("avatar") && req.files?.avatar[0]?.path;
  const coverImageLocalPath =
    req.files.hasOwnProperty("coverImage") && req.files?.coverImage[0]?.path;

  if (!avatarLacalPath) throw new ApiError(400, "Avatar file is required");
  const avatar = await uploadOnCloudinary(avatarLacalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "Avatar file is required");
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering the user");

  res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//^ OK, Working Properly
const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh tokens -> send to user
  // send cookie
  const { username, email, password } = req.body;

  if (!username && !email)
    throw new ApiError(400, "username or password is required");

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new ApiError(404, "User does not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) throw new ApiError(401, "Invalid Password");

  const { accessToken, refreshToken } = await generateAccessAndrefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

//^ OK, Working Properly
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.refreshToken = null;
  user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

//^ OK, Working Properly
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incommingToken) {
    throw new ApiError(401, "unauthorized request");
  }

  const decodedToken = jwt.verify(
    incommingToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id);

  if (!user) throw new ApiError(401, "Invalid refrsh token");

  if (incommingToken !== user?.refreshToken)
    throw new ApiError(401, "Refresh token is expired or used");
  const options = {
    httpOnly: true,
    secure: true,
  };
  const { accessToken, refreshToken } = await generateAccessAndrefreshTokens(
    user._id
  );

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "Access token refrshed successfully"
      )
    );
});

//^ OK, Working Properly
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword)
    throw new ApiError(401, "newPassword and confirmPassword must be same");

  if (!currentPassword || !newPassword || !confirmPassword)
    throw new ApiError(400, "All fields are required");

  const user = await User.findById(req.user._id);

  const isPasswordValid = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordValid) throw new ApiError(400, "Incorrect current password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

//^ OK, Working Properly
const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user, "current user fetched"));
});

//^ OK, Working Properly
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) throw new ApiError(400, "All fiels are required");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

//^ OK, Working Properly
const updateUserAvatar = asyncHandler(async (req, res) => {
  req.files.hasOwnProperty = Object.prototype.hasOwnProperty; //// Injection of Object.prototype.hasOwnProperty in req.files to chect if it has a specific property?
  const avatarLocalPath = req.files.hasOwnProperty("avatar") && req.files?.avatar[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file missing");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) throw new ApiError(400, "Error white uploading");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.url
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(new ApiResponse(200, user, "avatar updated successfully"));
});

//^ OK, Working Properly
const updateUserCoverImage = asyncHandler(async (req, res) => {
  req.files.hasOwnProperty = Object.prototype.hasOwnProperty; //// Injection of Object.prototype.hasOwnProperty in req.files to chect if it has a specific property?
  const coverImageLocalPath = req.files.hasOwnProperty("coverImage") && req.files?.coverImage[0]?.path;

  if (!coverImageLocalPath) throw new ApiError(400, "coverImage file missing");

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) throw new ApiError(400, "Error white uploading");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage.url
      },
    },
    { new: true }
  ).select("-password");

  res.status(200).json(new ApiResponse(200, user, "coverImage updated successfully"));
});

//^ OK, Working Properly
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select("-password -refreshToken");
  if (!user) throw new ApiError(400, "Unothrized Request");
  await User.deleteOne({ _id: req.user?._id });
  res.status(200).json(new ApiResponse(200, user, "User deleted successfully"));
})







export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  deleteUser
};
