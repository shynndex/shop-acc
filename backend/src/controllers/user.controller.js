import { asyncHandler, AppError } from "../middlewares/errorHandler.js";

export const getUserProfile = asyncHandler((req, res) => {
  const user = req.user;
  res.status(200).json({ user });
});
