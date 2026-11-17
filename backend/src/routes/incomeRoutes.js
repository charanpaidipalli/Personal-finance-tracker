const router = require('express').Router();
const Income = require('../models/Income');
router.get('/', async (req,res,next)=>{ try { res.json(await Income.find({userId:req.user._id}).sort({date:-1})); } catch(e){next(e);} });
router.post('/', async (req,res,next)=>{ try { res.status(201).json(await Income.create({...req.body,userId:req.user._id})); } catch(e){next(e);} });
router.delete('/:id', async (req,res,next)=>{ try { const result=await Income.findOneAndDelete({_id:req.params.id,userId:req.user._id}); if(!result)return res.status(404).json({message:'Income entry not found.'}); res.json({message:'Income deleted'}); } catch(e){next(e);} });
module.exports = router;
