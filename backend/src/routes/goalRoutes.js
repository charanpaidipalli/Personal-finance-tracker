const router = require('express').Router();
const Goal = require('../models/Goal');
router.get('/', async (req,res,next)=>{ try { res.json(await Goal.find({userId:req.user._id}).sort({createdAt:-1})); } catch(e){next(e);} });
router.post('/', async (req,res,next)=>{ try { res.status(201).json(await Goal.create({...req.body,userId:req.user._id})); } catch(e){next(e);} });
router.patch('/:id', async (req,res,next)=>{ try {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const updates = {};
  for (const field of ['name','targetAmount','currentAmount','deadline']) {
    if (Object.hasOwn(body, field)) updates[field] = body[field];
  }
  const result=await Goal.findOneAndUpdate({_id:req.params.id,userId:req.user._id}, updates, {new:true, runValidators:true});
  if(!result)return res.status(404).json({message:'Goal not found.'});
  res.json(result);
} catch(e){next(e);} });
router.delete('/:id', async (req,res,next)=>{ try { const result=await Goal.findOneAndDelete({_id:req.params.id,userId:req.user._id}); if(!result)return res.status(404).json({message:'Goal not found.'}); res.json({message:'Goal deleted'}); } catch(e){next(e);} });
module.exports = router;
