const mongoose = require('mongoose');
const expenseSchema = new mongoose.Schema({
    description : {
    type : String,
      trim: true,
      maxlength: 100,
      required : true
    },
    amount : {
      type : Number,
      min: 0.01,
      required : true
    },
    category: {
      type: String,
      trim: true,
      maxlength: 50,
      required : true,
  },
  date: {
    type: Date,
    required : true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  type: {
    type: String,
    default: "expense",  
  },

}, { timestamps: true });

expenseSchema.index({ userId: 1, date: -1 });

const expenseDB = mongoose.model('expense', expenseSchema);
module.exports = expenseDB;