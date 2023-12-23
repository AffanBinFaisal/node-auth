const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const User = require("./models/User");

const app = express();
const port = 3000;

// Middleware to parse JSON in requests
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// connecting with mongo db - syed
// const DB_URL="mongodb+srv://syed_abdulrab:syedabdulrab@cluster0.nt7qb.mongodb.net/auth-service-cloud?retryWrites=true&w=majority"
// dbConnect(DB_URL);

// Secret key for JWT
const secretKey = 'your-secret-key';

// Signup endpoint
app.post('/signup', async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;

  try {
    const newUser = new User({ username, password });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user exists in MongoDB
    const user = await User.findOne({ username });

    if (user && (user.password == password)) {
      // Generate a JWT token
      const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const validateTokenMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.userId = decoded.userId;
    next();
  });
};

app.post('/logout', validateTokenMiddleware, (req, res) => {
  const token = req.headers.authorization;

  // Add the token to the blacklist
  blacklistedTokens.add(token);

  res.json({ message: 'Logout successful' });
});

// Middleware to check if the token is blacklisted
const isTokenBlacklisted = (req, res, next) => {
  const token = req.headers.authorization;

  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ message: 'Token has been blacklisted' });
  }

  next();
};

app.get('/validate_token', validateTokenMiddleware, isTokenBlacklisted, (req, res) => {
  // If the middleware succeeds, the token is valid & IS NOT BLACKLISTED, and req.userId is available
  res.json({ message: 'Token is valid', userId: req.userId });
});



app.post('/updateQuotas/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { amount, type } = req.body;

    // Fetch the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the update will exceed quotas
    if ((user.bandwidthQuota + amount) > 25 || (user.storageQuota + amount) > 10) {
      return res.status(400).json({ message: 'Storage quota exceeded' });
    }

    // Update quotas based on the type (upload or delete)
    if (type === 'upload') {
      user.bandwidthQuota += amount;
      user.storageQuota += amount;
    } else if (type === 'delete') {
      user.bandwidthQuota -= amount;
      user.storageQuota += amount;
    } else {
      return res.status(400).json({ message: 'Invalid operation type' });
    }

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'User quotas updated successfully' });
  } catch (error) {
    console.error('Error updating user quotas:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;





app.listen(port, () => {
  console.log(`AUTH SERVC Server is running on http://localhost:${port}`);
});