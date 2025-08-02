const express = require('express');
const multer = require('multer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
const upload = multer({ storage });

// Load song database
let songsDatabase = {};
try {
  const data = fs.readFileSync('songs.json');
  songsDatabase = JSON.parse(data);
} catch (error) {
  console.error('Error loading songs.json:', error);
}

// Cosine similarity
function cosineSimilarity(a, b) {
  const minLen = Math.min(a.length, b.length);
  a = a.slice(0, minLen);
  b = b.slice(0, minLen);

  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < minLen; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// POST /identify
app.post('/identify', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio uploaded' });

  const filePath = req.file.path;
  console.log("\n--- New Identification Request ---");

  try {
    // Extract features using Python
    const output = execSync(`python fingerprint.py "${filePath}"`, { encoding: 'utf-8' });
    const queryFeatures = JSON.parse(output.trim());
    if (!queryFeatures.length) throw new Error('No features extracted');

    let bestMatch = null;
    let bestSim = 0;

    for (const songTitle in songsDatabase) {
      const sim = cosineSimilarity(queryFeatures, songsDatabase[songTitle]);
      console.log(`Similarity with "${songTitle}": ${sim.toFixed(4)}`);

      if (sim > bestSim) {
        bestSim = sim;
        bestMatch = songTitle;
      }
    }

    console.log(`Best match: ${bestMatch}, Similarity: ${bestSim.toFixed(4)}`);
    const THRESHOLD = 0.1;
    res.json({ song: bestSim > THRESHOLD ? bestMatch : null });

  } catch (error) {
    console.error("Error processing audio:", error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
