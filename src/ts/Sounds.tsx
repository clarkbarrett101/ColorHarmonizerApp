import { View, Text } from "react-native";
import React, { use, useEffect, useRef, useState } from "react";
import { AudioContext, OscillatorNode } from "react-native-audio-api";
export const audioContext = new AudioContext();
export type tChordProps = {
  baseFreq: number;
  interval: "minor" | "major";
  wave?: "sine" | "square" | "triangle" | "sawtooth";
};
export type tChord = {
  fStart: (props: tChordProps) => void;
  fStop: () => void;
};

const minorIntervals = [1, 1.19, 1.5];
const majorIntervals = [1, 1.26, 1.5];
export function useChord(): tChord {
  const freqs = [440, 440 * 1.19, 440 * 1.5];
  const gainNode = useRef(audioContext.createGain()).current;
  gainNode.gain.value = 0.01;
  gainNode.connect(audioContext.destination);
  const oscillators = useRef(
    freqs.map((freq) => {
      const osc = audioContext.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start();
      return osc;
    }),
  ).current;
  const targetGain = 1 / freqs.length;

  return {
    fStart: (props: tChordProps) => {
      const newFreqs =
        props.interval === "minor"
          ? minorIntervals.map((i) => props.baseFreq * i)
          : majorIntervals.map((i) => props.baseFreq * i);
      oscillators.forEach((osc, index) => {
        osc.frequency.setValueAtTime(newFreqs[index], audioContext.currentTime);
        osc.type = props.wave || "triangle";
      });
      const now = audioContext.currentTime;
      //gainNode.gain.exponentialRampToValueAtTime(targetGain, now + 0.01);
      gainNode.gain.setValueAtTime(targetGain, now);
      console.log(
        "Chord started with base frequency:",
        gainNode.gain.value,
        targetGain,
        newFreqs,
      );
    },
    fStop: () => {
      const now = audioContext.currentTime;
      if (gainNode.gain.value > 0.01) {
        gainNode.gain.setValueAtTime(0.01, now);
        console.log("Chord stopped" + gainNode.gain.value);
      }
    },
  };
}
