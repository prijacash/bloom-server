const router = require('express').Router()
const db = require('../../models')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authLockedRoute = require('./authLockedRoute')


// GET /users - test endpoint
router.get('/', (req, res) => {
  res.json({ msg: 'welcome to the users endpoint' })
})

// GET /users/:userId - show specific user
router.get('/:userId', async (req, res) => {
  try {
    const user = await db.User.findById(req.params.userId)
    res.json(user)
  } catch(err) {
    console.log(err)
    res.status(500).json({ message: 'internal server error' })
  }
})

// POST /users/register - CREATE new user
router.post('/register', async (req, res) => {
  try {
    // check if user exists already
    const findUser = await db.User.findOne({
      email: req.body.email
    })

    // don't allow emails to register twice
    if(findUser) return res.status(400).json({ msg: 'email exists already' })
  
    // hash password
    const password = req.body.password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds)
  
    // create new user
    const newUser = new db.User({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
  
    await newUser.save()

    // create jwt payload
    const payload = {
      name: newUser.name,
      email: newUser.email, 
      id: newUser.id
    }

    // sign jwt and send back
    const token = await jwt.sign(payload, process.env.JWT_SECRET)

    res.json({ token })
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: 'server error'  })
  }
})

// PUT /users/:userId -- update a single user
router.put('/:userId', async (req, res) => {
  try {
    const options = { new: true }
    const updateUser = await db.User.findByIdAndUpdate(req.params.userId, req.body, options)
    res.json(updateUser)
  } catch(err) {
    console.log(err)
    res.status(500).json({ message: 'internal server error' })
  }
})


// POST /users/login -- validate login credentials
router.post('/login', async (req, res) => {
  try {
    // try to find user in the db
    const foundUser = await db.User.findOne({
      email: req.body.email
    })

    const noLoginMessage = 'Incorrect username or password'

    // if the user is not found in the db, return and sent a status of 400 with a message
    if(!foundUser) return res.status(400).json({ msg: noLoginMessage })
    
    // check the password from the req body against the password in the database
    const matchPasswords = await bcrypt.compare(req.body.password, foundUser.password)
    
    // if provided password does not match, return an send a status of 400 with a message
    if(!matchPasswords) return res.status(400).json({ msg: noLoginMessage })

    // create jwt payload
    const payload = {
      name: foundUser.name,
      email: foundUser.email, 
      id: foundUser.id
    }

    // sign jwt and send back
    const token = await jwt.sign(payload, process.env.JWT_SECRET)

    res.json({ token })
  } catch(error) {
    console.log(error)
    res.status(500).json({ msg: 'server error'  })
  }
})

// DELETE /users/:userId -- destroy a user
router.delete('/:userId', async (req, res) => {
  try {
    await db.User.findByIdAndDelete(req.params.userId)
    res.sendStatus(204)
  } catch(err) {
    console.log(err)
    res.status(500).json({ message: 'internal server error' })
  }
})

// GET /cart -- return array of all items in cart
// GET /users/:userId - show specific user then show their shoppingcart
router.get('/:userId/cart', async (req, res) => {
  try {
    const user = await db.User.findById(req.params.userId)
    res.json(user.shoppingCart)
  } catch(err) {
    console.log(err)
    res.status(500).json({ message: 'internal server error' })
  }
})

// GET /auth-locked - will redirect if bad jwt token is found
router.get('/auth-locked', authLockedRoute, (req, res) => {
  res.json( { msg: 'welcome to the private route!' })
})

module.exports = router