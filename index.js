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

app.post('/add', async (req, res) => {
  try {
    const { url, email } = req.body; // Extract URL and Email from request body

    if (!url || !email) {
      return res.status(400).json({ error: 'URL and Email are required' });
    }

    const userDocRef = db.collection('url').doc(email); // Set document ID as email
    const userDoc = await userDocRef.get(); // Fetch the document

    if (userDoc.exists) {
      // Document exists, update the URL list
      const existingData = userDoc.data();
      const updatedUrls = existingData.urls || []; // Get existing URLs or an empty array
      updatedUrls.push(url); // Add the new URL to the list

      await userDocRef.update({ urls: updatedUrls, updatedAt: new Date() }); // Update document
    } else {
      // Document doesn't exist, create a new one
      await userDocRef.set({
        urls: [url], // Initialize URL list with the first URL
        createdAt: new Date(),
      });
    }

    res.json({ message: 'URL added successfully' });
  } catch (error) {
    console.error('Error adding URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
