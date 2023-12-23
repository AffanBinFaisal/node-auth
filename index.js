const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Import the cors package

const User = require("./models/User");
const { default: dbConnect } = require('./db/db');

const app = express();
const port = 4000;

// Middleware to parse JSON in requests
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// connecting with mongo db - syed
// const DB_URL="mongodb+srv://syed_abdulrab:syedabdulrab@cluster0.nt7qb.mongodb.net/auth-service-cloud?retryWrites=true&w=majority"
// dbConnect(DB_URL);

// Secret key for JWT
const secretKey = 'your-secret-key';
const blacklistedTokens = new Set();

// ======================= MIDDLEWARES ===============================
const validateTokenMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.userId = decoded.userId;
    next();
  });
};

// Middleware to check if the token is blacklisted
const isTokenBlacklisted = (req, res, next) => {
  const token = req.headers.authorization;

  if (blacklistedTokens.has(token)) {
    return res.status(401).json({ message: 'Token has been blacklisted' });
  }

  next();
};

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

app.post('/logout', validateTokenMiddleware, (req, res) => {
  const token = req.headers.authorization;
  
  // Add the token to the blacklist
  blacklistedTokens.add(token);
  
  res.json({ message: 'Logout successful' });
});

app.get(
  "/validate_token",
  validateTokenMiddleware,
  isTokenBlacklisted,
  (req, res) => {
    // If the middleware succeeds, the token is valid & IS NOT BLACKLISTED, and req.userId is available
    res.json({ message: "Token is valid", userId: req.userId });
  }
);


// ===================================== RUN THE SERVER ===================================
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});