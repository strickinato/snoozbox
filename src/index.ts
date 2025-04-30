import * as Tone from "tone";

console.log("Hello, World!");

// Example usage of Tone.js
const synth = new Tone.Synth().toDestination();
synth.triggerAttackRelease("C4", "8n");
