const express = require("express");
const { NotFoundError } = require("../Error/index");
const { StatusCodes } = require("http-status-codes");
const User = require("../Models/user");
const Expense = require("../Models/expenses");

const getProfile = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  res.status(StatusCodes.OK).json({ user });
};

const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const { username, email, budget, password } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: userId },
    { username, email, budget, password },
    { new: true, runValidators: true },
  );
  if (!user) {
    throw new NotFoundError("User not found");
  }
  res.status(StatusCodes.OK).json({ user });
};

const getSummary = async (req, res) => {
  const { userId } = req.user;
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }
  const expenses = await Expense.find({ userId: userId });
  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const remainingMoney = user.budget - totalExpenses;
  res.status(StatusCodes.OK).json({
    budget: user.budget,
    remainingMoney: remainingMoney,
    totalExpenses: totalExpenses,
  });
};

module.exports = {
  getProfile,
  updateProfile,
  getSummary,
};
