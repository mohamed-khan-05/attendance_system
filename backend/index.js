const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const morgan = require("morgan");

require("dotenv").config();
console.log("NODE_ENV:", process.env.NODE_ENV);

let serviceAccount;

if (process.env.NODE_ENV === "development") {
  serviceAccount = require("./config/serviceAccountKey.json");
} else {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(morgan("dev"));

app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const authRouter = require("./routes/authRoute")(db);
app.use("/auth", authRouter);
const usersRouter = require("./routes/usersRoute")(db);
app.use("/users", usersRouter);
const modulesRouter = require("./routes/modulesRoute")(db);
app.use("/modules", modulesRouter);
const classRouter = require("./routes/classRoute")(db);
app.use("/class", classRouter);
const attendanceRouter = require("./routes/attendanceRoute")(db);
app.use("/attendance", attendanceRouter);
const markRouter = require("./routes/markRoute")(db);
app.use("/mark", markRouter);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV === "development") {
  app.listen(3001, () => {
    console.log("Server running on PORT 3001 (development)");
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT} (production)`);
  });
}
