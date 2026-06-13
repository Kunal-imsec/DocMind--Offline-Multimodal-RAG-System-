#!/usr/bin/env python3
"""
Pre-download all required models for offline operation
Run this script ONCE with internet connection
"""

import os
from pathlib import Path
from sentence_transformers import SentenceTransformer
import whisper

# Models to download
MODELS = {
    "text_embedder": "BAAI/bge-m3",
    "clip_embedder": "clip-ViT-B-32",
    "whisper": "small",  # or "base", "medium", "large"
}

# Alternative smaller models if you have limited resources
ALTERNATIVE_MODELS = {
    "text_embedder": "all-MiniLM-L6-v2",  # Smaller, faster
    "clip_embedder": "clip-ViT-B-32",
}

def download_sentence_transformer(model_name: str, local_dir: str = None):
    """Download sentence-transformers model"""
    print(f"\n{'='*80}")
    print(f"Downloading: {model_name}")
    print(f"{'='*80}")
    
    try:
        if local_dir:
            cache_folder = local_dir
        else:
            cache_folder = None
        
        model = SentenceTransformer(model_name, cache_folder=cache_folder)
        
        # Test the model
        test_vec = model.encode("test")
        print(f"✅ Successfully downloaded {model_name}")
        print(f"   Vector dimension: {len(test_vec)}")
        
        # Show cache location
        cache_path = os.path.expanduser("~/.cache/torch/sentence_transformers")
        model_cache = os.path.join(cache_path, model_name.replace("/", "_"))
        print(f"   Cached at: {model_cache}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to download {model_name}: {e}")
        return False

def download_whisper_model(model_name: str):
    """Download Whisper model"""
    print(f"\n{'='*80}")
    print(f"Downloading Whisper: {model_name}")
    print(f"{'='*80}")
    
    try:
        model = whisper.load_model(model_name)
        print(f"✅ Successfully downloaded Whisper {model_name}")
        
        # Show cache location
        cache_path = os.path.expanduser("~/.cache/whisper")
        print(f"   Cached at: {cache_path}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to download Whisper {model_name}: {e}")
        return False

def check_disk_space():
    """Check available disk space"""
    import shutil
    total, used, free = shutil.disk_usage("/")
    free_gb = free // (2**30)
    print(f"\n💾 Available disk space: {free_gb} GB")
    
    if free_gb < 10:
        print(f"⚠️  WARNING: Low disk space! You may need at least 10GB free.")
        return False
    return True

def main():
    print("\n" + "="*80)
    print("MODEL DOWNLOADER - Pre-download all models for offline operation")
    print("="*80)
    
    # Check disk space
    if not check_disk_space():
        response = input("\nContinue anyway? (y/n): ")
        if response.lower() != 'y':
            return
    
    # Ask user which models to download
    print("\n📦 Available model sets:")
    print("1. Full models (recommended, ~5GB total)")
    print("   - Text: BAAI/bge-m3 (2.3GB)")
    print("   - CLIP: clip-ViT-B-32 (600MB)")
    print("   - Whisper: small (500MB)")
    print("\n2. Lightweight models (~1GB total)")
    print("   - Text: all-MiniLM-L6-v2 (90MB)")
    print("   - CLIP: clip-ViT-B-32 (600MB)")
    print("   - Whisper: base (150MB)")
    
    choice = input("\nSelect model set (1/2) [default: 1]: ").strip() or "1"
    
    if choice == "2":
        models = ALTERNATIVE_MODELS.copy()
        whisper_model = "base"
    else:
        models = MODELS.copy()
        whisper_model = MODELS["whisper"]
    
    # Custom local directory (optional)
    custom_dir = input("\nCustom local directory (press Enter for default cache): ").strip()
    local_dir = custom_dir if custom_dir else None
    
    results = {}
    
    # Download text embedder
    print("\n" + "="*80)
    print("STEP 1/3: Text Embedder")
    print("="*80)
    results['text'] = download_sentence_transformer(models["text_embedder"], local_dir)
    
    # Download CLIP embedder
    print("\n" + "="*80)
    print("STEP 2/3: CLIP Image Embedder")
    print("="*80)
    results['clip'] = download_sentence_transformer(models["clip_embedder"], local_dir)
    
    # Download Whisper
    print("\n" + "="*80)
    print("STEP 3/3: Whisper Audio Model")
    print("="*80)
    results['whisper'] = download_whisper_model(whisper_model)
    
    # Summary
    print("\n" + "="*80)
    print("DOWNLOAD SUMMARY")
    print("="*80)
    
    for model_type, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{model_type.upper()}: {status}")
    
    all_success = all(results.values())
    
    if all_success:
        print("\n🎉 All models downloaded successfully!")
        print("\n📝 To use offline, set environment variable:")
        print("   export HF_HUB_OFFLINE=1")
        print("\n   Or add to your .env file:")
        print("   HF_HUB_OFFLINE=1")
        
        if local_dir:
            print(f"\n   TEXT_EMBED_LOCAL_PATH={local_dir}")
            print(f"   CLIP_LOCAL_PATH={local_dir}")
    else:
        print("\n⚠️  Some models failed to download. Check errors above.")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    main()