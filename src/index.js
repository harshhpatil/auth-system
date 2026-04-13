import "dotenv/config";
import dbConnection from "./config/dbConnection.js";
import app from "./app.js";

// defining the constants
const PORT = process.env.PORT;
const HEALTH_URL = `http://127.0.0.1:${PORT}/health`;

// function for starting the server
async function startServer() {
  if (!PORT) {
    throw new Error("PORT env variable doesn't exists or not loaded properly");
  }

  await dbConnection();
  app.listen(process.env.PORT, () => {
    console.log(
      `server successfully running on ${PORT}. \ncheck the health of the server: ${HEALTH_URL}`,
    );
  });
}

// calling the startServer function
startServer();
