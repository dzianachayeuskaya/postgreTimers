const express = require("express");
const path = require("path");
const { stopTimer } = require("./db");

const { findUserByUsername, findTimersByUserId, findTimerByTimerId, createTimer } = require(path.join(__dirname, "db"));
const { auth } = require(path.join(__dirname, "utils"));

const router = express.Router();

router.get("/", auth(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  let timers = await findTimersByUserId(req.user.id);
  timers = timers.map((timer) => {
    if (timer.is_active) return { ...timer, progress: Date.now() - timer.started_at };
    return timer;
  });
  if (req.query.isActive) {
    const targetTimers =
      req.query.isActive === "true"
        ? timers.filter((timer) => timer.is_active)
        : timers.filter((timer) => !timer.is_active);
    return res.json(targetTimers);
  }
  return res.json(timers);
});

router.post("/", auth(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }
  const currentUser = await findUserByUsername(req.user.username);

  const timer = await createTimer(currentUser.id, req.body.description ? req.body.description : "");

  res.header("Location", `${req.protocol}://${req.hostname}/api/timers/${timer.id}`).json(timer);
});

router.post("/:id/stop", auth(), async (req, res) => {
  if (!req.user) {
    return res.sendStatus(401);
  }

  const targetTimer = await findTimerByTimerId(req.params.id);
  if (!targetTimer) {
    res.status(404).send(`Unknown timer ID: ${req.params.id}`);
    return;
  }
  if (targetTimer.is_active) {
    const stoppedTimer = await stopTimer(targetTimer.id);
    return res.json(JSON.stringify(stoppedTimer));
  }
  return res.sendStatus(403);
});

module.exports = router;
