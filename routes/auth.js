const express = require("express");
const router = new express.Router();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config")

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
 
 router.post('/login', async (req, res, next) => {
    try {
        const {username, password} = req.body;
        const result = await User.authenticate(username, password)
        
        if(result){
            await User.updateLoginTimestamp(username)
            const token = jwt.sign({username}, SECRET_KEY)
            return res.json({msg: 'Loged id', token})
        }
    }catch(err) {
        return next(err);
    }
 })


/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

 router.post('/register', async (req, res, next) => {
    
    try {
        const result = await User.register(req.body)
        return res.json(result)
    }catch (err) {
        return next(err);
    }
 })

module.exports = router;