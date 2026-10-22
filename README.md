# Plate Motion Explorer

A 3D globe for 7th graders: match fossils and rocks across the oceans, travel back in time, and put Pangaea back together. It is the third site in the set with **Mars Explorer** and **Earth Explorer**, and it has the same look.

Made for iPads (Safari, iPadOS 15 or newer). It also works on computers.

## What's on the site

| Menu button | What it does |
|---|---|
| **Fossil Match** | A pop-up says "Match the fossils to see how Ancient Earth's continents used to be arranged," and students tap **Let's Play**. Then they tap matching fossils (Mesosaurus, Glossopteris, Lystrosaurus, Cynognathus) on different continents. When all the places for one fossil are found, the continents slide back to where they were when it lived, and a card opens with photos, short facts, and "The evidence." After the last match, confetti and fireworks play first, then a short Lystrosaurus video (with sound), then the card, then students can see all the fossils together. Matches stay green with a check mark if students leave and come back. After all four are matched, the game starts fresh the next time. |
| **Rock Match** | The same idea with three kinds of rock evidence: matching mountains (Appalachians, Greenland, Scotland, Norway, Morocco), matching 2-billion-year-old rocks (Brazil and Ghana), and matching glacier scratches from a giant ice sheet about 300 million years ago (Brazil, South Africa, India, Australia, Antarctica). After the last match, the celebration plays, then a short video of a rock tumbling off a cliff (with sound). |
| **Time Machine** | A pop-up welcomes students; they tap **Use the Time Machine**. Then they tap **Play**, drag the round button, or tap a date to read about it. A few seconds after Play starts, a note reminds them they can spin the globe. The view is tilted toward the South Pole, and the little fossil pictures ride along with their continents. |
| **Puzzle** | "How fast can you build Pangaea?" A timer (top left) starts when students tap **Play the puzzle**, and each iPad remembers its best time for Easy and Hard. Students drag the continents onto the faint outlines. **Pinch** to zoom, drag the ocean to move around, and tap **See all** to see everything again. Each continent glows its own color when it snaps into place. **Shelves** shows the continental shelves, with a short explanation box (tap **OK**). When it's solved, confetti plays and colored fossil stripes line up across the pieces. Finishing Easy unlocks **Hard Mode** (red flash): the pieces start in new places and turned around, students turn them with two fingers, only the outside edge of Pangaea is shown, and pieces must be placed more exactly. After that, the puzzle asks Easy or Hard Mode each time it starts and every time students tap **Start over**. Beating Hard Mode plays a short video of Alfred Wegener (with sound) in front of confetti and fireworks, with the words "Alfred Wegener is proud of you!" |
| **Music** | Opens the Music menu: an on/off switch and 6 songs with fun names (Pangaea Party, Drifting Continents, Fossil Detective, Gondwana Breeze, Mesosaurus Splash, Fingernail Speed). The playing song shows little moving bars. Music starts after the first tap (browsers require a tap before playing sound). It pauses by itself while a video plays or **Read to me** is talking. |
| **Show** | Continent names, continental shelves, lines of latitude, help, and credits. |

Every card and help box has a **Read to me** button. It uses the iPad's built-in voice, so it works without extra apps. (Turn the iPad's volume up. On some iPads the side switch must not be on silent.)

## Putting it on GitHub Pages (first time)

1. On GitHub, click **+** (top right), then **New repository**. Name it `PlateMotionExplorer`. Make it **Public**. Click **Create repository**.
2. On the new repository page, click **uploading an existing file**.
3. Unzip `PlateMotionExplorer.zip`. Open the `PlateMotionExplorer` folder. Select **everything inside it** and drag it onto the GitHub page. (Upload what's inside the folder, not the folder itself, so `index.html` is at the top.)
4. Click **Commit changes**. Wait until the upload finishes.
5. Click **Settings** (top of the repository), then **Pages** (left side).
6. Under **Branch**, choose **main** and **/(root)**, then click **Save**.
7. Wait 1–2 minutes. Your site will be at **https://jdl2025.github.io/PlateMotionExplorer/**

Tip: On a Mac, `.nojekyll` is a hidden file. If it doesn't get uploaded, the site still works.

## Updating later

Upload the new files the same way (**Add file → Upload files**). GitHub replaces files that have the same name and never deletes anything.

## Which file to edit for what

You can edit these on GitHub with the pencil icon. Each one has notes at the top.

| To change… | Edit this file |
|---|---|
| Fossil names, places, facts, bullets, photos, and the pop-up words | `js/data/fossils.js` |
| Mountain and rock matches | `js/data/rocks.js` |
| Background music: on or off at the start, which song plays first, and the song list | `js/data/music.js` |
| The words under the celebration videos (`finaleVideo`) | `js/data/fossils.js` and `js/data/rocks.js` |
| Time Machine stops and words | `js/data/timemachine.js` |
| Puzzle starting spots (`sx`, `sy` wide screen; `px`, `py` tall screen) | `js/data/puzzle.js` |
| Colors and sizes | `css/app.css` |

Photos live in the `photos/` folder. The small round pictures on the globe are in `photos/thumbs/`.

## Things to know

- **How the continents move:** the site uses a real plate-motion model made by scientists (Müller et al. 2022, EarthByte Group, University of Sydney). The globe, the matches, the Time Machine, and the puzzle all use it, so they agree with each other. It is a model, and scientists keep improving it.
- **The continents look like today:** the land on the globe and on the puzzle pieces is today's picture (NASA Blue Marble) moved to old positions. Long ago, the coastlines and sea levels were different.
- **Puzzle pieces** are today's continents, like the paper puzzle. The puzzle shows Pangaea about 230 million years ago, with Africa held still.
- **Nothing to install, no logins, no tracking.** The site only remembers (on each iPad) that the help box was already shown.
- **Credits** are on the About page (Show → About this site & credits). Each photo lists the website it came from. Some photos and artwork are copyrighted by their owners, so check them before selling or sharing the site outside your classroom.

## Files

```
index.html          the page
css/app.css         all styles (same look as Mars and Earth Explorer)
js/main.js          starts everything
js/globe.js         the 3D globe and moving continents (Three.js)
js/glsl.js          graphics code
js/app.js           menus, cards, photo slideshows
js/speech.js        Read to me
js/match.js         Fossil Match and Rock Match
js/timemachine.js   Time Machine
js/puzzle.js        Pangaea Puzzle
js/data/            the words, places, and settings you can edit
data/               continent shapes and movements from the plate model, puzzle pictures
photos/             fossil and rock photos
music/              6 quiet background songs by Kevin MacLeod (incompetech.com, CC BY 4.0): .m4a for iPads, .webm backup
media/              the celebration videos (they wait for a tap, and their sound was evened out to a gentler level): Lystrosaurus (Fossil Match), rock (Rock Match), Alfred Wegener (puzzle Hard Mode). MP4 for iPads, WebM backup, and a first picture for each
assets/             fonts, Earth picture, icons
lib/                Three.js (3D engine)
```
