import mongoose from "mongoose";

// check if the connection string is loaded through the env variables or not
if (!process.env.MONGO_URI) {
  console.error(
    "MONGO_URI is not defined or loaded properly from the environment variables",
  );
  process.exit(1);
}

const dbConnection = async () => {
  try {
    // if the connection is already established then return
    if (mongoose.connection.readyState === 1) {
      console.log("already connected to the database");
      return;
    }

    // connecting to the databse
    await mongoose.connect(process.env.MONGO_URI);
    console.log("connected to the database successfully");
  } catch (err) {
    console.error("error occured while connecting to the database", err);
    process.exit(1);
  }
};

export default dbConnection; // exporting the connection function
