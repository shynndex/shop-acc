import express from "express";
import { connectDB } from "./libs/db.js";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { protectedRoute } from "./middlewares/authMiddleware.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

//middleware
app.use(express.json());
app.use(cookieParser());
//public routes
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ], // 👈 frontend domain
    credentials: true, // 👈 cho phép gửi cookie/session
  }),
);
app.use("/api/auth", authRoute);
app.use(protectedRoute);
app.use("/api/users", userRoute);
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
//30:23
