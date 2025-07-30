const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const createSession = require("./utils/session");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const serviceAccount = require("./config/serviceAccountKey.json");
const morgan = require("morgan");

// Log requests in 'dev' format (color-coded, concise)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();

app.use(morgan("dev"));

app.use(createSession());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT"],
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

app.listen(3001, () => {
  console.log("Server running on PORT 3001");
});
