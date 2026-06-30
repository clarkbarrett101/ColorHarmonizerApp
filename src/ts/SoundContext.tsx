import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
} from "react";
import { tCLARColor, tPaint, tSeasons, fGetSeasons } from "./CLAcolor";
import {
  AudioContext,
  AudioBuffer,
  BaseAudioContext,
  AudioBufferSourceNode,
  GainNode,
  AudioManager,
  AnalyserNode,
} from "react-native-audio-api";
import { Canvas, Circle } from "@shopify/react-native-skia";
import { Dimensions } from "react-native";
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
const interval = [
  1,
  256 / 243,
  9 / 8,
  32 / 27,
  81 / 64,
  4 / 3,
  1024 / 729,
  729 / 512,
  3 / 2,
  128 / 81,
  27 / 16,
  16 / 9,
  243 / 128,
  2,
] as const;
const harmonicScale = [-6, -4, -2, -1, 1, 3, 5, 6] as const;
export type tChordReturn = () => void;

export type tSoundContext = {
  fStartChord?: (color: tCLARColor) => tChordReturn;
  analyzer?: RefObject<AnalyserNode>;
};

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
const seasonIntervals: Record<keyof tSeasons, number[]> = {
  winter: [0, 3, 7, -5, -9, -12],
  summer: [0, 3, 7, 12, 15, 19],
  autumn: [0, 4, 7, -5, -8, -12],
  spring: [0, 4, 7, 12, 16, 19],
};

export type tChord = {
  color: tCLARColor;
  seasons: tSeasons;
  mainSeason: keyof tSeasons;
  triad: triads;
  root: number;
  intervals: number[];
};

const ctx = createContext<tSoundContext>({});
export const useSoundContext = () => useContext(ctx);
export default function SoundContext({ children }: { children: ReactNode }) {
  const roomSize = 1;
  const decayTime = 1;
  const audioContext = useRef<AudioContext>(new AudioContext()).current;
  const buffers = useRef<Record<number, AudioBuffer | null>>({}).current;
  const lastChords = useRef<tChord[]>([]).current;
  const analyzer = useRef<AnalyserNode | null>(null);

  function fStartChord(color: tCLARColor) {
    if (!color) return;
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
    const chord = fChooseChord(color);
    console.log(
      "Chords:",
      lastChords.map((c) => c.intervals.map((i) => i + c.root)),
    );

    const chordNodes: AudioBufferSourceNode[] = [];
    for (let i = 0; i < chord.intervals.length; i++) {
      const node = fSetupNode(chord.intervals[i] + chord.root, gainNode);
      chordNodes.push(node);
      node.start(audioContext.currentTime + (0.5 / chord.intervals.length) * i);
    }
    gainNode.gain.linearRampToValueAtTime(
      1 / chord.intervals.length,
      audioContext.currentTime + 0.3,
    );
    return () => {
      gainNode.gain.linearRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.1,
      );
      chordNodes.forEach((node) => {
        node.stop(audioContext.currentTime + 0.1);
      });
    };
  }

  function fSetupNode(
    midiNote: number,
    output: GainNode,
  ): AudioBufferSourceNode {
    const node: AudioBufferSourceNode = audioContext.createBufferSource({
      pitchCorrection: false,
    });
    let closeMatch = Object.keys(buffers).reduce((prev, curr) => {
      return Math.abs(Number(curr) - midiNote) <
        Math.abs(Number(prev) - midiNote)
        ? curr
        : prev;
    });
    let detune = midiNote - Number(closeMatch);

    node.buffer = buffers[Number(closeMatch)];
    node.detune.value = detune * 100;
    node.connect(output);
    return node;
  }

  function fChooseChord(color: tCLARColor): tChord {
    for (let i = 0; i < lastChords.length; i++) {
      if (
        color.c === lastChords[i].color.c &&
        color.l === lastChords[i].color.l &&
        color.ar === lastChords[i].color.ar
      ) {
        return lastChords[i];
      }
    }
    let { c, l, ar } = color;
    let root =
      harmonicScale[Math.floor((ar / (Math.PI * 2)) * harmonicScale.length)] +
      68;
    const seasons = fGetSeasons(color);
    let diffs = seasons;
    const mainSeason = Object.keys(diffs).reduce((a, b) =>
      diffs[a] > diffs[b] ? a : b,
    ) as keyof tSeasons;
    let triad: triads = "maj";
    let intervals = seasonIntervals[mainSeason] as number[];
    if (mainSeason === "spring" || mainSeason === "autumn") {
      triad = "maj";
    } else {
      triad = "min";
    }
    let length = Math.ceil((intervals.length - 1) * Math.min(c / 0.45, 1)) + 1;
    intervals = intervals.slice(0, length);
    for (let i = 0; i < lastChords.length; i++) {
      if (
        fChordMatch(
          { root, intervals, color, seasons, mainSeason, triad },
          lastChords[i],
        )
      ) {
        let triadKey = triadNames.indexOf(triad);
        let lastTriadKey = triadNames.indexOf(lastChords[i].triad);
        let brightness = (c / 0.45) * l;
        let lastBrightness =
          (lastChords[i].color.c / 0.45) * lastChords[i].color.l;
        if (brightness > lastBrightness) {
          triadKey = Math.min(lastTriadKey + 1, triadNames.length - 1);
        } else {
          triadKey = Math.max(lastTriadKey - 1, 0);
        }
        triad = triadNames[triadKey] as triads;
        console.log("Chord match found. Adjusting triad to", triad);
      }
    }
    for (let i = 0; i < 3; i++) {
      switch (triad) {
        case "dim":
          intervals[i] = triadIntervals.dim[i];
          break;
        case "sus2":
          intervals[i] = triadIntervals.sus2[i];
          break;
        case "min":
          intervals[i] = triadIntervals.min[i];
          break;
        case "maj":
          intervals[i] = triadIntervals.maj[i];
          break;
        case "sus4":
          intervals[i] = triadIntervals.sus4[i];
          break;
        case "aug":
          intervals[i] = triadIntervals.aug[i];
          break;
      }
    }
    if (l < 0.5) {
      intervals.sort((a, b) => b - a);
    } else {
      intervals.sort((a, b) => a - b);
    }

    lastChords.unshift({ color, seasons, mainSeason, root, intervals, triad });
    if (lastChords.length > 7) {
      lastChords.pop();
    }
    return {
      color,
      seasons,
      mainSeason,
      root,
      intervals,
      triad,
    };
  }

  function fChordMatch(chord1: tChord, chord2: tChord): boolean {
    if (chord1.root !== chord2.root) return false;
    if (chord1.intervals.length !== chord2.intervals.length) return false;
    for (let i = 0; i < chord1.intervals.length; i++) {
      if (chord1.intervals[i] !== chord2.intervals[i]) return false;
    }
    return true;
  }

  useEffect(() => {
    Object.keys(noteFiles).forEach((key) => {
      const index = Number(key);
      audioContext.decodeAudioData(noteFiles[index]).then((decodedBuffer) => {
        buffers[index] = decodedBuffer;
      });
    });
    analyzer.current = audioContext.createAnalyser();
    analyzer.current.fftSize = 64;

    analyzer.current.smoothingTimeConstant = 0.8;
    analyzer.current.connect(audioContext.destination);
  }, []);

  return (
    <ctx.Provider
      value={{
        fStartChord,
        analyzer: analyzer,
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
