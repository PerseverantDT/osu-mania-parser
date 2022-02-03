# osu-mania-parser

A module that converts osu!mania beatmaps into a Javascript Object. This allows users to easily convert their osu!mania beatmaps for use in other VSRGs.

This parser is made specifically for osu!mania. As such, support for the other game modes is highly unlikely.

## Installation

```
npm install osu-mania-parser
```

## Usage

```js
var parser = require('osu-mania-parser')

var beatmap = parser.parseFileSync('filepath/ofmap.osu');
console.log(beatmap);
```

## Returned Object

```js
beatmap = {
    title: "Romanized Song Title",
    artist: "Romanized Artist Name",
    creator: "Beatmap Creator",
    version: "Difficulty Name",
    source: "Song Source",
    tags: [ "tags", "placed", "as", "an", "array" ],
    mapId: "Beatmap ID",
    mapsetId: "Beatmap Set ID",
    previewTime: 500, // Preview time in milliseconds
    keyCount: 4, // Number of keys (Circle Size)
    hpDrain: 8, // HP Drain Rate
    difficulty: 8.5, // Overall Difficulty
    keyPositions: [ // x value per key position, arranged in ascending order
        64,
        192,
        320,
        448
    ],
    minBpm: 120, // Lowest tempo of chart
    maxBpm: 240, // Highest tempo of chart
    nbNotes: 500, // Number of Notes
    nbHolds: 125, // Number of Holds
    timingPoints: [ // List of timing points
        {
            time: 23, // offset in milliseconds
            bpm: 180, // tempo of timing section, rounded to nearest whole
            velocity: 1, // slider velocity as a multiplier
            timingSignature: 4, // time signature of timing section
            sampleSet: 0, // default sample set for hit objects
            sampleIndex: 0, // custom sample index for hit objects
            volume: 100, // volume percentage for hit objects
            uninherited: true, // whether or not this timing point is uninherited
            kiaiTime: false, // whether or not this timing section is in kiai time
            omitFirstBarLine: false // Whether or not the first bar line is omitted
        }
    ],
    hitObjects: [
        {
            type: "note", // type of hit object, either "note" or "hold"
            hitSound: [ "normal", "whistle", "finish", "clap" ], // which sounds will play when the object is hit
            newCombo: false, // whether the hit object forces a new combo
            comboColorsSkipped: 0, // number of colors skipped when a new combo starts
            x: 64, // x position of the hit object, used for key position
            y: 192, // y position of the hit object, unused
            time: 356, // offset of hit object in milliseconds after audio start
            endTime: 689, // offset of hold note release in milliseconds after audio start; equal to time for notes
        }
    ]
}
```

## Methods

### parseFileSync(filepath)

Parses the given file. Returns a `Beatmap`.

```js
// Parses an osu!mania beatmap and writes it to a json file named beatmap.json
const fs = require('fs');

var beatmap = parseFileSync('./path/to/beatmap.osu')
fs.writeFileSync(`./beatmap.json`, JSON.stringify(beatmap, null, 4))
```

## To-do

- Add support for custom hit samples
- Parse beatmaps from a file stream
- Add asynchronous version of methods (low priority)
