#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = 3000;

// Enable CORS for browser requests
app.use(cors());

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const upload = multer({ storage });

// Load songs database
let songsDatabase = {};
try {
  songsDatabase = JSON.parse(fs.readFileSync('songs.json', 'utf-8'));
  console.log(`Loaded ${Object.keys(songsDatabase).length} songs from songs.json`);
} catch (err) {
  console.error('Error loading songs.json:', err);
}

// Calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  const minLength = Math.min(vecA.length, vecB.length);
  vecA = vecA.slice(0, minLength);
  vecB = vecB.slice(0, minLength);

  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < minLength; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// Identify song function (used by both MCP and web)
function identifySong(filePath) {
  try {
    const pythonOutput = execSync(`python fingerprint.py "${filePath}"`, { encoding: 'utf-8' });
    const queryFeatures = JSON.parse(pythonOutput.trim());

    let bestMatch = null;
    let bestSim = 0;

    console.log('--- New Identification Request ---');
    for (const song in songsDatabase) {
      const similarity = cosineSimilarity(queryFeatures, songsDatabase[song]);
      console.log(`Similarity with "${song}": ${similarity.toFixed(4)}`);
      if (similarity > bestSim) {
        bestSim = similarity;
        bestMatch = song;
      }
    }

    console.log(`Best match: ${bestMatch}, Similarity: ${bestSim.toFixed(4)}`);
    const THRESHOLD = 0.7;
    return bestSim > THRESHOLD ? bestMatch : null;

  } catch (err) {
    console.error('Error identifying song:', err.message);
    return null;
  }
}

//
// --- 1️⃣ MCP JSON-RPC Server (stdin/stdout) ---
//
process.stdin.on('data', (data) => {
  try {
    const input = JSON.parse(data.toString().trim());

    if (input.method === 'identifySong' && input.params?.filePath) {
      const result = identifySong(input.params.filePath);
      const response = {
        jsonrpc: '2.0',
        id: input.id,
        result: { song: result }
      };
      console.log(JSON.stringify(response));
    } else {
      const error = {
        jsonrpc: '2.0',
        id: input.id || null,
        error: { code: -32601, message: 'Method not found' }
      };
      console.log(JSON.stringify(error));
    }
  } catch (err) {
    console.error('Failed to process input:', err);
  }
});

//
// --- 2️⃣ Web Server for Frontend Recording ---
//
app.post('/identify', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

  const filePath = req.file.path;
  const result = identifySong(filePath);

  // Cleanup
  fs.unlinkSync(filePath);

  if (result) {
    res.json({ song: result });
  } else {
    res.json({ song: null });
  }
});

app.listen(port, () => {
  console.log(`Web server running at http://localhost:${port}`);
});
