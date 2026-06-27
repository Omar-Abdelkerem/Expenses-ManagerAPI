const Category = require("../Models/category");
const Expense = require("../Models/expenses");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} = require("../Error/index");

const showAllCategories = async (req, res) => {
  const userId = req.user.userId;
  const categories = await Category.find({ userId }).sort("name");
  res.status(StatusCodes.OK).json({ categories, count: categories.length });
};

const addCategory = async (req, res) => {
  const userId = req.user.userId;
  const { name } = req.body;
  if (!name) {
    throw new BadRequestError("Please provide category name");
  }
  const existingCategory = await Category.findOne({ name, userId });
  if (existingCategory) {
    throw new BadRequestError("Category already exists");
  }
  const category = await Category.create({ name, userId });
  res.status(StatusCodes.CREATED).json({ category });
};

const deleteCategory = async (req, res) => {
  const userId = req.user.userId;
  const { id: categoryId } = req.params;
  const count = await Expense.countDocuments({
    category: categoryId,
    userId,
  });
  if (count > 0) {
    throw new BadRequestError(
      "Cannot delete category with associated expenses",
    );
  }
  const category = await Category.findOneAndDelete({
    _id: categoryId,
    userId,
  });
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  res.status(StatusCodes.OK).json({ msg: "Category deleted successfully" });
};

const updateCategory = async (req, res) => {
  const userId = req.user.userId;
  const { id: categoryId } = req.params;
  const { name } = req.body;
  if (!name) {
    throw new BadRequestError("Please provide category name");
  }
  const existingCategory = await Category.findOne({
    name,
    userId,
    _id: { $ne: categoryId },
  });
  if (existingCategory) {
    throw new BadRequestError("Category already exists");
  }
  const category = await Category.findOneAndUpdate(
    { _id: categoryId, userId },
    { name },
    { new: true },
  );
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  res.status(StatusCodes.OK).json({ category });
};
module.exports = {
  showAllCategories,
  addCategory,
  deleteCategory,
  updateCategory,
};
