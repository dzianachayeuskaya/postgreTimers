const path = require("path");
const { findUserBySessionId } = require(path.join(__dirname, "db"));

const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }

  req.user = await findUserBySessionId(req.cookies["sessionId"]);
  req.sessionId = req.cookies["sessionId"];
  next();
};

module.exports = { auth };
