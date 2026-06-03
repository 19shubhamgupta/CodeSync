const router = require("express").Router();

router.get("/example", (req, res) => {
  res.json({ message: "Example route" });
});

module.exports = router;
