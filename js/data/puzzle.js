/* =====================================================================
   PANGAEA PUZZLE — piece pictures and where they go.
   Made from the same plate-motion model as the globe (about 230 million
   years ago, with Africa held still). Each piece:
     name      label on the piece
     img       pictures in data/puzzle/ (land and continental shelf)
     x, y      where the picture's top-left corner goes when solved (board pixels)
     cx, cy    the middle of the piece when solved
     sx, sy    where the piece starts (like on a map of today's world)
     todayDeg  how much the piece is turned on today's map (Challenge level)
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
   "sy": 125.3,
   "todayDeg": 3.0
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
   "sx": 381.5,
   "sy": 400.3,
   "todayDeg": -0.1
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
   "sx": 673.3,
   "sy": -24.9,
   "todayDeg": -35.4
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
   "sx": 623.5,
   "sy": 676.3,
   "todayDeg": -28.4
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
   "sx": 1232.9,
   "sy": 478.0,
   "todayDeg": -39.5
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
   "sx": -672.7,
   "sy": 385.4,
   "todayDeg": 39.5
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
   "sx": -1085.9,
   "sy": -326.7,
   "todayDeg": -1.7
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
   "sx": -489.6,
   "sy": -555.2,
   "todayDeg": 35.4
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
   "sx": 812.0,
   "sy": -440.4,
   "todayDeg": 124.9
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
   "#ffcf6b",
   "flat stripes"
  ],
  [
   "cynognathus",
   "Cynognathus",
   "#ff8f7a",
   "up-and-down stripes"
  ]
 ]
};
