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

    await db.collection('url').add({
      url,
      email,
      createdAt: new Date(), // Optional: Add a timestamp for tracking
    });

    res.json({ message: 'URL added successfully' });
  } catch (error) {
    console.error('Error adding URL:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
