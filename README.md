🎵 Song Recognition Project with MCP Server

A local music recognition system using Node.js, Python (Librosa), and MCP Server.
It records audio from the browser, extracts MFCC features, and matches them against a locally generated database — fully offline, no third-party APIs.

📌 Features

    🎤 Record live audio directly from the browser.
    
    🎵 Recognize songs using local MCP server without cloud APIs.
    
    🐍 Python + Librosa for audio fingerprinting.
    
    ⚡ Node.js + Express backend using MCP Server for local model execution.
    
    🖥️ Offline functionality — no internet required after setup.

Song-Recognition-Project/

    ├── index.html           #Frontend UI for recording & showing results
    
    ├── index.js             # Node.js backend server with MCP server integration
    
    ├── fingerprint.py       # Python script to extract MFCC features
    
    ├── generate_db.py       # Script to generate songs.json database
    
    ├── songs/                # Folder with your reference songs
    
    ├── uploads/              # Temporary folder for recorded audio
    
    └── songs.json           # Auto-generated song fingerprints
 Access the App
 1. Open index.html in your browser.
 2. Click Record → play or sing a song snippet → get the recognized song name.

How It Works

    1.Browser (Frontend)
        - Captures audio using MediaRecorder API.
    
    2.MCP Server + Node.js (Backend)
        - Receives audio → saves temporarily → calls fingerprint.py.
    
    3.Python + Librosa
        -Extracts MFCC features from the audio.
    
    4.Node.js with MCP Server
        -Compares features with songs.json using Cosine Similarity.
    
    5.Result
        -Best match displayed in the UI.

Notes

1.🎵 Fully offline — no cloud API calls.

2.🎯 Accuracy depends on:

        - Clear recordings
        -Song diversity in the database
        -Recording length (10-30s works best)
