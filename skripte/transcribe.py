#!/usr/bin/env python3
"""Audiodatei -> Text, lokal via faster-whisper. Kein API-Kontingent, keine Kosten.

    skripte/transcribe.py <audiodatei> [--model small|medium|large-v3]

Erster Lauf laedt das Modell in den Standard-Cache von faster-whisper.
Sprache wird automatisch erkannt.
"""
import sys
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith('--')]
if not args:
    sys.exit(__doc__)
src = Path(args[0])
if not src.exists():
    sys.exit(f'nicht gefunden: {src}')

model_name = 'medium'
if '--model' in sys.argv:
    model_name = sys.argv[sys.argv.index('--model') + 1]

from faster_whisper import WhisperModel  # noqa: E402

model = WhisperModel(model_name, device='cpu', compute_type='int8')
# vad_filter schneidet Stille weg, spart bei langen Aufnahmen deutlich Zeit.
segments, info = model.transcribe(str(src), beam_size=5, vad_filter=True)
print(f'[{info.language}, {info.duration:.0f}s, Modell {model_name}]', file=sys.stderr)
print(' '.join(s.text.strip() for s in segments))
