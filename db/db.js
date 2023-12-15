const mongoose = require("mongoose");

// Connection URI
const uri = 'mongodb://127.0.0.1:27017/auth-micro-service';

// Connect to MongoDB
mongoose.connect(uri);

// Check if the connection was successful
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

module.exports = mongoose;
