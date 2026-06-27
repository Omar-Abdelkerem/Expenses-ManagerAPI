const express = require("express");
const {
  getProfile,
  updateProfile,
  getSummary,
} = require("../Controller/getProfile");

const router = express.Router();

router.route("/").get(getProfile);
router.route("/update").patch(updateProfile);
router.route("/summary").get(getSummary);
module.exports = router;
