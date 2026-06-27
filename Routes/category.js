const express = require("express");
const router = express.Router();
const {
  showAllCategories,
  addCategory,
  deleteCategory,
  updateCategory,
} = require("../Controller/category");

router.route("/").get(showAllCategories).post(addCategory);
router.route("/:id").delete(deleteCategory).patch(updateCategory);

module.exports = router;
