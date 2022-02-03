import * as fs from 'fs';

/**
 * Parses an osu!mania beatmap file into a Javascript Object
 * @param path The file path of the osu!mania beatmap
 */
export function parseFileSync(path: fs.PathLike) {
    if (!fs.existsSync(path)) {
        throw new Error(`File at ${path} does not exist!`)
    }

    let beatmap: Beatmap = new Beatmap();
    let sectionReg = /^\[([a-zA-Z0-9]+)\]$/;

    let contents = fs.readFileSync(path, {
        encoding: 'utf8'
    }).split('\r\n').filter(value => !(value.startsWith('//') || value === ''));

    let sectionToRead = ""

    for (let line of contents) {
        let match = sectionReg.exec(line);
        if (match !== null) {
            sectionToRead = match[1];
        } else {
            switch (sectionToRead) {
                case "General":
                    let gen = line.split(": ");
                    gen.push('')
                    if (gen[0] === "Mode") {
                        switch (gen[1]) {
                            case '3':
                                break;
                            default:
                                throw new Error("Beatmap's game mode is not set to osu!mania.");
                                break;
                        }
                    }
                    else if (gen[0] === "PreviewTime") beatmap.previewTime = parseInt(gen[1]);
                    break;
                case "Metadata":
                    let mdata = line.split(":");
                    if (mdata[0] === "Title") beatmap.title = mdata[1];
                    else if (mdata[0] === "Artist") beatmap.artist = mdata[1];
                    else if (mdata[0] === "Creator") beatmap.creator = mdata[1];
                    else if (mdata[0] === "Version") beatmap.version = mdata[1];
                    else if (mdata[0] === "Tags") beatmap.tags = mdata[1].split(' ');
                    else if (mdata[0] === "BeatmapID") beatmap.mapId = parseInt(mdata[1]);
                    else if (mdata[0] === "BeatmapSetID") beatmap.mapsetId = parseInt(mdata[1]);
                    break;
                case "Difficulty":
                    let diff = line.split(":");
                    diff.push('');
                    if (diff[0] === "HPDrainRate") beatmap.hpDrain = parseFloat(diff[1]);
                    if (diff[0] === "CircleSize") beatmap.keyCount = parseInt(diff[1]);
                    if (diff[0] === "OverallDifficulty") beatmap.difficulty = parseFloat(diff[1]);
                    break;
                case "TimingPoints":
                    beatmap.addTimingPoint(line);
                    break;
                case "HitObjects":
                    beatmap.addHitObject(line);
                    break;
            }
        }
    }

    beatmap.keyPositions.sort((a, b) => a - b)

    return beatmap;
}

/**
 * A parsed beatmap
 */
class Beatmap {
    /**
     * Romanized Song Title
     */
    title: string;
    /**
     * Romanized Artist Name
     */
    artist: string;
    /**
     * Beatmap Creator Name
     */
    creator: string;
    /**
     * Difficulty Name
     */
    version: string;
    /**
     * Song Source
     */
    source: string;
    /**
     * Song Tags split in an array
     */
    tags: Array<string>;
    /**
     * Beatmap ID
     */
    mapId: number;
    /**
     * Beatmap Set ID
     */
    mapsetId: number;
    /**
     * Preview Time offset in milliseconds after audio start
     */
    previewTime: number;
    /**
     * Key Count of beatmap
     */
    keyCount: number;
    /**
     * HP Drain Rate of beatmap
     */
    hpDrain: number;
    /**
     * Overall Difficulty of beatmap
     */
    difficulty: number;
    /**
     * x positions of each key, arranged in ascending order
     */
    keyPositions: Array<number>;
    /**
     * Slowest bpm of the beatmap
     */
    minBpm: number;
    /**
     * Fastest bpm of the beatmap
     */
    maxBpm: number;
    /**
     * Number of notes in the beatmap
     */
    nbNotes: number
    /**
     * Number of hold notes in the beatmap
     */
    nbHolds: number
    /**
     * List of timing points in the beatmap
     */
    timingPoints: Array<TimingPoint>
    /**
     * List of hit objects in the beatmap
     */
    hitObjects: Array<HitObject>
    getTimingPoint(time: number): TimingPoint {
        for (var i = this.timingPoints.length - 1; i >= 0; i--) {
            if (this.timingPoints[i].time <= time) { return this.timingPoints[i]; }
        }
        return this.timingPoints[0];
    }
    addTimingPoint(line: string): void {
        let timingPoint = TimingPoint.parse(line);
        if (this.minBpm === 0) this.minBpm = timingPoint.bpm ?? 0;
        else if (this.minBpm > (timingPoint.bpm ?? Infinity)) this.minBpm = timingPoint.bpm ?? 0;
        if (this.maxBpm === 0) this.maxBpm = timingPoint.bpm ?? 0;
        else if (this.maxBpm < (timingPoint.bpm ?? -Infinity)) this.maxBpm = timingPoint.bpm ?? 0;
        this.timingPoints.push(timingPoint)
    }
    addHitObject(line: string): void {
        let hitObject = HitObject.parse(line);
        if (hitObject.type === 'note') this.nbNotes++;
        else if (hitObject.type === 'hold') this.nbHolds++;
        if (this.keyPositions.findIndex(item => item === hitObject.x) === -1) {
            this.keyPositions.push(hitObject.x);
        }
        this.hitObjects.push(hitObject);
    }
    constructor() {
        this.title = "";
        this.artist = "";
        this.creator = "";
        this.version = "";
        this.source = "";
        this.previewTime = 0;
        this.tags = [];
        this.mapId = 0;
        this.mapsetId = 0;
        this.keyCount = 0;
        this.hpDrain = 0;
        this.difficulty = 0;
        this.minBpm = 0;
        this.maxBpm = 0
        this.nbNotes = 0;
        this.nbHolds = 0;
        this.timingPoints = [];
        this.hitObjects = [];
        this.keyPositions = [];
    }
}
class TimingPoint {
    /**
     * (Integer)
     * Start time of the timing section, in milliseconds from the beginning of the beatmap's audio
     * The end of the timing section is the next timing point's `time`, or never if this is the last timing point
     */
    time: number
    /**
     * The duration of a beat, in milliseconds.
     */
    bpm?: number
    /**
     * Slider Velocity as a multiplier
     */
    velocity: number
    /**
     * (Integer)
     * Amount of beats in a measure. Inherited timing points ignore this property.
     */
    timingSignature: number
    /**
     * Default sample set for hit objects.
     * `0` = beatmap default, `1` = normal, `2` = soft, `3` = drum
     */
    sampleSet: 0 | 1 | 2 | 3
    /**
     * (Integer)
     * Custom sample index for hit objects.
     * `0` indicates osu!'s default hitsounds.
     */
    sampleIndex: number
    /**
     * (Integer)
     * Volume percentage for hit objects
     */
    volume: number
    /**
     * Whether or not the timing point is uninherited
     */
    uninherited: boolean
    /**
     * Whether or not kiai time is enabled
     */
    kiaiTime: boolean
    /**
     * Whether or not the first barline is omitted in osu!mania
     */
    omitFirstBarLine: boolean
    static parse(line: string): TimingPoint {
        let members = line.split(',');
        let beatLength = parseFloat(members[1]);
        let bpm = 0;
        let velocity = 1;
        if (beatLength > 0) bpm = Math.round(60000 / beatLength);
        else velocity = Math.abs(100 / beatLength);
        let effects = parseInt(members[7]);
        return new TimingPoint(
            parseInt(members[0]),
            bpm,
            velocity,
            parseInt(members[2]),
            parseInt(members[3]) as 0 | 1 | 2 | 3,
            parseInt(members[4]),
            parseInt(members[5]),
            members[6] === '1',
            ((effects & 0b1) !== 0),
            ((effects & 0b100) !== 0)
        )
    }
    constructor(time: number, bpm: number, velocity: number, meter: number, sampleSet: 0 | 1 | 2 | 3, sampleIndex: number, volume: number, uninherited: boolean, kiaiTime: boolean, omitFirstBarLine: boolean) {
        this.time = time;
        if (bpm !== 0) this.bpm = bpm;
        this.timingSignature = meter;
        this.velocity = velocity
        this.sampleSet = sampleSet;
        this.sampleIndex = sampleIndex;
        this.volume = volume;
        this.uninherited = uninherited;
        this.kiaiTime = kiaiTime;
        this.omitFirstBarLine = omitFirstBarLine;
    }
}
class HitObject {
    type: "note" | "hold"
    hitSound: HitSound
    newCombo: boolean
    comboColorsSkipped: number
    /**
     * (Integer)
     * Position in osu! pixels of the object.
     */
    x: number
    /**
     * (Integer)
     * Position in osu! pixels of the object.
     */
    y: number
    /**
     * (Integer)
     * Time when the object is to be hit, in milliseconds from the beginning of the beatmap's audio.
     */
    time: number
    /**
     * (Integer)
     * End time of the hold, in milliseconds from the beginning of the beatmap's audio.
     */
    endTime: number
    static parse(line: string): HitObject {
        let members = line.split(',');
        let type = parseInt(members[3]);
        let note = false;
        let hold = false;
        if ((type & 0b1) === 1) note = true;
        else if ((type & 0b10000000)) hold = true;
        let newCombo = (type & 0b100) === 1;
        let comboColorsSkipped = (type & 0b11100) / 4;
        let hitsoundFlags = parseInt(members[4])
        let hitsounds: HitSound = [];
        if ((hitsoundFlags & 0b1) === 1) hitsounds.push('normal')
        if ((hitsoundFlags & 0b10) === 1) hitsounds.push('whistle')
        if ((hitsoundFlags & 0b100) === 1) hitsounds.push('finish')
        if ((hitsoundFlags & 0b1000) === 1) hitsounds.push('clap')
        if (hitsounds.length === 0) hitsounds.push('normal')
        if (note) {
            return new HitObject(
                'note',
                hitsounds,
                newCombo,
                comboColorsSkipped,
                parseInt(members[0]),
                parseInt(members[1]),
                parseInt(members[2]),
                parseInt(members[2])
            )
        } else if (hold) {
            return new HitObject(
                'hold',
                hitsounds,
                newCombo,
                comboColorsSkipped,
                parseInt(members[0]),
                parseInt(members[1]),
                parseInt(members[2]),
                parseInt(members[5].split(':')[0])
            )
        } else {
            throw new Error("Unknown hit object type!");
        }
    }
    constructor(
        type: "note" | "hold",
        hitsound: HitSound,
        newCombo: boolean,
        comboColorsSkipped: number,
        x: number, y: number,
        time: number, endTime: number
    ) {
        this.type = type;
        this.hitSound = hitsound;
        this.newCombo = newCombo;
        this.comboColorsSkipped = comboColorsSkipped;
        this.x = x;
        this.y = y;
        this.time = time;
        this.endTime = endTime;
    }
}
type HitSound = Array<'normal' | 'whistle' | 'finish' | 'clap'>