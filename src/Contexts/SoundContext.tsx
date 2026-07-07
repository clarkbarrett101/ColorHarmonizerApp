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
import { useUserContext } from "./UserContext";
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
  color: tCLARColor;
  seasons: tSeasonMap<number>;
  mainSeason: keyof tSeasonMap<number>;
  triad: triads;
  root: number;
  intervals: number[];
};
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
  fShepardNotes?: () => void;
};

const ctx = createContext<tSoundContext>({});
export const useSoundContext = () => useContext(ctx);
export default function SoundContext({ children }: { children: ReactNode }) {
  const { paintsPresent } = useUserContext();
  const paintMap = useRef<Record<string, tChord>>({}).current;
  const roomSize = 1;
  const decayTime = 1;
  const audioContext = useRef<AudioContext>(new AudioContext()).current;
  const buffers = useRef<Record<number, AudioBuffer | null>>({}).current;
  const harpBuffers = useRef<Record<number, AudioBuffer | null>>({}).current;
  const lastChords = useRef<tChord[]>([]).current;
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
    const chord =
      paintMap[color.c + "," + color.l + "," + color.ar] || fChooseChord(color);
    console.log("Starting chord", chord.intervals, color);
    const chordNodes: AudioBufferSourceNode[] = [];
    for (let i = 0; i < chord.intervals.length; i++) {
      const node = fSetupNode(chord.intervals[i], gainNode, harp);
      chordNodes.push(node);
      node.start(audioContext.currentTime + (0.5 / chord.intervals.length) * i);
    }
    gainNode.gain.linearRampToValueAtTime(
      0.5 / chord.intervals.length,
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
    let root =
      harmonicScale[Math.floor((ar / (Math.PI * 2)) * harmonicScale.length)] +
      62;
    if (c * l < 0.1) {
      root -= 12;
    }
    const seasons = fGetSeasons(color);
    let diffs = seasons;
    let mainSeason = Object.keys(diffs).reduce((a, b) =>
      diffs[a] > diffs[b] ? a : b,
    ) as keyof tSeasonMap<number>;
    let triad: triads = "maj";
    let intervals = seasonIntervals[mainSeason] as number[];
    let length = Math.ceil((intervals.length - 1) * Math.min(c / 0.45, 1)) + 1;
    intervals = intervals.slice(0, length);
    for (let i = 0; i < intervals.length; i++) {
      intervals[i] = intervals[i] + root;
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

  function fMapPaintsToChords() {
    const rootMap: Record<string, tCLARColor[]> = {};
    for (let i = 0; i < paintsPresent.length; i++) {
      const chord = fChooseChord(paintsPresent[i].clar);
      const key = chord.intervals.toString();
      if (!rootMap[key]) {
        rootMap[key] = [];
      }
      rootMap[key].push(chord.color);
    }

    for (let root in rootMap) {
      const colors = rootMap[root];
      if (colors.length > 1) {
        colors.sort((a, b) => b.c * b.l - a.c * a.l);
        console.log("Mapping paints to chords", root, colors.length);
        for (let i = 0; i < colors.length; i++) {
          const chord = fChooseChord(colors[i]);
          const index = Math.max(
            0,
            Math.min(2 + Math.ceil(colors.length / 2) - i, 5),
          );
          const triad = triadIntervals[triadNames[index] as triads];
          console.log(
            "Mapping paint to chord",
            colors[i],
            chord.intervals,
            index,
            triad,
          );
          for (let j = 0; j < 3; j++) {
            chord.intervals[j] = triad[j] + chord.root;
          }
          if (colors[i].l < 0.5) {
            chord.intervals.sort((a, b) => b - a);
          } else {
            chord.intervals.sort((a, b) => a - b);
          }
          paintMap[colors[i].c + "," + colors[i].l + "," + colors[i].ar] =
            chord;
        }
      } else {
        const chord = fChooseChord(colors[0]);
        paintMap[colors[0].c + "," + colors[0].l + "," + colors[0].ar] = chord;
      }
    }
  }
  useEffect(() => {
    fMapPaintsToChords();
  }, [paintsPresent]);

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
