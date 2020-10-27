const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')


/**
 * @route  GET api/profile/me
 * @desc   Get profile of the current user
 * @access Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])

    if(!profile) return res.status(400).json({ msg: 'There is no profile for this user' })

    res.json(profile)

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

/**
 * @route  POST api/profile/
 * @desc   Create or update a user profile
 * @access Private
 */
router.post('/', 
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ]
  ],
async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

  const { company, website, location, bio, status, githubusername, skills, youtube, facebook, twitter, linkedin, instagram } = req.body

  // Profile object

  const profileFields = {}
  profileFields.user = req.user.id
  if(company) profileFields.company = company
  if(website) profileFields.website = website
  if(location) profileFields.location = location
  if(bio) profileFields.bio = bio
  if(status) profileFields.status = status
  if(githubusername) profileFields.githubusername = githubusername
  // Entering a space before or after a skill won't matter to us
  if(skills) profileFields.skills = skills.split(',').map(skill => skill.trim())
  // Build social object
  profileFields.social = {}
  if(youtube) profileFields.social.youtube = youtube
  if(twitter) profileFields.social.twitter = twitter
  if(facebook) profileFields.social.facebook = facebook
  if(linkedin) profileFields.social.linkedin = linkedin
  if(instagram) profileFields.social.instagram = instagram

  try {
    let profile = await Profile.findOne({ user: req.user.id })
    // If there is a profile, update it
    if(profile) {
      profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })
      return res.json(profile)
    }
    // Create it
    profile = new Profile(profileFields)
    await profile.save()
    res.json(profile)

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }

})

/**
 * @route  GET api/profile/
 * @desc   Get all profiles
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar'])
    res.json(profiles)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

/**
 * @route  GET api/profile/user/:user_id
 * @desc   Get profile by user id
 * @access Public
 */
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'])

    if(!profile) return res.status(400).json({ msg: 'Profile not found' })

    res.json(profile)
  } catch (error) {
    console.error(error.message)
    if(error.kind == 'ObjectId') return res.status(400).json({ msg: 'Profile not found' })
    res.status(500).send('Server error')
  }
})

/**
 * @route  DELETE api/profile
 * @desc   Delete profile, posts, & user
 * @access Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    // Remove profile
    const deletedProfile = await Profile.findOneAndRemove({ user: req.user.id })
    // Remove user
    const deletedUser = await User.findOneAndRemove({ _id: req.user.id })
    // Remove posts

    if(deletedProfile || deletedUser) return res.json({ msg: 'User removed' })
    else return res.json({ msg: 'No user to be removed' })
  
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

/**
 * @route  PUT api/profile/experience
 * @desc   Add profile experience
 * @access Private
 */
router.put('/experience', 
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ]
  ],
async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  
  const { title, company, location, from, to, current, description } = req.body

  const newExperience = {title, company, location, from, to, current, description}

  try {
    const profile = await Profile.findOne({ user: req.user.id })
    profile.experience.unshift(newExperience)
    await profile.save()
    res.json(profile)

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }

})

/**
 * @route  DELETE api/profile/experience/:exp_id
 * @desc   Delete profile experience
 * @access Private
 */

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
    // Get remove index
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)

    // Experience is not found
    if(removeIndex == -1) return res.json({ msg: 'No experience found' }) 

    profile.experience.splice(removeIndex, 1)
    await profile.save()
    res.json(profile)

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }
})

/**
 * @route  PUT api/profile/education
 * @desc   Add profile education
 * @access Private
 */
router.put('/education', 
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ]
  ],
async (req, res) => {
  const errors = validationResult(req)
  if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  
  const { school, degree, fieldofstudy, from, to, current, description } = req.body

  const newEducation = {school, degree, fieldofstudy, from, to, current, description}

  try {
    const profile = await Profile.findOne({ user: req.user.id })
    profile.education.unshift(newEducation)
    await profile.save()
    res.json(profile)

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }

})

/**
 * @route  DELETE api/profile/education/:edu_id
 * @desc   Delete profile education
 * @access Private
 */

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
    // Get remove index
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)

    // Education is not found
    if(removeIndex == -1) return res.json({ msg: 'No education found' }) 

    profile.education.splice(removeIndex, 1)
    await profile.save()
    res.json(profile)

  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router