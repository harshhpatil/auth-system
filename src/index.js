import "dotenv/config";
import app from "./app.js";
import dbConnection from "./config/dbConnection.js";

const PORT = process.env.PORT;
if (!PORT) {
  console.error(
    "PORT is not defined or loaded properly from the environment variables",
  );
  process.exit(1);
}

async function startServer() {
  try {
    await dbConnection(); // connecting to the database

    app.listen(PORT, () => {
      console.log(`server is successfully running on port ${PORT}`);
    });
  } catch (err) {
    console.error("error in starting the server", err);
  }
}

startServer(); // starting the server
