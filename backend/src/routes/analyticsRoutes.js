const router = require('express').Router();
const Income = require('../models/Income');
const Expense = require('../models/Expense');
router.get('/summary', async (req,res,next)=>{ try {
  const [income, expense] = await Promise.all([
    Income.aggregate([{ $match:{userId:req.user._id} },{ $group:{ _id:null, total:{ $sum:'$amount' } } }]),
    Expense.aggregate([{ $match:{userId:req.user._id} },{ $group:{ _id:null, total:{ $sum:'$amount' } } }])
  ]);
  const totalIncome=income[0]?.total||0, totalExpense=expense[0]?.total||0;
  res.json({totalIncome,totalExpense,balance:totalIncome-totalExpense});
} catch(e){next(e);} });
router.get('/monthly', async (req,res,next)=>{ try {
  const rows = await Promise.all([
    Income.aggregate([{ $match:{userId:req.user._id} },{ $group:{ _id:{ $dateToString:{format:'%Y-%m',date:'$date'} }, total:{ $sum:'$amount' } } }]),
    Expense.aggregate([{ $match:{userId:req.user._id} },{ $group:{ _id:{ $dateToString:{format:'%Y-%m',date:'$date'} }, total:{ $sum:'$amount' } } }])
  ]);
  const map={};
  for(const r of rows[0]) map[r._id]={month:r._id,income:r.total,expense:0};
  for(const r of rows[1]) map[r._id] ??= {month:r._id,income:0,expense:0};
  for(const r of rows[1]) map[r._id].expense=r.total;
  res.json(Object.values(map).sort((a,b)=>a.month.localeCompare(b.month)));
} catch(e){next(e);} });
router.get('/category', async (req,res,next)=>{ try { res.json(await Expense.aggregate([{ $match:{userId:req.user._id} },{ $group:{_id:'$category', total:{$sum:'$amount'}} },{$sort:{total:-1}}])); } catch(e){next(e);} });
module.exports = router;
