# Lexicon Setup Guide

Lexicon is a portable, offline coding assistant that runs from a USB stick using local LLMs. This guide walks you through setup on a freshly unboxed USB key.

## System Requirements

Lexicon is designed to run from a USB drive on modern MacBooks with Apple Silicon and Metal acceleration.

### Computer

- macOS 13+ (Ventura or later)
- Apple Silicon
- 16GB RAM minimum
- Metal support (required for GPU acceleration)

To check for Metal support, run:

    ```bash
    system_profiler SPDisplaysDataType | grep Metal
    ```

Verify output similar to the following:

    ```bash
    Metal Support: Metal 3
    ```

### USB or SSD Drive

- 256GB+ recommended (128GB minimum for a single 7B model, tooling, and cache)
- USB 3.2 Gen 1 or better (supports ≥400MB/s read speeds)
- USB-C connection for easiest use on modern Apple products

**Drive types:**

- *Budget option*: High-speed USB-C flash drive (e.g., SanDisk Ultra Luxe)
- *Performance option*: Portable SSD (e.g., Samsung T7 Shield with ~1050MB/s)

**Note**: Slower drives may bottleneck model load times or impact performance during inference.

## Procedure

### Prepare the USB Drive

1. Insert the USB flash drive.
2. Open Disk Utility (Applications > Utilities).
3. Select the USB device (not just its volume).
4. Click "Erase" and use the following settings:
    - Format: exFAT
    - Scheme: GUID Partition Map
    - Name: `LEXICON-USB`
5. Click Erase and wait for it to complete.

### Clone the Project

    ```bash
    cd /Volumes/LEXICON-USB
    ```
    ```bash
    git clone https://github.com/your-username/lexicon
    ```
    ```bash
    cd lexicon
    ```

### Install Ollama Runtime (One-Time Host Setup)

    brew install ollama
    ```

### Pull a Model to the USB

Set the model storage path and download a quantized model:

    ```bash
    export OLLAMA_MODELS=/Volumes/LEXICON-USB/lexicon/models
    ```
    ```bash
    ollama pull mistral
    ```

This step requires internet access. Once pulled, the model is stored entirely on the USB.

### Launch Lexicon

    ```bash
    ./bin/launch.sh
    ```

This script:
- Starts the Ollama backend
- Serves the Lexicon web interface at http://localhost:8000

Open that link in your browser to use Lexicon fully offline.

### Optional: Configure Environment

Edit this file to set runtime options:

    config/ollama.env

Example:

    OLLAMA_MODELS=/Volumes/LEXICON-USB/lexicon/models
    OLLAMA_HOST=localhost:11434

## Notes

- Lexicon is optimized for MacBooks with M2 or newer chips (Metal acceleration).
- Once models are downloaded, Lexicon requires no internet to run.
- You can add more models or prompts later to expand its capabilities.

## References

- [Ollama Runtime](https://ollama.com)
- [Ollama Docs](https://ollama.com/library)
- [Available Models](https://ollama.com/library)
- [Ollama GitHub (Open Source)](https://github.com/ollama/ollama)
- [Apple Disk Utility Guide](https://support.apple.com/guide/disk-utility/erase-and-reformat-storage-devices-dskutl14079/mac)
- [Apple Metal Acceleration](https://developer.apple.com/metal/)

