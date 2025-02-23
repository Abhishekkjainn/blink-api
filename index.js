const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const { db } = require('./firebase');
const port = 6969;

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.send('Started');
});

const crypto = require('crypto');

app.get('/c=:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;

    if (!shortcode) {
      return res.status(400).json({
        success: false,
        message: 'Shortcode is required.',
      });
    }

    const fetchFromRef = db.collection('fetchfrom').doc(shortcode);
    const fetchFromDoc = await fetchFromRef.get();

    if (!fetchFromDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Shortcode not found.',
      });
    }

    const { url } = fetchFromDoc.data();

    return res.status(200).json({
      success: true,
      message: 'URL retrieved successfully.',
      url,
    });
  } catch (error) {
    console.error('Error fetching URL:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error. Please try again later.',
    });
  }
});

app.get('/a=:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const userDocRef = db.collection('url').doc(email);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'No data found for the provided email.',
      });
    }

    const { urls } = userDoc.data();

    if (!urls || urls.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No URLs found for this email.',
        urls: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: 'URLs retrieved successfully.',
      urls,
    });
  } catch (error) {
    console.error('Error fetching URLs:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error. Please try again later.',
    });
  }
});

app.post('/add/addurl', async (req, res) => {
  try {
    const { url, email } = req.body;

    if (!url || !email) {
      return res.status(400).json({
        success: false,
        message: 'Both URL and Email are required.',
      });
    }

    const shortCode = crypto.randomBytes(4).toString('hex');
    const newEntry = { shortCode, url };
    console.log('Generated Short Code:', shortCode);
    const userDocRef = db.collection('url').doc(email);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const existingData = userDoc.data();
      const updatedUrls = existingData.urls || [];
      updatedUrls.push(newEntry);

      await userDocRef.update({ urls: updatedUrls, updatedAt: new Date() });
    } else {
      await userDocRef.set({ urls: [newEntry], createdAt: new Date() });
    }
    const fetchFromRef = db.collection('fetchfrom').doc(shortCode);
    await fetchFromRef.set({ url, email, createdAt: new Date() });

    return res.status(201).json({
      success: true,
      message: 'URL added successfully to both collections.',
      shortCode,
      fetchFrom: { url, email },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error. Please try again later.',
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
