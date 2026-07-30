import {
  createContext,
  ReactNode,
  RefObject,
  use,
  useContext,
  useEffect,
  useRef,
} from "react";
import { tCLARColor, tPaint, tSeasonMap, fGetSeasons } from "../utils/CLAcolor";
import {
  AudioContext,
  AudioBuffer,
  BaseAudioContext,
  AudioBufferSourceNode,
  GainNode,
  AudioManager,
  AnalyserNode,
} from "react-native-audio-api";
const noteFiles = {
  56: require("../../assets/56.wav"),
  58: require("../../assets/58.wav"),
  61: require("../../assets/61.wav"),
  63: require("../../assets/63.wav"),
  66: require("../../assets/66.wav"),
  68: require("../../assets/68.wav"),
  70: require("../../assets/70.wav"),
  73: require("../../assets/73.wav"),
  75: require("../../assets/75.wav"),
  78: require("../../assets/78.wav"),
  80: require("../../assets/80.wav"),
};
const harpFiles = {
  50: require("../../assets/harp-50.wav"),
  55: require("../../assets/harp-55.wav"),
  60: require("../../assets/harp-60.wav"),
  62: require("../../assets/harp-62.wav"),
  69: require("../../assets/harp-69.wav"),
  74: require("../../assets/harp-74.wav"),
  77: require("../../assets/harp-77.wav"),
  84: require("../../assets/harp-84.wav"),
  86: require("../../assets/harp-86.wav"),
};

const harmonicScale = [0, 2, 4, 5, 7, 9, 11] as const;
type triads = "dim" | "sus2" | "min" | "maj" | "sus4" | "aug";
const triadNames = ["dim", "sus2", "min", "maj", "sus4", "aug"] as const;

const triadIntervals: Record<triads, number[]> = {
  dim: [0, 3, 6],
  sus2: [0, 2, 7],
  min: [0, 3, 7],
  maj: [0, 4, 7],
  sus4: [0, 5, 7],
  aug: [0, 4, 8],
};
const seasonIntervals: tSeasonMap<number[]> = {
  winter: [0, 3, 7, -5, -9, -12],
  summer: [0, 3, 7, 12, 15, 19],
  autumn: [0, 4, 7, -5, -8, -12],
  spring: [0, 4, 7, 12, 16, 19],
};
export type tChord = {
  root: number;
  season: keyof tSeasonMap<number[]>;
  triad: triads;
  length: number;
  arpeggio: "up" | "down";
  clarColor?: tCLARColor;
};
function fChordCode(chord: tChord): string {
  return (
    chord.root +
    "," +
    chord.season +
    "," +
    chord.triad +
    "," +
    chord.length +
    "," +
    chord.arpeggio
  );
}
function fChordToIntervals(chord: tChord): number[] {
  const triadInts = triadIntervals[chord.triad];
  const seasonInts = seasonIntervals[chord.season];
  for (let i = 0; i < triadInts.length; i++) {
    seasonInts[i] = triadInts[i];
  }
  const intervals = seasonInts.map((interval) => interval + chord.root);
  intervals.splice(chord.length, intervals.length - chord.length);
  intervals.sort((a, b) => (chord.arpeggio === "up" ? a - b : b - a));
  return intervals;
}
export type tChordReturn = (delay: number) => void;
export type eSFX = "fan" | "grab" | "drop";
const sfxFiles: Record<eSFX, any> = {
  fan: require("../../assets/fanCards.wav"),
  grab: require("../../assets/PickupCard.wav"),
  drop: require("../../assets/dropCard.wav"),
};

export type tSoundContext = {
  fStartChord?: (color: tCLARColor, harp?: boolean) => tChordReturn;
  fPlaySFX?: (sfx: eSFX) => void;
  analyzer?: RefObject<AnalyserNode>;
  fPlayNote?: (midiNote: number, harp?: boolean) => void;
  fAddPaintsToPresent?: (id: string, paints: tPaint[]) => void;
};

const ctx = createContext<tSoundContext>({});
export const useSoundContext = () => useContext(ctx);
export default function SoundContext({ children }: { children: ReactNode }) {
  const roomSize = 1;
  const decayTime = 1;
  const paintChords = useRef<Record<string, tChord>>({}).current;
  const audioContext = useRef<AudioContext>(new AudioContext()).current;
  const buffers = useRef<Record<number, AudioBuffer | null>>({}).current;
  const harpBuffers = useRef<Record<number, AudioBuffer | null>>({}).current;
  const paintsPresent = useRef<Record<string, tPaint[]>>({}).current;
  const analyzer = useRef<AnalyserNode | null>(null);
  const sfxBuffers = useRef<Record<eSFX, AudioBuffer | null>>({
    fan: null,
    grab: null,
    drop: null,
  }).current;
  const ready = useRef<boolean>(false);

  function fStartChord(color: tCLARColor, harp: boolean = false): tChordReturn {
    if (!color || !ready.current) return () => {};
    const gainNode = audioContext.createGain();
    const convolver = audioContext.createConvolver();
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * decayTime;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * roomSize;
      }
    }
    convolver.buffer = impulse;
    gainNode.gain.value = 0.01;
    gainNode.connect(convolver);
    convolver.connect(analyzer.current!);
    const chordNodes: AudioBufferSourceNode[] = [];
    let chord =
      paintChords[
        color.c.toFixed(2) +
          "," +
          color.l.toFixed(2) +
          "," +
          color.ar.toFixed(2)
      ];
    chord = chord || fChooseChord(color);
    console.log("fStartChord", color, chord, fChordToIntervals(chord));
    const intervals = fChordToIntervals(chord);
    for (let i = 0; i < intervals.length; i++) {
      const node = fSetupNode(intervals[i], gainNode, harp);
      chordNodes.push(node);
      node.start(audioContext.currentTime + (0.5 / intervals.length) * i);
    }
    gainNode.gain.linearRampToValueAtTime(
      0.5 / intervals.length,
      audioContext.currentTime + 0.3,
    );
    return (delay: number = 0) => {
      gainNode.gain.linearRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.1 + delay,
      );
      chordNodes.forEach((node) => {
        node.stop(audioContext.currentTime + 0.1 + delay);
      });
    };
  }

  function fPlayNote(midiNote: number) {
    if (!ready.current) return;
    const gainNode = audioContext.createGain();
    const convolver = audioContext.createConvolver();
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * decayTime * 0.5;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay * roomSize * 0.5;
      }
    }
    convolver.buffer = impulse;
    gainNode.gain.value = 0.01;
    gainNode.connect(convolver);
    convolver.connect(analyzer.current!);
    const node = fSetupNode(midiNote, gainNode, true);
    node.start(audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.3);
    gainNode.gain.linearRampToValueAtTime(0.0001, audioContext.currentTime + 1);
    node.stop(audioContext.currentTime + 1);
  }

  function fSetupNode(
    midiNote: number,
    output: GainNode,
    harp: boolean = false,
  ): AudioBufferSourceNode {
    const node: AudioBufferSourceNode = audioContext.createBufferSource({
      pitchCorrection: false,
    });
    if (!ready.current) return node;
    let closeMatch = Object.keys(harp ? harpBuffers : buffers).reduce(
      (prev, curr) => {
        return Math.abs(Number(curr) - midiNote) <
          Math.abs(Number(prev) - midiNote)
          ? curr
          : prev;
      },
    );
    let detune = midiNote - Number(closeMatch);
    node.buffer = (harp ? harpBuffers : buffers)[Number(closeMatch)];
    node.detune.value = detune * 100;
    node.connect(output);
    return node;
  }

  function fChooseChord(color: tCLARColor): tChord {
    let { c, l, ar } = color;
    c = Math.round(c * 100) / 100;
    let root =
      harmonicScale[Math.floor((ar / (Math.PI * 2)) * harmonicScale.length)] +
      62;
    if (c * l < 0.1) {
      root -= 12;
    } else if (c * l > 0.9) {
      root += 12;
    }
    const seasons = fGetSeasons(color);
    let season = Object.keys(seasons).reduce((a, b) =>
      seasons[a as keyof typeof seasons] > seasons[b as keyof typeof seasons]
        ? a
        : b,
    ) as keyof typeof seasons;
    let triad: triads =
      season === "spring" || season === "autumn" ? "maj" : "min";
    const length = Math.ceil(c * (seasonIntervals[season].length - 1)) + 1;
    const arpeggio = l > 0.5 ? "up" : "down";
    return { root, season, triad, length, arpeggio };
  }

  function fMatchingChord(chordA: tChord, chordB: tChord): boolean {
    if (chordA.root !== chordB.root) return false;
    if (chordA.triad !== chordB.triad) return false;
    if (chordA.season !== chordB.season) return false;
    if (chordA.length !== chordB.length) return false;
    if (chordA.arpeggio !== chordB.arpeggio) return false;
    return true;
  }

  function fAssignPaintsToChords() {
    const allPaints = Object.values(paintsPresent).flat();

    const chordMap: Record<string, tPaint[]> = {};
    allPaints.forEach((paint) => {
      const chord = fChooseChord(paint.clar);
      const chordCode =
        chord.root +
        "," +
        chord.season +
        "," +
        chord.length +
        "," +
        chord.arpeggio;
      if (!chordMap[chordCode]) {
        chordMap[chordCode] = [];
      }
      chordMap[chordCode].push(paint);
    });
    const finalChords: Record<string, tChord> = {};
    for (const chordCode in chordMap) {
      const paints = chordMap[chordCode];
      if (paints.length > 1) {
        paints.sort((a, b) => a.clar.l * a.clar.c - b.clar.l * b.clar.c);
        for (let i = 0; i < paints.length; i++) {
          let triadIndex = 4 - Math.floor(paints.length / 2) + i;
          triadIndex = Math.max(0, Math.min(triadIndex, triadNames.length - 1));
          const triad = triadNames[triadIndex];
          const colorCode =
            paints[i].clar.c.toFixed(2) +
            "," +
            paints[i].clar.l.toFixed(2) +
            "," +
            paints[i].clar.ar.toFixed(2);
          finalChords[colorCode] = { ...fChooseChord(paints[i].clar), triad };
        }
      } else {
        const colorCode =
          paints[0].clar.c.toFixed(2) +
          "," +
          paints[0].clar.l.toFixed(2) +
          "," +
          paints[0].clar.ar.toFixed(2);
        finalChords[colorCode] = fChooseChord(paints[0].clar);
      }
    }
    console.log("finalChords", finalChords);
    Object.assign(paintChords, finalChords);
  }

  function fPlaySFX(sfx: eSFX, delay: number = 0) {
    if (!analyzer.current) return;
    const buffer = sfxBuffers[sfx];
    if (buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.detune.value = 600 * (Math.random() - 0.5);
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.05;

      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start(audioContext.currentTime + delay / 1000);
    }
  }
  function fAddPaintsToPresent(id: string, paints: tPaint[]) {
    paintsPresent[id] = paints;
    fAssignPaintsToChords();
  }

  useEffect(() => {
    Object.keys(noteFiles).forEach((key) => {
      const index = Number(key);
      audioContext.decodeAudioData(noteFiles[index]).then((decodedBuffer) => {
        buffers[index] = decodedBuffer;
      });
    });
    Object.keys(harpFiles).forEach((key) => {
      const index = Number(key);
      audioContext.decodeAudioData(harpFiles[index]).then((decodedBuffer) => {
        harpBuffers[index] = decodedBuffer;
      });
    });
    Object.keys(sfxFiles).forEach((key) => {
      const sfx = key as eSFX;
      audioContext.decodeAudioData(sfxFiles[sfx]).then((decodedBuffer) => {
        sfxBuffers[sfx] = decodedBuffer;
      });
    });
    analyzer.current = audioContext.createAnalyser();
    analyzer.current.fftSize = 64;
    analyzer.current.smoothingTimeConstant = 0.8;
    analyzer.current.connect(audioContext.destination);
    ready.current = true;
  }, []);

  return (
    <ctx.Provider
      value={{
        fStartChord,
        fPlaySFX,
        fPlayNote,
        analyzer,
        fAddPaintsToPresent,
      }}
    >
      {children}
    </ctx.Provider>
  );
}

/*
SPRING (from Cmaj [0,4,7]):
[0,4,7] → [0,5,7]    One point shifts 4→5. A sigh.
[0,4,7] → [9,0,4,7]  Triad stays, bass slides under. Cradled.

SUMMER (from Cmin [0,3,7]):
[0,3,7] → [1,5,8,0]  Bass creeps 0→1. Chord becomes major. Mirage.
[0,3,7] → [8,0,3,7]  Bass drops to 8. Triad held inside. Oppressive heat.

AUTUMN (from Cmaj [0,4,7]):
[0,4,7] → [7,11,2,5]  Leap of a 5th. Tritone added. Earthy dance.
[0,4,7] → [2,6,9,0]   ♯4 (F♯) tipsy lift. Pulls to vi.

WINTER (from Cmin [0,3,7]):
[0,3,7] → [11,2,5,8]  Everything slides by half-step. Full diminished. No overlap.
[0,3,7] → [7,2]        Open fifth. Third abandoned. Hollow cold.
Each season has a distinct voice-leading fingerprint. Spring keeps and decorates. Summer keeps but chromatizes the bass. Autumn leaps and adds tritones. Winter abandons common tones for stepwise dissonance.

const SEASONS = {
  spring: {
    major: (root) => [root-3, root, root+4, root+10],    // vi7
    minor: (root) => [root+3, root+7, root+10, root+14]  // bIII maj7
  },
  summer: {
    major: (root) => [root-12, root+1, root+5, root+8, root+11], // bII maj7 + tonic pedal
    minor: (root) => [root-12, root+1, root+5, root+8, root+11]  // bII maj7 + tonic pedal
  },
  autumn: {
    major: (root) => [root-12, root+7, root+11, root+14, root+17, root-5], // V7 with drone
    minor: (root) => [root+7, root+11, root+14, root+17]  // V7
  },
  winter: {
    major: (root) => [root-1, root+2, root+5, root+8],    // vii°7
    minor: (root) => [root-1, root+2, root+5, root+8]     // vii°7
  }
};



[-10,-7,-4,0,3,7,10,14]
[-3,0,4,7,11,15,18]
*/
