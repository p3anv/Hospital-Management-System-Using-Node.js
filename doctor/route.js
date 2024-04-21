  const express = require("express");
  const router = express.Router();
  const path = require('path');
  const User = require('./models/user');
  const Doctor = require('./models/doctor');
  const Appointment = require('./models/appointment');
  const verifyToken = require('./verifyToken');
  const passport = require('passport');
  const LocalStrategy = require('passport-local').Strategy;
  const Report = require('./models/report');
  const { getPatients } = require('./getPatient')
  const mongoose = require('mongoose');
  const ObjectId = mongoose.Types.ObjectId;


  const isAuthenticated = require('./middleware/isAuthenticated'); // Adjust the path accordingly

  router.get('/', (req, res) => {
    res.render('doctorLogin');
  });
  router.get('/index', (req, res) => {
    res.render('index');
  });
  router.get('/error', (req, res) => {
    res.render('error');
  });

  router.get('/doctorLogin', (req, res) => {
    res.render('doctorLogin');
  });

  router.get('/doctorRegister', (req, res) => {
    res.render('doctorRegister');
  });

  router.get('/patientReports', (req, res) => {
    res.render('patientReports');
  });
  
  router.get('/reportSuccessfull', (req, res) => {
    res.render('reportSuccessfull');
  });


  router.get('/', (req, res) => {
    res.render('doctorRegister');
  });

  router.post('/doctorRegister', async (req, res) => {
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

  router.get('/doctorDashboard', isAuthenticated, async (req, res) => {
    try {
      const doctorUsername = req.user.username;
      const doctor = await Doctor.findOne({ username: doctorUsername }).exec();
      const users = await User.find({ userType: 'patient' }).select('fullName patientId');
  
      if (!doctor) {
        return res.status(404).send('Doctor not found');
      }
  
      const appointments = await Appointment.find({ doctor: doctorUsername }).exec();
      
      // Populate patientId in appointments
      for (let i = 0; i < appointments.length; i++) {
        const appointment = appointments[i];
        const user = await User.findById(appointment.patient).select('patientId');
  
        // Check if user exists before accessing properties
        if (user) {
          appointment.patientId = user.patientId;
        } else {
          appointment.patientId = 'N/A'; // Or any default value you prefer
        }
      }
  
      res.render('doctorDashboard', { user: doctor, appointments, users });
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      res.status(500).render('error');
    }
  });
  
  

  router.post('/appointments/:id/report', isAuthenticated, async (req, res) => {
    try {
        // Extract appointment ID from request parameters
        const appointmentId = req.params.id;

        // Find the appointment in the database
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).send('Appointment not found');
        }

        // Create a new report using the Report model
        const report = new Report({
            userId: req.user._id, // Assuming the user is authenticated and req.user contains the user object
            appointmentId: appointment._id,
            diagnosis: req.body.diagnosis,
            treatment: req.body.treatment,
            prescriptions: req.body.prescriptions,
            notes: req.body.notes
        });

        // Save the new report to the database
        await report.save();

        // Update the appointment to include the new report
        appointment.reports.push(report._id);
        await appointment.save();

        // Respond with a success message
        res.redirect('/reportSuccessfull')

    } catch (err) {
        console.error('Error saving report:', err);
        res.status(500).send('Error saving report');
    }
  });
  // Import necessary modules and models

  // ... (other imports)

  // Route to handle updating appointment status
  router.post('/updateAppointmentStatus', isAuthenticated, async (req, res) => {
    try {
      const appointmentId = req.body.appointmentId;
      const newStatus = req.body.newStatus;

      // Ensure the appointmentId and newStatus are provided
      if (!appointmentId || !newStatus) {
        return res.status(400).send('Invalid request');
      }

      // Find the appointment by ID
      const appointment = await Appointment.findById(appointmentId).exec();

      // Check if the appointment exists
      if (!appointment) {
        return res.status(404).send('Appointment not found');
      }

      // Update the appointment status
      appointment.status = newStatus;

      // Save the updated appointment
      await appointment.save();

      // Redirect back to the doctor dashboard
      res.redirect('/doctorDashboard');
    } catch (err) {
      console.error('Error updating appointment status:', err);
      res.status(500).render('error');
    }
  });



  // Route to display patient reports
  router.get('/patient/:patientId/reports', async (req, res) => {
    try {
        const patientId = req.params.patientId;

        // Convert patientId to ObjectId
        const userId = mongoose.Types.ObjectId(patientId);

        // Fetch the patient's information
        const patient = await User.findById(userId).select('fullName');

        // Fetch all reports associated with the patient
        const reports = await Report.find({ userId: userId }).sort({ dateTime: -1 });

        // Render the patientReport.ejs template with patient and reports data
        res.render('patientReports', { patient, reports });
    } catch (error) {
        console.error('Error fetching patient reports:', error);
        res.status(500).render('error');
    }
  });


  router.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Error during logout:', err);
        return res.redirect('/');
      }
      res.clearCookie('token');
      res.redirect('/');
    });
  });

  module.exports = router;
