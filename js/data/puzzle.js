/* =====================================================================
   PANGAEA PUZZLE — piece pictures and where they go.
   Made from the same plate-motion model as the globe (about 230 million
   years ago, with Africa held still). Each piece:
     name      label on the piece
     img       pictures in data/puzzle/ (land and continental shelf)
     x, y      where the picture's top-left corner goes when solved (board pixels)
     cx, cy    the middle of the piece when solved
     sx, sy    where the piece starts on a wide (landscape) screen
     px, py    where the piece starts on a tall (portrait) screen
     hx, hy / hpx, hpy   starting spots for Hard Mode (wide / tall screen)
   title / popup / button   the pop-up box students see when the puzzle starts
   hardPopup        the pop-up box for Hard Mode
   You can move a starting spot by changing sx and sy.
   ===================================================================== */
window.PUZZLE = {
 "T": 230,
 "S": 520.0,
 "overlay": {
  "x": -710.0,
  "y": -980.7,
  "w": 1636,
  "h": 1642
 },
 "anchor": "AF",
 "pieces": [
  {
   "id": "AF",
   "name": "Africa",
   "w": 1023,
   "h": 737,
   "x": -260.7,
   "y": -184.9,
   "cx": 110.4,
   "cy": 125.3,
   "northDeg": -3.0,
   "lat": 9.75,
   "lon": 21.4,
   "sx": 110.4,
   "sy": 125.3
  },
  {
   "id": "MG",
   "name": "Madagascar",
   "w": 107,
   "h": 175,
   "x": 262.9,
   "y": 133.0,
   "cx": 315.8,
   "cy": 222.6,
   "northDeg": 0.1,
   "lat": -19.45,
   "lon": 46.86,
   "sx": -800,
   "sy": 900,
   "px": 1100,
   "py": -250,
   "hx": -950,
   "hy": -1150,
   "hpx": -900,
   "hpy": 400
  },
  {
   "id": "IN",
   "name": "India",
   "w": 298,
   "h": 397,
   "x": 275.7,
   "y": 14.1,
   "cx": 432.2,
   "cy": 164.2,
   "northDeg": 35.4,
   "lat": 24.1,
   "lon": 79.02,
   "sx": -1000,
   "sy": 150,
   "px": -950,
   "py": -100,
   "hx": -1050,
   "hy": 50,
   "hpx": 1100,
   "hpy": -750
  },
  {
   "id": "AN",
   "name": "Antarctica",
   "w": 599,
   "h": 445,
   "x": 40.3,
   "y": 215.4,
   "cx": 373.0,
   "cy": 458.5,
   "northDeg": 28.4,
   "lat": -87.32,
   "lon": 77.94,
   "sx": -1150,
   "sy": 650,
   "px": -1050,
   "py": 450,
   "hx": -1150,
   "hy": -650,
   "hpx": 1200,
   "hpy": -150
  },
  {
   "id": "AU",
   "name": "Australia",
   "w": 390,
   "h": 570,
   "x": 466.6,
   "y": 6.1,
   "cx": 676.7,
   "cy": 309.4,
   "northDeg": 39.5,
   "lat": -24.7,
   "lon": 135.16,
   "sx": -1000,
   "sy": -450,
   "px": -1000,
   "py": -650,
   "hx": -650,
   "hy": 950,
   "hpx": 1100,
   "hpy": 450
  },
  {
   "id": "SA",
   "name": "South America",
   "w": 661,
   "h": 564,
   "x": -431.3,
   "y": 94.6,
   "cx": -140.7,
   "cy": 359.9,
   "northDeg": -39.5,
   "lat": -15.6,
   "lon": -60.48,
   "sx": 1900,
   "sy": 560,
   "px": 1250,
   "py": 350,
   "hx": 2050,
   "hy": -650,
   "hpx": -1050,
   "hpy": -150
  },
  {
   "id": "NA",
   "name": "North America",
   "w": 674,
   "h": 812,
   "x": -710.0,
   "y": -503.5,
   "cx": -409.4,
   "cy": -87.7,
   "northDeg": 1.7,
   "lat": 55.15,
   "lon": -101.6,
   "sx": 1220,
   "sy": 560,
   "px": 100,
   "py": 1150,
   "hx": 1300,
   "hy": -700,
   "hpx": 150,
   "hpy": -1550
  },
  {
   "id": "GR",
   "name": "Greenland",
   "w": 194,
   "h": 254,
   "x": -340.8,
   "y": -390.0,
   "cx": -243.2,
   "cy": -285.3,
   "northDeg": -35.4,
   "lat": 74.81,
   "lon": -41.4,
   "sx": -1000,
   "sy": -1000,
   "px": 1150,
   "py": -700,
   "hx": -1000,
   "hy": 520,
   "hpx": -950,
   "hpy": -800
  },
  {
   "id": "EU",
   "name": "Europe and Asia",
   "w": 1568,
   "h": 1166,
   "x": -642.5,
   "y": -980.7,
   "cx": -169.7,
   "cy": -595.1,
   "northDeg": -124.9,
   "lat": 58.86,
   "lon": 83.28,
   "sx": 1500,
   "sy": -560,
   "px": 150,
   "py": -1650,
   "hx": 1720,
   "hy": 450,
   "hpx": 150,
   "hpy": 1300
  }
 ],
 "legend": [
  [
   "mesosaurus",
   "Mesosaurus",
   "#e9b47c",
   "diagonal stripes"
  ],
  [
   "glossopteris",
   "Glossopteris",
   "#7fd18b",
   "thin stripes"
  ],
  [
   "lystrosaurus",
   "Lystrosaurus",
   "#50a0ff",
   "flat stripes"
  ],
  [
   "cynognathus",
   "Cynognathus",
   "#ff8f7a",
   "up-and-down stripes"
  ]
 ],
 "popup": "Drag the continents to their correct spots to rebuild ancient Earth. The timer starts when you tap the button!",
 "button": "Play the puzzle",
 "title": "How fast can you build Pangaea?",
 "hardPopup": "The continents are turned around, and there are no outlines inside Pangaea. To turn a continent, put two fingers on it and twist."
};
