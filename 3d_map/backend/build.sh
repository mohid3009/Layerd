#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing CPU-only PyTorch to save memory and disk space..."
# Install torch cpu specifically
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

echo "Installing remaining requirements..."
pip install -r requirements.txt
