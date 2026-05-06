import express from "express";
import { connectDB } from "./libs/db.config.js";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";
import accountRoute from "./routes/account.route.js";
import sseRoute from "./routes/sse.route.js";
import userRoute from "./routes/user.route.js";

import paymentRoute from "./routes/payment.route.js";
import adminAuthRoute from "./routes/admin/auth.route.js";
import adminAccountRoute from "./routes/admin/account.route.js";

// import userRoute from "./routes/user.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
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
    ],
    credentials: true,
  }),
);
app.use("/api/auth", authRoute);
// app.use(protectedRoute);
app.use("/api/accounts", accountRoute);
app.use("/api/user", userRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/sse", sseRoute);
app.use("/api/admin/auth", adminAuthRoute);
app.use("/api/admin/accounts", adminAccountRoute);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error occurred while starting the server:", err);
    process.exit(1);
  });
