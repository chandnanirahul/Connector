const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');


// Load Post Model
const Post = require('../../models/Post');
// Load Profile model
const Profile = require('../../models/Profile');

// Validation
const validatePostInput = require('../../validation/post');

router.post('/', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }
    const newpost = new Post({
      user: req.user.id,
      text: req.body.text,
      name: req.body.name
    });
    newpost.save()
      .then(post => res.json(post));
  });

//Get all post

router.get('/', (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ nopost: 'No post found' }));
});

//Delete post by id

router.delete('/:id', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.find({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id).then(post => {
        if (post.user.toString() !== req.user.id) {
          return res.status(404).json({ msg: 'No user matched' });
        }
        post.remove().then(() => res.json({ success: true }));
      })
        .catch(err => res.status(404).json({ NOPOSTS: 'noposts found' }));
    });
  });

// Like route by post id

router.post('/like/:id', passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        Post.findById(req.params.id)
          .then(post => {
            if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
              return res.status(404).json({ msg: 'User already liked post' });
            }
            post.likes.unshift({ user: req.user.id })
            post.save()
              .then(post => res.json(post))
          })
          .catch(err => res.status(404).json({ msg: 'no user found' }));
      });
  });

//Unlike post 

router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if ( post.likes.filter(like => like.user.toString() === req.user.id).length === 0)               
           {
            return res
              .status(400)
              .json({ notliked: 'You have not yet liked this post' });
          }

          // Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          // Splice out of array
          post.likes.splice(removeIndex, 1);

          // Save
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }));
    });
  }
);

// Add comment by id

router.post('/comment/:id', passport.authenticate('jwt', { session: false }),
(req,res) => {
  const { errors, isValid } = validatePostInput(req.body);

    // Check Validation
    if (!isValid) {
      // If any errors, send 400 with errors object
      return res.status(400).json(errors);
    }
Post.findById(req.params.id)
.then(post => {
  const newCom = {
    text:req.body.text,
    name: req.body.name,
    user: req.user.id
  }
  post.comments.unshift(newCom)
  post.save().then( post => res.json(post));
})
.catch(err => res.status(404).json({postnotfound: 'no post found'}));
}
);

// delete comment by comment id

router.delete('/comment/:id/:comment_id',  passport.authenticate('jwt', { session: false }),
 (req,res) => {
   Post.findById(req.params.id)
   .then(post => {
     if( post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length === 0) {
       return res.status(404).json({msg : 'No comments exixts'});
     }
     // find index
      const removeIndex = post.comments
      .map(item =>  item._id.toString())
      .indexOf(req.params.comment_id);

      post.comments.splice(removeIndex ,1)
      post.save().then(post => res.json(post));
   })
   .catch(err => res.json({msg : 'No post found'}));
 }
 
);




      router.get('/test', (req, res) => {
        res.json({ msg: 'posts works' })
      });

      module.exports = router;