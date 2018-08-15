const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

const ValidateRegisterInput = require('../../validation/register');
const validateLoginInput = require('../../validation/login');

const User = require('../../models/User');


router.post('/register', (req, res) => {
const { errors , isValid} =  ValidateRegisterInput(req.body) 

  if(!isValid) {
    return res.status(404).json(errors);
  }

  User.findOne({ email: req.body.email })
    .then(user => {
      if (user)
        return res.status(404).json(errors);
      else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          });
        });
      }
    });
});

// Login form

router.post('/login', (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email})

    .then(user => {
      // check user
      if (!user)
        return res.status(404).json({ msg: 'user does not exixts' });
      // check password
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (isMatch) {
            const payload = { id: user.id, name: user.name };
            // Sign Token
            jwt.sign(
              payload,
              keys.secretOrKey,
              { expiresIn: 3600 },
              (err, token) => {
                res.json({
                  success: true,
                  token: 'Bearer ' + token
                });
              }
            );
          }
            else {
        
            return res.status(404).json({msg: 'password incorrect'});
          }
        });
    });
});

// @route   GET api/users/current
// @desc    Return current user
// @access  Private
router.get(
  '/current',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);



router.get('/test', (req, res) => {
  res.json({ msg: 'User works' })
});


module.exports = router;