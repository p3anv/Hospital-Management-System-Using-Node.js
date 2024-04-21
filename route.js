const express = require("express");
const router = express.Router();
const path = require('path');
const User = require('./models/user');
const passport = require('passport');
const Appointment = require('./models/appointment');
const shortid = require('shortid');
const Report = require('./models/report');
const ObjectId = require('mongoose').Types.ObjectId;
const pdf = require('html-pdf');
const PDFDocument = require('pdfkit');
const fs = require('fs');


// console.log(require('fs').readdirSync(path.join(__dirname, '../middleware')));
const isAuthenticated = require('./middleware/isAuthenticated'); // Adjust the path accordingly



router.get('/', (req, res) => {
  res.render('index');
});

router.get('/patientLogin', (req, res) => {
  res.render('patientLogin');
});


router.get('/bookAppSuccessfull', (req, res) => {
  res.render('bookAppSuccessfull');
});
router.get('/contact', (req, res) => {
  res.render('contact');
});



router.get('/signup', (req, res) => {
  res.render('signup');
});
router.get('/error', (req, res) => {
  res.render('error');
});

router.get('/signup-success', (req, res) => {
  res.render('signup-success');
});

router.get('/getAppointments', async (req, res) => {
  try {
      const appointments = await Appointment.find({}); // Fetch appointments
      res.json(appointments);
  } catch (err) {
      console.error('Error fetching appointments:', err);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/signup', (req, res) => {
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
      res.redirect('/signup-success')
      

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



// Fetch reports for a specific appointment
router.get('/patient/appointments', isAuthenticated, async (req, res) => {
  try {
    // Get the patient's ID
    const userId = req.user._id;

    // Find appointments for the specific patient and populate the reports field
    const appointments = await Appointment.find({ userId: ObjectId(userId) }).populate('reports');
    // const reports = await Report.find({ userId: ObjectId(userId) });
    console.log("Reports /patient/appointments:",reports)

    // Render the appointments page with the appointments data
    res.render('appointments', { appointments });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).render('error');
  }
});

router.post('/bookAppointment', isAuthenticated, async (req, res) => {
  try {
    const { patientName, doctor, date, time, reason, patientId } = req.body;

    // Combine date and time to create a DateTime object

    // Assuming you have patientId generated during signup or elsewhere
    // const { patientId } = req.user;

    const newAppointment = new Appointment({
      patientName,
      doctor,
      date,
      time,
      reason,
      userId: req.user._id,
      patientId, // Include patientId here
    });

    await newAppointment.save();
    // console.log("Reports :",reports)
    res.redirect('/bookAppSuccessfull');
  } catch (error) {
    console.error('Error during appointment booking:', error);
    res.redirect('/patientDashboard?error=Error booking appointment');
  }
});

router.get('/appointmentHistory', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    console.log('User Object for Appointment History:', user);

    const appointments = await Appointment.find({ userId: req.user._id });
    console.log('Appointments for Appointment History:', appointments);

    // const reports = await Reports.find({ userId: req.user._id });
    // console.log('Appointments for Appointment History:', appointments);
    console.log("Reports appointmentHistory:",reports)

    res.render('appointmentHistory', { user, appointments});
  } catch (error) {
    console.error('Error fetching appointment history:', error);
    res.redirect('/patientDashboard?error=Error fetching appointment history');
  }
});

// Define the getPatientAppointments function to fetch appointments for the specified user
async function getPatientAppointments(userId) {
  try {
      // Query the database to find appointments associated with the user's ID
      const appointments = await Appointment.find({ userId: userId });

      return appointments; // Return the fetched appointments
  } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error; // Throw an error if fetching appointments fails
  }
}


router.get('/patientDashboard', isAuthenticated, async (req, res) => {
  try {
    const { success, error } = req.query;
    const user = await User.findById(req.user._id).select('username patientId email fullName phone dob gender');
    const appointments = await getPatientAppointments(req.user._id);
    
    // Fetch reports for each appointment fetched for the patient
    const reportPromises = appointments.map(async (appointment) => {
      return await Report.find({ appointmentId: appointment._id });
    });

    // Resolve all report promises
    const reports = await Promise.all(reportPromises);

    console.log("Reports patientDashboard:", reports);
    res.render('patientDashboard', { user, appointments, success, error, reports }); // Pass 'reports' variable to the template
  } catch (error) {
    console.error('Error fetching user for patientDashboard:', error);
    res.redirect('/patientLogin?error=Error fetching user');
  }
});






router.get('/reports', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user's ID is used to fetch reports
    const reports = await Report.find({ patientId: userId }); // Fetch reports for the current user
    console.log("Reports reports:", reports);
    res.render('reports', { reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.redirect('/patientDashboard?error=Error fetching reports');
  }
});


// Function to generate PDF
router.get('/getReportPDF/:reportId', async (req, res) => {
  const reportId = req.params.reportId;

  try {
      // Find the report in the database based on its ID
      const report = await Report.findOne({ _id: reportId });

      if (!report) {
          return res.status(404).send('Report not found');
      }

      // Create a new PDF document
      const doc = new PDFDocument();

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');

      // Pipe the PDF document to the response stream
      doc.pipe(res);

      // Add report details to the PDF
      doc.fontSize(25).text('UnityMed Hospital', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text('Diagnosis: ' + report.diagnosis);
      doc.fontSize(14).text('Treatment: ' + report.treatment);
      doc.fontSize(14).text('Prescriptions: ' + report.prescriptions);
      doc.fontSize(14).text('Notes: ' + report.notes);

      // Finalize the PDF
      doc.end();

  } catch (err) {
      console.error('Error generating PDF:', err);
      res.status(500).send('Error generating PDF');
  }
});



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
