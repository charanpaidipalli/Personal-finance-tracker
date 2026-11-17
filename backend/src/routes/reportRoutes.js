const router = require('express').Router();
const Income = require('../models/Income');
const Expense = require('../models/Expense');
router.get('/', async (req,res,next)=>{ try {
  const [income,expense]=await Promise.all([Income.find({userId:req.user._id}).sort({date:-1}),Expense.find({userId:req.user._id}).sort({date:-1})]);
  const totalIncome=income.reduce((s,x)=>s+x.amount,0), totalExpense=expense.reduce((s,x)=>s+x.amount,0);
  res.json({generatedAt:new Date(), totalIncome,totalExpense,balance:totalIncome-totalExpense,income,expense});
} catch(e){next(e);} });
module.exports = router;
