
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Done"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
