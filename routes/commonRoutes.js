const express = require('express');
var router = express.Router()
const token2id = require("../helpers/token2id")
var residents = require("../models/resident")
var authorities = require("../models/authority")
var issues = require("../models/issue")

router.get("/viewIssue/:issueId",userValidate,(req,res)=>{
  issues.findById(req.params.issueId).populate({path:"addedBy",select:"name"}).populate("residentComments.user","name").populate("authorityComments.user","name").exec((err,issue)=>{
    if(err){
      res.status(500).send(err)
    }
    else{
      res.send(issue)
    }
  })
})

router.post("/commentIssue/:issueId",userValidate,(req,res)=>{
  var newComment = {
    user:req.body.userId,
    text:req.body.text
  }
  issues.findByIdAndUpdate(req.params.issueId,{
    $push:req.body.isResident?{residentComments:newComment}:{authorityComments:newComment}
  },{new:true}).then((issue)=>{
    res.send(issue)
  }).catch((err)=>{
    res.status(500).send(err)
  })
})

router.post("/upvoteIssue/:issueId",userValidate,(req,res)=>{
  issues.findByIdAndUpdate(req.params.issueId,{
    $push:req.body.isResident?{upvotes: req.body.userId}
  },{new:true}).then((issue)=>{
    res.send(issue)
  }).catch((err)=>{
    res.status(500).send(err)
  })
})

function userValidate(req,res,next){
  token2id(req.get("x-access-token")).then((id)=>{
    req.body.userId = id;
    residents.findById(id).then((resident)=>{
      if(resident) req.body.isResident = true;
      else req.body.isResident = false;
      next();
    }).catch((err)=>{
      res.status(500).send("DB Error")
    })

  }).catch((err)=>{
    res.status(403).send("Token Error")
  })

}

module.exports = router
