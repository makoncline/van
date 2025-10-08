---
title: Power System
date: 2025-10-08
description: Electrical options, trade-offs, and final build for a winter-focused Sprinter camper.
---

# Power System

Goal: simple, reliable power for the Espar heater, roof fan, and small DC loads; fast alternator charging; clean install; solar-ready later; optional AC.

---

## Options

### 1) Factory-style Mercedes Aux AGM (under-hood, OEM kit)

**Core components**

- Mercedes auxiliary battery tray/harness/relay kit — $400–$600
- 95–100 Ah AGM (Group 49/H8) — $250–$350
- Optional Orion-Tr 12/12-18A for smarter charging — $175
- Small DC fuse block, wire, lugs — ~$125

**Total:** ~$725–$1,100

**Capabilities**

- Alternator charge via factory relay (or 18 A DC-DC if added)
- Usable energy: ~50 Ah ≈ ~0.64 kWh
- Heater runtime: ~1–2 nights
- Minimal cabin space; OEM isolation

**Pros**

- Simplest hardware; OEM look and mounting
- AGM charges fine in cold

**Cons**

- Low usable capacity for deep cycling
- Fewer upgrade paths than lithium

**Looks**

- Clean OEM under-hood appearance; minimal interior impact

---

### 2) DIY Victron LiFePO₄ (marine-grade, fixed install)

**Core components**

- 12 V 100 Ah LiFePO₄ (self-heating, Bluetooth optional) — $320–$595
- Victron Orion-Tr Smart 12/12-30A DC-DC — $220
- Victron SmartShunt 500 A — $130
- Blue Sea ST Blade 12-cct (5026) — $55
- Blue Sea 285 breaker 100 A — $55
- Blue Sea 7720 MIDI block + 40 A fuse — $45
- Blue Sea 6006 battery switch — $35
- Ancor tinned wire, lugs, fuses, heat-shrink — ~$170

**Total:** ~$1,350–$1,450

**Capabilities**

- Alternator charge: 30 A (~360 W) while driving
- Usable energy: ~80–90 Ah ≈ 1.0–1.15 kWh from a 100 Ah pack
- Heater runtime: ~3–4 winter nights (heater only)
- Full 12 V distribution now; easy to add loads later
- Solar: add MPPT later (e.g., Victron 100/30 or 100/50)

**Pros**

- Efficient DC path, low losses
- Works below freezing with heated cells
- Serviceable, standard parts

**Cons**

- More install time and wiring
- AC requires adding an inverter

**Looks**

- Functional, exposed components and cabling

---

### 3) Bluetti AC200L + D40 + Charger 1 (chosen, portable/hybrid)

**Core components**

- Bluetti AC200L (2,048 Wh, 2.4 kW inverter) — $1,199 (sale)
- Bluetti Charger 1 (≈560 W alternator charger) — $249
- Bluetti D40 (regulated 12 V up to 30 A) — $150
- 6-way marine fuse block + ground bus — $25
- 8–14 AWG marine wire, MIDI fuses, lugs, loom — ~$75

**Total:** ~ $1,700 all-in

**Capabilities**

- Alternator charge: ≈560 W into AC200L while driving
- Regulated 12 V 30 A to a fuse panel (heater, fan, lights)
- Usable energy: ~1.6 kWh from AC200L’s 2.0 kWh pack
- AC: 120 V, 2.4 kW built-in, surge headroom
- Solar: dual inputs, up to ~1,200 W

**Pros**

- Plug-and-play; minimal wiring
- Strong built-in AC; easy portability
- Tidy footprint; quick to remove or service

**Cons**

- More conversion steps than a pure DC system
- LiFePO₄ charge limited near/below 32 °F → keep unit warm

**Looks**

- Sleek enclosed unit; modern consumer aesthetic

> Note: AC200PL was dropped; Bluetti support confirmed it is not compatible with D40 in our use.

---

## Decision Matrix

| Criteria              |       DIY Victron LiFePO₄ |    Mercedes Aux AGM | Bluetti AC200L (chosen) |
| --------------------- | ------------------------: | ------------------: | ----------------------: |
| Parts cost (complete) |            ~$1,350–$1,450 |        ~$725–$1,100 |                 ~$1,700 |
| Usable energy         |             ~1.0–1.15 kWh |           ~0.64 kWh |                ~1.6 kWh |
| Alternator charging   |             30 A (~360 W) | Relay or 18 A DC-DC |      ≈560 W (Charger 1) |
| 12 V distribution     |         Full marine panel |         Small panel |        D40 → 30 A panel |
| AC power              |              Add inverter |                None |         2.4 kW built-in |
| Cold-weather charging |       Good (heated cells) |           Excellent |      Limited near 32 °F |
| Expandability         | Add cells, MPPT, inverter |             Limited | Bluetti expansion packs |
| Portability           |                     Fixed |           Fixed OEM |         Portable/hybrid |
| Install complexity    |                   Highest |                 Low |                     Low |
| Looks                 |       Functional, exposed |           Clean OEM |       Sleek, integrated |

**Outcome:** AC200L + Charger 1 + D40 best matches our heater-first use, fast alternator charging, simple install, and clean look.

---

## Notes and Safety

- Fuse within 7 in of any source (starter, battery, D40 out).
- Use tinned copper wire and adhesive heat-shrink lugs.
- Keep the alternator-charging path **ignition-controlled** to protect the starter battery.
- Verify torque on all studs; re-check after first trip.

---
