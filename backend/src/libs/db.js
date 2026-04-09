import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("MongoDb connected successfully");
  } catch (error) {
    console.log("Loi khi ket noi toi MongoDb", error);
    process.exit(1);
  }
};
