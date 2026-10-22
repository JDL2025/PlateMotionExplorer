/* =====================================================================
   FOSSIL MATCH — the words, places, and photos for each fossil.
   You can edit this file on GitHub with the pencil icon.

   For each fossil:
     name      the name on the card
     age       how many million years ago it lived (the continents move back to this time)
     thumb     the small round picture on the globe
     sites     where the fossils are found:
                 place  = the label under the picture
                 lat/lon = where on Earth (latitude, longitude)
                 dx/dy  = how far (in pixels) the picture floats from the spot, so pictures don't cover each other
     lived, size, found   the three quick facts
     bullets   short sentences (keep them short and simple!)
     evidence  the "Evidence" box at the bottom of the card
     photos    the slideshow: [picture file, caption, credit]
   intro.popup / intro.button   the pop-up box students see when the game starts
   ===================================================================== */
window.FOSSILS = {
  intro: {
    popup: 'Match the fossils to see how Ancient Earth’s continents used to be arranged.',
    button: 'Let’s Play',
    title: 'Fossil Match',
    lead: 'Scientists found the same fossils on continents that are now far apart. Can you find the matches?',
    steps: [
      'Spin the globe. Look for the round fossil pictures.',
      'Tap a fossil. It glows.',
      'Find the same fossil on another continent and tap it.',
      'When you find all the matches, watch the continents move!'
    ]
  },
  sets: [
    {
      id: 'mesosaurus',
      name: 'Mesosaurus',
      kind: 'Swimming reptile',
      color: '#e9b47c',
      age: 275,
      thumb: 'photos/thumbs/mesosaurus.jpg',
      short: 'A small reptile that swam in a shallow sea.',
      sites: [
        { place: 'Brazil', lat: -25.9, lon: -50.4, dx: -64, dy: -46 },
        { place: 'Namibia', lat: -26.6, lon: 18.1, dx: -70, dy: 8 }
      ],
      lived: 'About 275 million years ago',
      size: 'About 1 m (3 ft) long',
      found: 'South America and Africa',
      bullets: [
        'Mesosaurus was a small reptile with a long tail and webbed feet.',
        'It had a long snout full of thin, sharp teeth. It ate tiny shrimp-like animals.',
        'It lived in a shallow sea, and it was a slow swimmer.',
        'It could not swim across a wide, deep ocean like the Atlantic.',
        'Its fossils are found in only two places on Earth: South America and southern Africa.'
      ],
      evidence: 'Mesosaurus could not cross the Atlantic Ocean. But its fossils are on both sides! These fossils are evidence that South America and Africa were once joined, and that the continents have moved over time.',
      photos: [
        ["photos/mesosaurus-1.jpg", "A Mesosaurus fossil skeleton in stone. Look for the long tail and thin snout!", "Source: wallpapercave.com"],
        ["photos/mesosaurus-2.jpg", "Two Mesosaurus skeletons, found together in Brazil.", "Source: storage.googleapis.com"],
        ["photos/mesosaurus-3.jpg", "A Mesosaurus skeleton. It was about 1 meter (3 feet) long.", "Source: storage.googleapis.com"],
        ["photos/mesosaurus-4.jpg", "An artist’s idea of Mesosaurus swimming in a shallow sea.", "Source: deviantart.com"],
        ["photos/mesosaurus-5.jpg", "An artist’s idea of Mesosaurus hunting near the shore.", "Source: frontiersin.org"]
      ]
    },
    {
      id: 'glossopteris',
      name: 'Glossopteris',
      kind: 'Ancient tree',
      color: '#7fd18b',
      age: 260,
      thumb: 'photos/thumbs/glossopteris.jpg',
      short: 'A tree with tongue-shaped leaves.',
      sites: [
        { place: 'Argentina', lat: -48.5, lon: -68.5, dx: -70, dy: 30 },
        { place: 'Zimbabwe', lat: -18.4, lon: 26.5, dx: 66, dy: -40 },
        { place: 'India', lat: 22.3, lon: 78.5, dx: -66, dy: -30 },
        { place: 'Antarctica', lat: -73.5, lon: 68.0, dx: 60, dy: -46 },
        { place: 'Australia', lat: -33.0, lon: 150.5, dx: 64, dy: 20 }
      ],
      lived: 'About 299 to 252 million years ago',
      size: 'Trees up to 30 m (100 ft) tall',
      found: 'South America, Africa, India, Antarctica, Australia',
      bullets: [
        'Glossopteris was a tree. Its leaves were shaped like a tongue. ("Glossa" means tongue.)',
        'It grew in cool, wet, swampy forests. Many of its leaves turned into coal.',
        'Its seeds were big and heavy. They could not blow or float across an ocean.',
        'In 1912, explorers found Glossopteris fossils in Antarctica. They carried about 35 pounds (16 kg) of these fossils across the ice.',
        'Antarctica is frozen today. Trees could only grow there because Antarctica was once in a different place.'
      ],
      evidence: 'The same tree fossil is found on five continents that are now far apart. These fossils are evidence that South America, Africa, India, Antarctica, and Australia were once joined, and that the continents have moved over time.',
      photos: [
        ["photos/glossopteris-1.jpg", "A rock full of Glossopteris leaves. Each leaf is shaped like a tongue.", "Source: thefossilforum.com"],
        ["photos/glossopteris-2.jpg", "A close-up of one Glossopteris leaf. You can see its veins.", "Source: thefossilforum.com"],
        ["photos/glossopteris-3.jpg", "Glossopteris leaves pressed into rock about 260 million years ago.", "Source: sciencephotogallery.com"],
        ["photos/glossopteris-4.jpg", "A single Glossopteris leaf fossil.", "Source: cb-gallery.com"],
        ["photos/glossopteris-5.jpg", "A model of a Glossopteris tree. It lost its leaves in the cold season.", "Source: renderosity.com"]
      ]
    },
    {
      id: 'lystrosaurus',
      name: 'Lystrosaurus',
      kind: 'Plant-eating animal',
      color: '#50a0ff',
      age: 250,
      thumb: 'photos/thumbs/lystrosaurus.jpg',
      short: 'A plant eater about the size of a pig, with two tusks.',
      sites: [
        { place: 'South Africa', lat: -32.2, lon: 24.5, dx: 70, dy: 34 },
        { place: 'India', lat: 23.6, lon: 86.9, dx: 64, dy: -36 },
        { place: 'Antarctica', lat: -84.2, lon: 162.4, dx: -64, dy: -40 }
      ],
      lived: 'About 252 to 247 million years ago',
      size: 'About 1 m (3 ft) long, the size of a pig',
      found: 'Africa, India, Antarctica',
      bullets: [
        'Lystrosaurus was a plant eater. It had two tusks and a beak like a turtle.',
        'It lived on land and dug burrows. It could not swim across an ocean.',
        'It survived the biggest extinction in Earth’s history, about 252 million years ago.',
        'In 1969, scientists found Lystrosaurus fossils in Antarctica. It was big news!',
        'Lystrosaurus fossils are also found in China and Russia. They were part of the same supercontinent.'
      ],
      evidence: 'A land animal could not walk across an ocean. These fossils are evidence that Africa, India, and Antarctica were once joined, and that the continents have moved over time.',
      photos: [
        ["photos/lystrosaurus-1.jpg", "A Lystrosaurus skeleton. See the two tusks?", "Source: thefossilforum.com"],
        ["photos/lystrosaurus-2.jpg", "A Lystrosaurus skeleton in a museum.", "Source: thoughtco.com"],
        ["photos/lystrosaurus-3.jpg", "A Lystrosaurus skull fossil.", "Source: sciencephotogallery.com"],
        ["photos/lystrosaurus-4.jpg", "An artist’s idea of Lystrosaurus eating plants.", "Source: sci.news"],
        ["photos/lystrosaurus-5.jpg", "An artist’s idea of Lystrosaurus by the water.", "Source: fity.club"]
      ]
    },
    {
      id: 'cynognathus',
      name: 'Cynognathus',
      kind: 'Meat-eating animal',
      color: '#ff8f7a',
      age: 245,
      thumb: 'photos/thumbs/cynognathus.jpg',
      short: 'A fierce meat eater with a jaw like a dog.',
      sites: [
        { place: 'Argentina', lat: -34.9, lon: -68.5, dx: -70, dy: -30 },
        { place: 'South Africa', lat: -31.0, lon: 26.3, dx: 66, dy: -40 }
      ],
      lived: 'About 245 million years ago',
      size: 'Up to 2 m (6½ ft) long',
      found: 'South America, Africa, Antarctica',
      bullets: [
        'Cynognathus was a meat eater with sharp teeth and strong jaws.',
        'Its name means “dog jaw.”',
        'It was a relative of mammals. It probably had whiskers!',
        'It lived on land. It could not swim across an ocean.',
        'Its fossils are found in Argentina, southern Africa, and Antarctica.'
      ],
      evidence: 'Cynognathus lived on land, but its fossils are on both sides of the Atlantic Ocean. These fossils are evidence that South America and Africa were once joined, and that the continents have moved over time.',
      photos: [
        ["photos/cynognathus-1.jpg", "A Cynognathus skull. Look at its sharp, dog-like teeth!", "Source: amnh.org"],
        ["photos/cynognathus-2.jpg", "A Cynognathus skeleton in a museum.", "Source: x.com"],
        ["photos/cynognathus-3.jpg", "An artist’s idea of Cynognathus.", "Source: etsy.com"],
        ["photos/cynognathus-4.jpg", "An artist’s idea of Cynognathus on the hunt.", "Source: deviantart.com"],
        ["photos/cynognathus-5.jpg", "A 3D model of Cynognathus.", "Source: turbosquid.com"]
      ]
    }
  ],
  finale: {
    title: 'All the Fossil Evidence',
    age: 255,
    lead: 'You matched all four fossils! Here they are together, with the continents put back the way they were.',
    bullets: [
      'Look how the fossil spots sit side by side when the continents are joined.',
      'Scientists call this southern supercontinent Gondwana. It was the southern part of Pangaea.',
      'In 1915, a scientist named Alfred Wegener used fossils like these to say that the continents move.',
      'Many people did not believe him at first. Today, we have lots more evidence that he was right.'
    ],
    evidence: 'The same fossils on many continents are evidence that the continents were once joined, and that they have moved over time.'
  }
};
