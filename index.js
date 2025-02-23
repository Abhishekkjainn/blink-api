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

app.post('/add', async (req, res) => {
  try {
    const { url, email } = req.body;

    if (!url || !email) {
      return res.status(400).json({
        success: false,
        message: 'Both URL and Email are required.',
      });
    }

    const shortCode = crypto.randomBytes(4).toString('hex'); // Generates a 6-character alphanumeric code
    const newEntry = { shortCode, url };
    console.log('Generated Short Code:', shortCode);

    // Reference for the user's document in "url" collection
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

    // Reference for the short code document in "fetchfrom" collection
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
