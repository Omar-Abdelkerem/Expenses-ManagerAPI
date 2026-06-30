const express = require("express");
const {
  showAllExpenses,
  addExpense,
  deleteExpense,
  updateExpense,
  showStatistics,
} = require("../Controller/expenses");

const router = express.Router();

router.route("/").get(showAllExpenses);
router.route("/").post(addExpense);
router.route("/:id").delete(deleteExpense);
router.route("/:id").patch(updateExpense);
router.route("/statistics").get(showStatistics);

module.exports = router;
