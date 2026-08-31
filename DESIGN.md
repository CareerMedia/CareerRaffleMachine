# CSUN Career Center Raffle — Visual System (v2)

## Art Direction

Bright luminous pearl/lavender environment with soft color blooms (coral, violet, blue). The wheel is a dimensional acrylic object — not a flat pie chart.

## Layout (1920×1080)

- **Top left:** CSUN | CAREER CENTER branding (logo placeholder)
- **Top right:** Single translucent status capsule (running / prizes / draw)
- **Center:** ~800px wheel with hub CTA
- **Bottom corners:** Subtle glass tags
- **Background:** Blooms, ribbons, floating spheres, stage reflection

## Wheel Architecture

```
wheel-shell
├── bloom
├── acrylic-outer (frosted ring + traveling highlight)
├── illuminated-ring
├── pointer (fixed, 12 o'clock)
├── face
│   ├── rotor (GSAP rotate)
│   │   ├── SVG segments (geometry only)
│   │   └── label layer (counter-rotated)
│   └── inner-rim
└── hub (START SPIN button, fixed)
```

## Label Positioning

Labels are **not** part of SVG paths. Each label is absolutely positioned via polar coordinates at 66% radius, then counter-rotated with `rotate(calc(-1 * var(--wheel-rotation)))` so text stays screen-horizontal.

## Pointer Alignment

Pointer fixed at `left: 50%; top: 0; transform: translate(-50%, -42%)`. Winner math uses `POINTER_REFERENCE = 0°` (12 o'clock). Target rotation aligns `winnerCenter` under pointer.

## Materials

Frosted glass capsules, acrylic wheel rim, faceted red pointer gem, dark dimensional hub.
