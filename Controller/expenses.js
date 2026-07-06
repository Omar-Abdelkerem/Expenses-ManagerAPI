const Expense = require("../Models/expenses");
const Category = require("../Models/category");
const { getStatistics } = require("../services/expenseStatistics");
const { StatusCodes } = require("http-status-codes");
const { getBudgetStatus } = require("../services/getBudgetStatus");
const {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} = require("../Error/index");
const User = require("../Models/user");

const showAllExpenses = async (req, res) => {
  const userId = req.user.userId;
  const { title, amount, date, category, sort, fields } = req.query;
  const queryObject = { userId };
  if (title) {
    queryObject.title = { $regex: title, $options: "i" };
  }
  if (amount) {
    queryObject.amount = amount;
  }
  if (date) {
    queryObject.date = date;
  }
  if (category) {
    queryObject.category = category;
  }
  let result = Expense.find(queryObject).populate({
    path: "category",
    select: "name",
  });
  if (sort) {
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    result = result.sort("-createdAt");
  }
  if (fields) {
    const fieldsList = fields.split(",").join(" ");
    result = result.select(fieldsList);
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  result = result.skip(skip).limit(limit);

  const expenses = await result;

  res.status(StatusCodes.OK).json({ expenses, count: expenses.length });
};

const addExpense = async (req, res) => {
  const userId = req.user.userId;
  const { title, amount, date, category } = req.body;
  if (!title || !amount || !category) {
    throw new BadRequestError("Please provide all values");
  }
  const CategoryExists = await Category.findOne({
    _id: category,
    userId,
  });
  if (!CategoryExists) {
    throw new BadRequestError("Category does not exist");
  }

  const expense = await Expense.create({
    title,
    amount,
    date,
    category,
    userId,
  });
  const budgetStatus = await getBudgetStatus(userId);
  res.status(StatusCodes.CREATED).json({ expense, budgetStatus });
};

const deleteExpense = async (req, res) => {
  const {
    user: { userId },
    params: { id: expenseId },
  } = req;

  const expense = await Expense.findOneAndDelete({ _id: expenseId, userId });
  if (!expense) {
    throw new NotFoundError("Expense not found");
  }
  const budgetStatus = await getBudgetStatus(userId);
  res
    .status(StatusCodes.OK)
    .json({ msg: "Expense deleted successfully", budgetStatus });
};

const updateExpense = async (req, res) => {
  const {
    user: { userId },
    params: { id: expenseId },
    body: { title, amount, date, category },
  } = req;
  if (!title || !amount || !category) {
    throw new BadRequestError("Please provide all values");
  }
  const CategoryExists = await Category.findOne({
    _id: category,
    userId,
  });
  if (!CategoryExists) {
    throw new BadRequestError("Category does not exist");
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, userId },
    { title, amount, date, category },
    { new: true },
  );
  if (!expense) {
    throw new NotFoundError("Expense not found");
  }
  const budgetStatus = await getBudgetStatus(userId);
  res.status(StatusCodes.OK).json({ expense, budgetStatus });
};

const showStatistics = async (req, res) => {
  const userId = req.user.userId;
  const statistics = await getStatistics(userId);
  const budgetStatus = await getBudgetStatus(userId);
  res.status(StatusCodes.OK).json({ statistics, budgetStatus });
};

module.exports = {
  showAllExpenses,
  addExpense,
  deleteExpense,
  updateExpense,
  showStatistics,
};
