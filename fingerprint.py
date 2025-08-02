#!/usr/bin/env python3
import sys
import json
import librosa
import numpy as np
import warnings
from sklearn.preprocessing import StandardScaler

# Suppress librosa warnings
warnings.filterwarnings('ignore')


def extract_advanced_features(audio_path, n_mfcc=20, max_duration=30):
    """
    Extract a robust fingerprint for the song using multiple features:
    - MFCC
    - Delta MFCC
    - Chroma
    - Spectral Contrast
    - Tonnetz
    """

    try:
        # Load audio (mono) with limited duration
        y, sr = librosa.load(audio_path, sr=None, mono=True, duration=max_duration)
        if len(y) == 0:
            raise ValueError("Empty audio file")

        # Remove leading/trailing silence
        y, _ = librosa.effects.trim(y)

        # Compute MFCCs
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        delta_mfcc = librosa.feature.delta(mfcc)

        # Compute Chroma features
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)

        # Compute Spectral Contrast
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr)

        # Compute Tonnetz features (requires chroma_cqt)
        tonnetz = librosa.feature.tonnetz(y=librosa.effects.harmonic(y), sr=sr)

        # Combine all features
        features = np.vstack([
            mfcc,
            delta_mfcc,
            chroma,
            contrast,
            tonnetz
        ])

        # Compute mean & std across time to get a compact fingerprint
        feature_mean = np.mean(features, axis=1)
        feature_std = np.std(features, axis=1)
        combined_features = np.concatenate([feature_mean, feature_std])

        # Normalize features for better similarity comparison
        scaler = StandardScaler()
        normalized_features = scaler.fit_transform(combined_features.reshape(-1, 1)).flatten()

        return normalized_features.tolist()

    except Exception as e:
        print(f"Error processing audio file: {str(e)}", file=sys.stderr)
        return None


def main():
    if len(sys.argv) != 2:
        print("Usage: python fingerprint.py <audio_file_path>", file=sys.stderr)
        sys.exit(1)

    audio_path = sys.argv[1]
    features = extract_advanced_features(audio_path)

    if features is None:
        print(json.dumps([]))
        sys.exit(1)

    print(json.dumps(features))
    sys.exit(0)


if __name__ == "__main__":
    main()
