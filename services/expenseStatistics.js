const Expense = require("../Models/expenses");
const Category = require("../Models/category");
const { exists } = require("../Models/user");
const mongoose = require("mongoose");

const getStatistics = async (userId) => {
  const statistics = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        category: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        grandTotal: { $sum: "$totalAmount" },
        categories: {
          $push: "$$ROOT",
        },
      },
    },
    {
      $unwind: "$categories",
    },
    {
      $lookup: {
        from: "categories",
        localField: "categories._id",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },

    {
      $project: {
        _id: 0,
        categoryId: "$categories._id",
        categoryName: "$categoryDetails.name",
        totalAmount: "$categories.totalAmount",
        count: "$categories.count",
        grandTotal: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ["$categories.totalAmount", "$grandTotal"] },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $sort: { totalAmount: -1 },
    },
  ]);
  return statistics;
};
module.exports = {
  getStatistics,
};
