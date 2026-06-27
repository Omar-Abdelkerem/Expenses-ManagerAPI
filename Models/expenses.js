const mongoose = require("mongoose");

const expensesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide title"],
    },
    amount: {
      type: Number,
      required: [true, "Please provide amount"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Expense", expensesSchema);
