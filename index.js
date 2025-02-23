const express = require('express');
const cors = require('cors');
const app = express();
const axios = require('axios');
const { db } = require('./firebase');
const port = 6969;

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  res.send(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Documentation</title>
      <style>
          body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f9;
              margin: 0;
              padding: 20px;
          }
          .container {
              max-width: 900px;
              margin: auto;
              background: white;
              padding: 20px;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          h1, h2, h3 {
              color: #333;
          }
          pre {
              background: #282c34;
              color: #61dafb;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
              white-space: pre-wrap;
              word-wrap: break-word;
          }
          .endpoint {
              margin-bottom: 30px;
              padding: 15px;
              background: #f8f9fa;
              border-left: 5px solid #007bff;
          }
          .code {
              background: #e8e8e8;
              padding: 10px;
              border-radius: 5px;
              font-family: 'Courier New', Courier, monospace;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>API Documentation</h1>
          <p>This API allows users to store and retrieve URLs with shortcodes.</p>
          
          <h2>Base URL</h2>
          <p><code>http://localhost:6969</code></p>
          
          <h2>Endpoints</h2>
          
          <div class="endpoint">
              <h3>1. Add URL</h3>
              <p><strong>POST /add/addurl</strong></p>
              <p><strong>Request Body:</strong></p>
              <pre>{ "url": "https://example.com", "email": "user@example.com" }</pre>
              <p><strong>Response:</strong></p>
              <pre>{ "success": true, "message": "URL added successfully to both collections.", "shortCode": "abc123" }</pre>
          </div>
  
          <div class="endpoint">
              <h3>2. Get URL from Shortcode</h3>
              <p><strong>GET /c=:shortcode</strong></p>
              <p><strong>Response:</strong></p>
              <pre>{ "success": true, "message": "URL retrieved successfully.", "url": "https://example.com" }</pre>
          </div>
          
          <div class="endpoint">
              <h3>3. Get All URLs for a User</h3>
              <p><strong>GET /a=:email</strong></p>
              <p><strong>Response:</strong></p>
              <pre>{ "success": true, "message": "URLs retrieved successfully.", "urls": [{ "shortCode": "abc123", "url": "https://example.com" }] }</pre>
          </div>
      </div>
  </body>
  </html>
  
  `);
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
