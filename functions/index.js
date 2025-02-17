const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")("sk_test_51QtaNxRsjT749tBHMkVwN7L7F88Ing7EksbyrlW4nBm8otmb7OES1pcPOyw6jVM3OIXyjkO09JOn1kpq7eINRwHU00iGHz1wYR");

admin.initializeApp();
const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));

exports.api = functions.https.onRequest(app);
