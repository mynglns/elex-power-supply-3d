# ELEX Power Supply / 3D Model

Interactive 3D views of the ELEX power supply (PS Design SY2627): the 2.5 x 4 in single-sided PCB with all parts placed, and the same circuit built on a full-size 830-point breadboard.

`assets/power-supply.glb` was converted from the board's STEP export with its colors kept. `assets/power-supply-breadboard.glb` is the breadboard build, with every lead and wire in the hole listed in its build sheet. `assets/power-supply-breadboard-schematic-order.glb` is the same circuit laid out in the Multisim schematic's order: 5 V and 12 V along the top half, adjustable along the bottom half, with the pot on the board. Use the buttons to switch. Drag to orbit, scroll to zoom, `Reset` restores the starting view. GitHub Pages serves the root of main.

Run locally with `python -m http.server 4173` and open <http://localhost:4173>.
