const router = require('express').Router();
const Budget = require('../models/Budget');
router.get('/', async (req,res,next)=>{ try { res.json(await Budget.find({userId:req.user._id}).sort({createdAt:-1})); } catch(e){next(e);} });
router.post('/', async (req,res,next)=>{ try { res.status(201).json(await Budget.create({...req.body,userId:req.user._id})); } catch(e){next(e);} });
router.delete('/:id', async (req,res,next)=>{ try { const result=await Budget.findOneAndDelete({_id:req.params.id,userId:req.user._id}); if(!result)return res.status(404).json({message:'Budget not found.'}); res.json({message:'Budget deleted'}); } catch(e){next(e);} });
module.exports = router;
