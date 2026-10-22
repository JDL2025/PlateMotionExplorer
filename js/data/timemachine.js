/* =====================================================================
   TIME MACHINE — the stops on the timeline.
     age     million years ago (0 = today). The continents move to this time.
     label   the short label on the timeline
     title   the card title
     bullets short sentences for the card
     photos  optional pictures: [file, caption, credit]
   The globe uses a real plate-motion model made by scientists
   (Müller et al. 2022, EarthByte, University of Sydney).
   ===================================================================== */
window.TIME_MACHINE = {
  intro: {
    popup: 'Here you can replay ancient Earth’s history to see how the continents have moved.',
    button: 'Use the Time Machine',
    title: 'Time Machine',
    lead: 'The continents are always moving, very slowly. Let’s go back 300 million years and watch!',
    steps: [
      'Tap Play to watch the continents move all the way to today.',
      'Or drag the round button on the timeline to go back and forth in time.',
      'Tap a date on the timeline to stop there and read about it.',
      'Watch the little fossil pictures. They ride along with their continents!'
    ]
  },
  start: 300,
  stops: [
    {
      age: 300, label: '300 M', title: 'The Continents Crash Together',
      bullets: [
        'The continents are coming together into one giant supercontinent.',
        'Much of North America and Europe is near the equator. The land is covered with hot, steamy swamps.',
        'Plants from those swamps turned into coal. That is where much of the coal in Illinois comes from.',
        'Not long before this, a strange sea animal called the Tully monster lived in Illinois. It is the Illinois state fossil.'
      ],
      photos: [
        ["photos/tm300-1.jpg", "An artist’s idea of a swampy forest about 300 million years ago.", "Source: deviantart.com"],
        ["photos/tm300-2.jpg", "An artist’s idea of the Tully monster, the Illinois state fossil.", "Source: earth.com"],
        ["photos/tm300-3.jpg", "A real Tully monster fossil from Mazon Creek, Illinois.", "Source: scienceandculture.com"]
      ]
    },
    {
      age: 250, label: '250 M', title: 'Pangaea',
      bullets: [
        'All the continents are joined into one supercontinent called Pangaea. The name means “all lands.”',
        'One giant ocean, called Panthalassa, surrounds it.',
        'Mesosaurus, Glossopteris, Lystrosaurus, and Cynognathus lived around this time.',
        'You could walk from Africa to Antarctica!'
      ],
      photos: [
        ["photos/tm250-1.jpg", "Lystrosaurus lived on Pangaea.", "Source: sci.news"]
      ]
    },
    {
      age: 200, label: '200 M', title: 'Pangaea Starts to Split',
      bullets: [
        'A long crack opens between North America and Africa.',
        'Water fills the crack. The Atlantic Ocean is born!',
        'Dinosaurs live on every continent.'
      ],
      photos: []
    },
    {
      age: 150, label: '150 M', title: 'North and South Pull Apart',
      bullets: [
        'Pangaea has split into a northern part and a southern part.',
        'Scientists call the southern part Gondwana. It holds South America, Africa, India, Antarctica, and Australia.',
        'The North Atlantic Ocean keeps getting wider.'
      ],
      photos: []
    },
    {
      age: 100, label: '100 M', title: 'The South Atlantic Opens',
      bullets: [
        'South America and Africa have split apart. Now the South Atlantic Ocean is between them.',
        'India has broken away from Africa and Antarctica.',
        'India starts moving north, toward Asia.'
      ],
      photos: []
    },
    {
      age: 66, label: '66 M', title: 'Goodbye, Dinosaurs',
      bullets: [
        'A giant asteroid hits Earth near Mexico. Most dinosaurs die out.',
        'India is an island, racing north.',
        'India moves up to about 15 cm (6 inches) a year. That is very fast for a continent!'
      ],
      photos: []
    },
    {
      age: 50, label: '50 M', title: 'India Crashes into Asia',
      bullets: [
        'India slams into Asia. The crash pushes up the land.',
        'This is how the Himalayas, the tallest mountains on Earth, began to form.',
        'Australia is pulling away from Antarctica.'
      ],
      photos: [
        ["photos/tm50-1.jpg", "The Himalayas, pushed up when India crashed into Asia.", "Source: nationalgeographic.com"]
      ]
    },
    {
      age: 0, label: 'Now', title: 'Earth Today',
      bullets: [
        'The continents are still moving today!',
        'Most plates move about 2 to 5 cm (1 to 2 inches) a year. That is about as fast as your fingernails grow.',
        'The Atlantic Ocean gets a little wider every year.',
        'The Himalayas are still growing taller, because India is still pushing into Asia.'
      ],
      photos: [
        ["photos/tm0-1.jpg", "A crack in Iceland where two plates are pulling apart, a little more each year.", "Source: nathab.com"]
      ]
    }
  ]
};
