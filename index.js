const express = require("express");
const path = require("path");
const { promisify } = require("util");
const bcrypt = require("bcrypt");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { findUserByUsername, createUser, createSession, deleteSession } = require(path.join(__dirname, "db"));
const { auth } = require(path.join(__dirname, "utils"));

const app = express();

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/timers", require(path.join(__dirname, "timers")));

nunjucks.configure("views", {
  autoescape: true,
  express: app,
  tags: {
    blockStart: "[%",
    blockEnd: "%]",
    variableStart: "[[",
    variableEnd: "]]",
    commentStart: "[#",
    commentEnd: "#]",
  },
});

app.set("view engine", "njk");

app.get("/", auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
    signupError: req.query.signupError === "true" ? "A user with the same name already exists" : req.query.signupError,
  });
});

const compareAsync = promisify(bcrypt.compare);

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res
      .status(404)
      .send(
        "Для аутентификации в теле запроса необходимо указать поля username и password со значениями в формате x-www-form-urlencoded."
      );
  }

  const { username, password } = req.body;
  const user = await findUserByUsername(username);
  if (!user || !compareAsync(password, user.password_hash)) {
    return res.redirect("/?authError=true");
  }
  const sessionId = await createSession(user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.get("/logout", auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  if (!req.body.username || !req.body.password) {
    return res
      .status(404)
      .send(
        "Для регистрации пользователя в теле запроса необходимо указать поля username и password со значениями в формате x-www-form-urlencoded."
      );
  }
  if (await findUserByUsername(req.body.username)) return res.redirect("/?signupError=true");
  const user = await createUser(req.body);
  const sessionId = await createSession(user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.use((err, req, res) => {
  res.status(500).send(err.message);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`  Listening on http://localhost:${port}`);
});
