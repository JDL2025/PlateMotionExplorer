/* =====================================================================
   ROCK MATCH — mountains and rocks that match across the ocean.
   Same format as fossils.js, plus:
     lines   the mountain chains or rock areas drawn on the globe,
             as lists of [latitude, longitude] points
     facts   the quick facts: [label, value]
     compare an optional "Compare it" box
   ===================================================================== */
window.ROCKS = {
  intro: {
    popup: 'Geologists can match rock formations across different continents to prove continental drift. See if you can match the rock evidence!',
    button: 'Let’s Play',
    title: 'Rock Match',
    lead: 'Rocks and mountains can match across an ocean too, like pieces of a torn page.',
    steps: [
      'Look for the brown mountain lines and the purple rock circles on the globe.',
      'Tap a picture. It glows.',
      'Find the same kind of mountain or rock on another continent and tap it.',
      'When you find all the matches, watch the continents move!'
    ]
  },
  // the video that plays after the celebration (files in the media folder)
  finaleVideo: { name: 'rock', title: 'You rock!', sub: 'You matched all the rock evidence!' },
  sets: [
    {
      id: 'mountains',
      name: 'Matching Mountains',
      kind: 'Mountain chain',
      color: '#d9a066',
      lineColor: '#e0a35c',
      age: 270,
      thumb: 'photos/thumbs/mountains.jpg',
      short: 'Old mountains on both sides of the Atlantic Ocean.',
      sites: [
        { place: 'Appalachians, USA', lat: 37.5, lon: -80.5, dx: -80, dy: 30 },
        { place: 'Greenland', lat: 74.5, lon: -22.5, dx: -70, dy: -30 },
        { place: 'Scotland', lat: 57.0, lon: -5.2, dx: -66, dy: 30 },
        { place: 'Norway', lat: 64.0, lon: 12.0, dx: 64, dy: -34 },
        { place: 'Morocco', lat: 31.5, lon: -7.8, dx: 66, dy: 34 }
      ],
      lines: [
        [[33.5, -86.8], [34.8, -85.0], [36.0, -83.0], [37.5, -80.6], [39.0, -78.6], [40.6, -76.0], [41.8, -74.3], [43.5, -72.8], [45.0, -71.0], [46.5, -68.5], [47.6, -66.0]],
        [[47.8, -59.0], [48.6, -58.3], [49.6, -57.2], [50.6, -56.3], [51.5, -55.6]],
        [[70.0, -25.5], [72.5, -24.5], [75.0, -21.8], [78.0, -20.0], [80.5, -17.5]],
        [[53.5, -10.0], [54.8, -8.0], [56.0, -5.8], [57.2, -5.2], [58.5, -4.6]],
        [[59.0, 6.0], [61.0, 7.5], [63.0, 10.0], [65.0, 13.2], [67.0, 15.5], [69.0, 18.5], [70.5, 23.0]],
        [[34.0, -6.0], [32.5, -7.4], [31.0, -8.5], [29.8, -9.3]],
        [[12.5, -12.3], [16.0, -13.0], [19.0, -14.2], [22.5, -14.5], [25.0, -13.5]]
      ],
      facts: [
        ['Formed', 'More than 270 million years ago'],
        ['Found in', 'North America, Greenland, Europe, Africa'],
        ['Today', 'Worn down and much lower']
      ],
      bullets: [
        'The Appalachian Mountains are in the eastern United States and Canada.',
        'Mountains in Greenland, Scotland, Norway, and Morocco are made of the same kinds of rock.',
        'The rocks are the same age, and they are folded the same way.',
        'These mountains formed when continents crashed together, long before the Atlantic Ocean was born.',
        'Put the continents back together, and the mountains line up into one long chain.',
        'Over millions of years, rain, ice, and wind wore the mountains down.'
      ],
      compare: 'Alfred Wegener said it is like a newspaper torn in two. When you put the two pieces back together, the lines of words match up. These mountain chains are like those lines of words.',
      evidence: 'One mountain chain is split up on four continents across the Atlantic Ocean. This is evidence that North America, Greenland, Europe, and Africa were once joined, and that the continents have moved over time.',
      photos: [
        ["photos/mountains-1.jpg", "The Appalachian Mountains in Virginia, USA.", "Source: visitroanokeva.com"],
        ["photos/mountains-2.jpg", "Glencoe, in the Highlands of Scotland.", "Source: blog.alandotchin.com"],
        ["photos/mountains-3.jpg", "Mountains in Norway.", "Source: study.internetworldstat.com"],
        ["photos/mountains-4.jpg", "Mountains on the east coast of Greenland.", "Source: islandsandicetravel.com"],
        ["photos/mountains-5.jpg", "Mountains in Morocco, in northwest Africa.", "Source: audleytravel.com"]
      ]
    },
    {
      id: 'oldrocks',
      name: 'Matching Old Rocks',
      kind: 'Very old rocks',
      color: '#c39bff',
      lineColor: '#c39bff',
      age: 200,
      thumb: 'photos/thumbs/oldrocks.jpg',
      short: 'The same very old rocks in Brazil and in Ghana.',
      sites: [
        { place: 'Brazil', lat: -2.8, lon: -44.5, dx: -70, dy: -30 },
        { place: 'Ghana', lat: 6.5, lon: -1.5, dx: 66, dy: -34 }
      ],
      loops: [
        { lat: -2.8, lon: -44.5, r: 2.6 },
        { lat: 7.0, lon: -2.5, r: 3.6 }
      ],
      facts: [
        ['Rock age', 'About 2 billion years old'],
        ['Found in', 'Brazil and Ghana (West Africa)'],
        ['Tested', 'In the 1960s']
      ],
      bullets: [
        'Rocks have ages, just like people. Scientists can measure how old a rock is.',
        'On the coast of Brazil, there are rocks about 2 billion years old.',
        'Across the ocean, in Ghana, there are rocks of the same kind and the same age.',
        'In Ghana, there is a line where the very old rocks meet younger rocks. Scientists guessed where that line should show up in Brazil.',
        'They went to Brazil to look, and the line was there!'
      ],
      evidence: 'The same old rocks are found on both sides of the ocean, and they fit side by side when the continents are joined. This is evidence that South America and Africa were once joined, and that the continents have moved over time.',
      photos: [
        ["photos/oldrocks-1.jpg", "Very old rock with folded stripes, called gneiss. Rocks like this can be billions of years old.", "Source: urth-picturepost.blogspot.com"],
        ["photos/oldrocks-2.jpg", "Big granite rocks in Ghana, West Africa.", "Source: tortoisepath.com"],
        ["photos/oldrocks-3.jpg", "Layers of old rock on the coast of Ghana.", "Source: twitter.com"]
      ]
    },
    {
      id: 'glaciers',
      name: 'Matching Glacier Scratches',
      kind: 'Rocks scratched by ice',
      color: '#9fe3ff',
      lineColor: '#9fe3ff',
      age: 300,
      thumb: 'photos/thumbs/glaciers.jpg',
      short: 'Rocks scratched by the same giant ice sheet, on five continents.',
      sites: [
        { place: 'Brazil', lat: -23.3, lon: -47.3, dx: -72, dy: 20 },
        { place: 'South Africa', lat: -28.7, lon: 24.7, dx: 68, dy: 26 },
        { place: 'India', lat: 20.9, lon: 85.2, dx: 66, dy: 30 },
        { place: 'Australia', lat: -35.1, lon: 138.5, dx: -66, dy: 30 },
        { place: 'Antarctica', lat: -84.5, lon: 166.0, dx: 64, dy: -36 }
      ],
      loops: [
        { lat: -23.3, lon: -47.3, r: 2.4 },
        { lat: -28.7, lon: 24.7, r: 2.4 },
        { lat: 20.9, lon: 85.2, r: 2.0 },
        { lat: -35.1, lon: 138.5, r: 2.0 },
        { lat: -84.5, lon: 166.0, r: 2.2 }
      ],
      facts: [
        ['Ice age', 'About 300 million years ago'],
        ['Found in', 'South America, Africa, India, Australia, Antarctica'],
        ['Today', 'Some of these places are hot!']
      ],
      bullets: [
        'Glaciers are giant, slow rivers of ice. As they slide, stones stuck in the ice scratch the rock below.',
        'About 300 million years ago, there was a huge ice age.',
        'Scientists found glacier scratches and glacier rocks in South America, Africa, India, Australia, and Antarctica.',
        'Some of these places, like India and Africa, are too hot for glaciers today.',
        'When the continents are put back together, the scratches line up. They show one giant ice sheet near the South Pole.'
      ],
      compare: 'It is like finding the same muddy footprints in five different rooms. They make sense only if the rooms were once one big room.',
      evidence: 'Rocks scratched by the same ice sheet are found on five continents, even hot ones. This is evidence that South America, Africa, India, Australia, and Antarctica were once joined near the South Pole, and that the continents have moved over time.',
      photos: [
        ["photos/glaciers-1.jpg", "Rock scratched by a glacier at Hallett Cove, Australia. The scratches show which way the ice moved.", "Source: walkaboutadelaide.com"],
        ["photos/glaciers-2.jpg", "Students exploring smooth, scratched rock left by glaciers in South Africa.", "Source: safieldschool.blogspot.com"],
        ["photos/glaciers-3.jpg", "Tillite: a rock made of the mud and stones a glacier left behind.", "Source: geodil.dperkins.org"],
        ["photos/glaciers-4.jpg", "One giant ice sheet covered the southern part of Pangaea. The arrows show which way the ice moved.", "Source: wallpapercave.com"],
        ["photos/glaciers-5.jpg", "Glaciers today leave the same kind of scratches on rock.", "Source: curiousdon.com"]
      ]
    }
  ],
  finale: {
    title: 'All the Rock Evidence',
    age: 270,
    lead: 'You matched all the rock evidence! Here it is together, with the continents put back the way they were.',
    bullets: [
      'The mountain chains line up into one long chain.',
      'The very old rocks of Brazil and Ghana sit side by side.',
      'The glacier scratches meet around one giant ice sheet near the South Pole.',
      'Rocks and fossils tell the same story: the continents were once joined.'
    ],
    evidence: 'Matching mountains, matching old rocks, and matching glacier scratches are evidence that the continents were once joined, and that they have moved over time.'
  }
};
