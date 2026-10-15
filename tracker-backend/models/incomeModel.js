const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
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
    default: "income",  
  },
},{timestamps:true});

incomeSchema.index({ userId: 1, date: -1 });

const Income = mongoose.model('income', incomeSchema);
module.exports = Income;