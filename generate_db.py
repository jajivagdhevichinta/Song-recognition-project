#!/usr/bin/env python3
import os
import json
import subprocess
import sys
from pathlib import Path

def get_audio_files(directory):
    """Get all audio files from the directory with supported extensions."""
    audio_extensions = {'.mp3', '.wav', '.flac', '.m4a', '.ogg', '.wma'}
    audio_files = []
    
    if not os.path.exists(directory):
        print(f"Error: Directory '{directory}' does not exist.", file=sys.stderr)
        return audio_files
    
    for file_path in Path(directory).iterdir():
        if file_path.is_file() and file_path.suffix.lower() in audio_extensions:
            audio_files.append(file_path)
    
    return audio_files

def extract_features_with_fingerprint_py(audio_path):
    """Use the fingerprint.py script to extract features from an audio file."""
    try:
        # Call the fingerprint.py script
        result = subprocess.run(
            ['python', 'fingerprint.py', str(audio_path)],
            capture_output=True,
            text=True,
            timeout=30  # 30 second timeout
        )
        
        # Check if the script executed successfully
        if result.returncode == 0:
            # Parse the JSON output
            features = json.loads(result.stdout)
            return features
        else:
            print(f"Error extracting features from {audio_path}: {result.stderr}", file=sys.stderr)
            return None
            
    except subprocess.TimeoutExpired:
        print(f"Timeout extracting features from {audio_path}", file=sys.stderr)
        return None
    except json.JSONDecodeError:
        print(f"Invalid JSON output from fingerprint.py for {audio_path}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error processing {audio_path}: {str(e)}", file=sys.stderr)
        return None

def clean_filename(filename):
    """Extract clean song title from filename (remove extension and normalize)."""
    name = Path(filename).stem
    # Replace underscores with spaces and strip extra whitespace
    name = name.replace('_', ' ').strip()
    return name

def main():
    songs_dir = 'songs'
    output_file = 'songs.json'
    
    print(f"Scanning audio files in '{songs_dir}' directory...")
    
    # Get all audio files
    audio_files = get_audio_files(songs_dir)
    
    if not audio_files:
        print(f"No audio files found in '{songs_dir}' directory.", file=sys.stderr)
        print("Please ensure the directory exists and contains audio files.", file=sys.stderr)
        sys.exit(1)
    
    print(f"Found {len(audio_files)} audio files. Extracting features...")
    
    # Dictionary to store song database
    songs_database = {}
    
    # Process each audio file
    for i, audio_file in enumerate(audio_files, 1):
        print(f"Processing ({i}/{len(audio_files)}): {audio_file.name}")
        
        # Extract features using fingerprint.py
        features = extract_features_with_fingerprint_py(audio_file)
        
        if features and len(features) > 0:
            # Use clean filename as the song title
            song_title = clean_filename(audio_file.name)
            songs_database[song_title] = features
            print(f"✓ Successfully processed: {song_title}")
        else:
            print(f"✗ Failed to process: {audio_file.name}")
    
    # Save database to JSON file
    if songs_database:
        try:
            with open(output_file, 'w') as f:
                json.dump(songs_database, f, indent=2)
            print(f"\nSuccess! Created '{output_file}' with {len(songs_database)} songs.")
        except Exception as e:
            print(f"Error saving database: {str(e)}", file=sys.stderr)
            sys.exit(1)
    else:
        print("No songs were successfully processed.", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()