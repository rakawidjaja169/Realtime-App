const router = require('express').Router()
const { ensureAuth, ensureGuest } = require('../middleware/googleAuth')

router.get('/api/auth/google', ensureGuest ,(req, res) => {
    res.render('login')
  })

router.get("/api/home",ensureAuth, async(req,res)=>{
    res.render('home',{userinfo:req.user})
})
module.exports=router;