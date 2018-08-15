const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');


const validateProfileInput = require('../../validation/profile');
const validateExperienceInput = require('../../validation/experience');
const validateEducationInput = require('../../validation/education');

//Load Profile model
const Profile = require('../../models/Profile');

router.get('/', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const errors = {};

    Profile.findOne({ user: req.user.id })
      .populate('user', ['name'])
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return res.status(404).json(errors);
        }
        else
          res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  });

router.post('/', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    const profileFields = {};

    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.githubusername) profileFields.githubusername = req.body.githubusername;
    if (req.body.status) profileFields.status = req.body.status;
    if (typeof req.body.skills !== 'undefined') {
      profileFields.skills = req.body.skills.split(',');
    }
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;

    Profile.findOne({ user: req.user.id })
      .then(profile => {
        if (profile) {
          Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
            .then(profile =>
              res.json(profile));
        }
        else {
          // create
          Profile.findOne({ handle: profileFields.handle })
            .then(profile => {
              if (profile) {
                errors.handle = 'Already exixts';
                res.status(404).json(errors);
              }
              new Profile(profileFields).save().then(profile => res.json(profile));
            });
        }
      });
  });

//Profile by handle
router.get('/handle/:handle', (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name'])
    .then(profile => {
      if (!profile) {
        errors.nohandle = 'No profile for user';
        return res.status(404).json(errors);
      }
      else
        res.json(profile);
    })
    .catch(err => res.status(404).json(errors));
});

//Profile by user id

router.get('/user/:user_id', (req, res) => {

  const errors = {};
  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'No profile for user';
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(errors));
});

//Get all profile routes
router.get('/all', (req, res) => {
  const errors = {};
  Profile.find()
    .populate('user', ['name'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There are no profiles';
        return res.status(404).json(errors);
      }
      else
        res.json(profile);
    })
    .catch(err => res.status(404).json(errors));
});

// Expereince route

router.post('/experience', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newexp = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };
        profile.experience.unshift(newexp);
        profile.save().then(profile => res.json(profile));
      });
  });

// Education

router.post('/education', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const newedu = {
          school: req.body.school,
          degree: req.body.degree,
          fieldofstudy: req.body.fieldofstudy,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };
        profile.education.unshift(newedu);
        profile.save().then(profile => res.json(profile));
      });
  });

// Experience

router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id)
        profile.experience.splice(removeIndex, 1)
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  });

//Education

router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id)
        profile.education.splice(removeIndex, 1)
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  });

  //Delete User and Route

router.delete('/', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() => {
        res.json({ success: true });
      });
    });

  });

router.get('/test', (req, res) => {
  res.json({ msg: 'Profile works' })
});


module.exports = router;