import mongoose from "mongoose";

const connectDB = async () => {
  const localMongoUri = "mongodb://127.0.0.1:27017/elitemart";
  const mongoUri = process.env.MONGO_URI?.trim() || localMongoUri;

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected Successfully`);
  } catch (error) {
    const shouldRetryLocal =
      mongoUri !== localMongoUri &&
      (error?.code === "ECONNREFUSED" ||
        error?.code === "ENOTFOUND" ||
        String(error?.message || "").includes("querySrv"));

    if (shouldRetryLocal) {
      console.warn(
        "Primary MongoDB URI failed. Retrying with local MongoDB at mongodb://127.0.0.1:27017/elitemart"
      );
      try {
        await mongoose.connect(localMongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log("MongoDB Connected Successfully (local fallback)");
        return;
      } catch (localError) {
        console.log("Error while connecting to local fallback database ", localError);
        throw localError;
      }
    }

    console.log(`Error while connecting to database `, error);
    throw error;
  }
};
export default connectDB;