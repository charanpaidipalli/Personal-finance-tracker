const router = require('express').Router();
const Expense = require('../models/Expense');
router.get('/', async (req,res,next)=>{ try { res.json(await Expense.find({userId:req.user._id}).sort({date:-1})); } catch(e){next(e);} });
router.post('/', async (req,res,next)=>{ try { res.status(201).json(await Expense.create({...req.body,userId:req.user._id})); } catch(e){next(e);} });
router.delete('/:id', async (req,res,next)=>{ try { const result=await Expense.findOneAndDelete({_id:req.params.id,userId:req.user._id}); if(!result)return res.status(404).json({message:'Expense entry not found.'}); res.json({message:'Expense deleted'}); } catch(e){next(e);} });
module.exports = router;
