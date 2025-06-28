#!/bin/bash
set -e

echo
echo "-----------------------------------"
echo " Lexicon: Local Coding Assistant"
echo "-----------------------------------"
echo

# Load environment variables if they exist
if [ -f "./config/ollama.env" ]; then
    echo "[+] Loading environment variables from config/ollama.env"
    source ./config/ollama.env
else
    echo "[!] No config/ollama.env file found. Using defaults."
fi

# Set default model path if not set
if [ -z "$OLLAMA_MODELS" ]; then
    OLLAMA_MODELS="./models"
    echo "[+] Defaulting OLLAMA_MODELS to $OLLAMA_MODELS"
else
    echo "[+] Using OLLAMA_MODELS=$OLLAMA_MODELS"
fi

echo
# Check if Ollama server is already running
if lsof -i :11434 | grep LISTEN >/dev/null; then
    echo "[!] Ollama server is already running on port 11434."
    echo "    Please stop it before running this script to ensure correct USB model path."
    exit 1
else
    echo "[*] Starting Ollama server..."
    OLLAMA_MODELS="$OLLAMA_MODELS" ollama serve &
    OLLAMA_PID=$!
    sleep 2
    echo "[✓] Ollama server started (PID $OLLAMA_PID)"
fi

# Start the static web UI
echo "[*] Serving Lexicon web UI at http://localhost:8000"
cd web-ui
python3 -m http.server 8000

