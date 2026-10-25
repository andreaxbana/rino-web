---
license: apache-2.0
language:
- ja
tags:
- keras
- onnx
- pytorch
- image-classification
- japanese
- kanji
- kana
- handwriting-recognition
- character-recognition
- ocr
- cnn
pipeline_tag: image-classification
datasets:
- ETL9G
widget:
- text: "Draw a Japanese character"
---

# Japanese Character Recognition CNN

A Convolutional Neural Network (CNN) for classifying individual Japanese characters from **64x64 grayscale images**. Three model versions are available.

---

## v3 — PyTorch/ONNX (recommended)

**`KanjiDNN_v3.onnx`** — a compact 4-block CNN optimized for **finger-drawn input** on touchscreens.

| Property | Value |
|----------|-------|
| Framework | PyTorch, exported to ONNX |
| Classes | 3,181 (2,140 Joyo kanji + 859 JIS Level 1 kanji + 181 kana + 1 REJECT) |
| Input | 64x64 grayscale, binarized, ink=1.0 / background=0.0 |
| Parameters | ~2.4M |
| File size | 11 MB |
| Training data | KanjiVG SVG strokes with finger-drawing augmentation + ETL9G handwriting samples |

### Architecture

```
4x ConvBlock(Conv3x3 → BN → ReLU → Conv3x3 → BN → ReLU → MaxPool2x2 → Dropout)
  channels: 32 → 64 → 128 → 256
AdaptiveAvgPool → Linear(256,512) → BN → ReLU → Dropout(0.4) → Linear(512, num_classes)
```

### Preprocessing

Images must be preprocessed identically to training (see `KanjiDNN_v3_preprocessing_config.json`):

1. **Binarize** at threshold 200
2. **Crop** to ink bounding box
3. **Add margin** (10% of the larger dimension)
4. **Resize** to 64x64 (preserve aspect ratio, center on canvas)
5. **Normalize**: `(255 - pixel) / 255` (ink=1.0, background=0.0)

### Rejection

Dual-layer rejection (see `KanjiDNN_v3_inference_config.json`):
- Explicit `REJECT` class (index 3180) trained on romaji, digits, punctuation, scribbles, and blanks
- Confidence threshold: force reject when top softmax probability < 0.5

### Usage (ONNX Runtime)

```python
import onnxruntime as ort
import numpy as np
import json

session = ort.InferenceSession("KanjiDNN_v3.onnx")
classes = json.load(open("KanjiDNN_v3_classes.json"))

# image: preprocessed 64x64 float32 array, shape (1, 1, 64, 64)
image = np.expand_dims(np.expand_dims(preprocessed, 0), 0).astype(np.float32)
logits = session.run(None, {"input": image})[0]

probs = np.exp(logits) / np.exp(logits).sum()
top_idx = np.argmax(probs)
print(f"Prediction: {classes[top_idx]} ({probs[0][top_idx]:.1%})")
```

### Why v3?

Built to replace v1/v2, whose precision suffers on real finger input — their inference pipeline skips bounding-box centering and normalization. v3 uses KanjiVG strokes augmented to approximate finger-drawing (thick, imprecise strokes, no pressure taper) plus ETL9G handwriting samples, with a rigorous preprocessing pipeline that must be replicated at inference time.

### Source code

Training pipeline: [github.com/gaiseras/kanjirec](https://github.com/gaiseras/kanjirec) (if public) — includes dataset generation, augmentation, training, evaluation, and ONNX export scripts.

---

## v1 & v2 — Keras

**`KanjiDNN_v1.keras`** and **`KanjiDNN_v2.keras`** — the original Keras models.

### Character classes

- Kanji, Hiragana & Katakana (kana), Romaji (Latin letters), Digits (0-9), Common punctuation marks

### Training data

- Self-generated character images
- SVG graphics from [KanjiVG](https://kanjivg.tagaini.net/)
- ETL9G dataset from the [ETL Character Database](http://etlcdb.db.aist.go.jp/)

### Usage (Keras)

```python
import os
os.environ["KERAS_BACKEND"] = "jax"  # or "torch", "tensorflow"
import keras

model = keras.saving.load_model("hf://gaiseras/kanjiDNN")
```

### Try it live

[Gradio demo on Hugging Face Spaces](https://huggingface.co/spaces/gaiseras/KanjiDNN)
