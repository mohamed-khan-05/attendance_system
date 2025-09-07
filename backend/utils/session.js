const session = require("express-session");

const sessionOptions = {
  key: "userId",
  secret: process.env.SESSION_SECRET || "secretverysecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60, // 1 hour
  },
};

module.exports = createSession = () => session(sessionOptions);
