const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const flash = require('express-flash');
const session = require('express-session');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const jwtSecretKey = 'abc123';
const isAuthenticated = require('./middleware/isAuthenticated');
const ejs = require("ejs");
const path = require('path');
const bodyParser = require("body-parser");
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require("./models/user");
const Doctor = require("./models/doctor");
const Appointment = require("./models/appointment");

const route = require('./route'); // Import the route module

app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const uri = "mongodb+srv://pranavkamble164:aZUFdLiRKkcLhARK@cluster01.v0uqueg.mongodb.net/myDatabase?retryWrites=true&w=majority&appName=Cluster01";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Remove buffermaxentries option
});
passport.use(new LocalStrategy(
  function (username, password, done) {
    console.log('Attempting authentication for Admin :', username);
    Doctor.findOne({ username: username }).exec()
      .then(user => {
        console.log('User found:', user);
        if (!user) {
          console.log('User not found:', username);
          return done(null, false, { message: 'User not found' });
        }

        if (user.password !== password) {
          console.log('Authentication failed for user:', username);
          return done(null, false, { message: 'Invalid credentials' });
        }

        console.log('Authentication successful for user:', username);
        return done(null, user);
      })
      .catch(err => {
        console.error('Error during authentication:', err);
        return done(err);
      });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Doctor.findById(id).exec()
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err);
    });
});

app.use(session({
  secret: 'a5b2f7049e55cfe6bf7b6e46b49d94d67de9e65b7ee46fc1900e9bf9ea75c0a3',
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

app.use('/', route); // Use the router from route.js

app.get('/doctorLogin', (req, res) => {
  res.render('login', { message: req.flash('error')[0] });
});

app.post("/doctorLogin", passport.authenticate('local', {
  successRedirect: '/doctorDashboard',
  failureRedirect: '/error',
  failureFlash: true
}), (req, res) => {
  console.log('Flash Messages:', req.flash());
});

// Middleware for verifying a JWT token
app.use('/doctorDashboard', (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/patientLogin');
  }

  jwt.verify(token, jwtSecretKey, (err, decoded) => {
    if (err) {
      return res.redirect('/patientLogin');
    }
    req.userId = decoded.userId;
    next();
  });
}, isAuthenticated);


app.use(express.static(path.join(__dirname, 'public')));

const port = 4000;

app.listen(port, function () {
  console.log("Server is running on Port: " + port);
  console.log("Doctor Module started on Port "+ port);
});
