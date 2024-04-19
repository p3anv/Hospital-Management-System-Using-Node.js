const express = require("express");
const router = express.Router();
const path = require('path');
const User = require('./models/user');
const passport = require('passport');
const Appointment = require('./models/appointment');
const shortid = require('shortid');
const Report = require('./models/report');
const ObjectId = require('mongoose').Types.ObjectId;
const Doctor = require('./models/doctor');
const Admin = require('./models/admin')

// console.log(require('fs').readdirSync(path.join(__dirname, '../middleware')));
const isAuthenticated = require('./middleware/isAuthenticated'); // Adjust the path accordingly



router.get('/', (req, res) => {
  res.render('adminLogin');
});

router.get('/addPatient', (req, res) => {
  res.render('addPatient');
});


router.get('/addDoctor', (req, res) => {
  res.render('addDoctor');
});
router.get('/error', (req, res) => {
  res.render('error');
});

router.get('/removePatient', (req, res) => {
  res.render('removePatient');
});

router.get('/signup-success', (req, res) => {
  res.render('signup-success');
});

router.get('/adminSignup', (req, res) => {
  res.render('/adminSignup');
});

router.post('/pateintSignup', (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    phone:req.body.phone,
    fullName: req.body.fullName,
    dob: req.body.dob,
    gender: req.body.gender,
    userType: 'patient',
    patientId: shortid.generate(),
  });
  newUser.save()
    .then(() => {
      console.log(typeof(newUser))
      console.log(req.body);
      res.send("Patient Added Successfully")
      

    })
    .catch((err) => {
      console.error(err);
      if (err.code === 11000) {
        // Duplicate key error (unique constraint violation)
        return res.status(400).send("Username or email already exists.");
      }
      res.status(500).send("Error saving user to the database");
   });
});

router.post('/doctorSignup', async (req, res) => {
  try {
    const newDoctor = new Doctor({
      department: req.body.department,
      fullName: req.body.fullName,
      username: req.body.username,
      password: req.body.password,
      gender: req.body.gender,
      phone: req.body.phone,
      email: req.body.email,
    });

    await newDoctor.save();
    console.log(req.body);
    res.send("Doctor registered successfully!");
  } catch (err) {
    console.error(err);

    if (err.code === 11000) {
      return res.status(400).send("Username or email already exists.");
    }

    res.status(500).send("Error saving doctor to the database");
  }
});

router.post('/signup', (req, res) => {
  const newUser = new Admin({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    fullName: req.body.fullName,
  });



  newUser.save()
    .then(() => {
      console.log(typeof(newUser))
      console.log(req.body);
      res.send("admin sginup succesfull")
      

    })
    .catch((err) => {
      console.error(err);
      if (err.code === 11000) {
        // Duplicate key error (unique constraint violation)
        return res.status(400).send("Username or email already exists.");
      }
      res.status(500).send("Error saving user to the database");
   });
});





// router.get('/removePatient', async (req, res) => {
//   try {
//     // Fetch all users (patients) from the database
//     console.log("removePatient Got Triggered")
//     const patients = await User.find({});

//     // Render the remove patient page with the list of patients
//     res.render('removePatient', { patient: patients});
//   } catch (error) {
//     console.error('Error fetching patients for removal:', error);
//     res.status(500).render('error');
//   }
// });

// POST route to handle removal of a patient
// router.post('/removePatient', async (req, res) => {
//   try {
//     const { patientId } = req.body;

//     // Find the patient by their ID and remove them from the database
//     await User.findOneAndRemove({ patientId });

//     // Redirect to the admin dashboard with a success message
//     res.redirect('/adminDashboard?success=Patient removed successfully');
//   } catch (error) {
//     console.error('Error removing patient:', error);
//     res.redirect('/adminDashboard?error=Error removing patient');
//   }
// });


router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      console.error("only this changed")

      return res.redirect('/');
    }
    res.clearCookie('token');
    res.redirect('/');
  });
});

module.exports = router;
