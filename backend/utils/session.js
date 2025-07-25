const session = require("express-session");

const sessionOptions = {
  key: "userId",
  secret: "secretverysecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60,
  },
};
module.exports = createSession = () => session(sessionOptions);
