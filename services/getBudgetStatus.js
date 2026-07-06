const mongoose = require("mongoose");
const Expense = require("../Models/expenses");
const User = require("../Models/user");
const { NotFoundError } = require("../Error/index");

const getBudgetStatus = async (userId) => {
  const totalExpense = await Expense.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
  ]);
  const totalAmount = totalExpense[0] ? totalExpense[0].totalAmount : 0;
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return {
    exceeded: totalAmount > user.budget,
    limit: user.budget,
    warning: totalAmount > user.budget ? "Expense exceeds budget" : null,
    spent: totalAmount,
    remaining: user.budget - totalAmount,
  };
};

module.exports = { getBudgetStatus };
