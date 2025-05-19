import * as Tone from "tone";
import { BabySynth, DadSynth } from "./Synths.ts"
import { midi, hasMidiPerms } from './Midi.ts'

const volumeSlider = document.getElementById('volume') as HTMLInputElement;
const tiltSlider = document.getElementById('tilt') as HTMLInputElement;
const lfoSlider = document.getElementById('lfo') as HTMLInputElement;
const qualitySlider = document.getElementById('quality') as HTMLInputElement;

const modeSwitcher = document.getElementById('mode') as HTMLInputElement;

function log(v) {
    console.log(v)
    return v
}

let MIDI: MIDIAccess | undefined = undefined
let IS_MIDI_SETUP: boolean = false
let DAD_MODE = false

async function requestMidiPerms() {
    return navigator.requestMIDIAccess().then(
        (midi) => { MIDI = midi; },
        () => { console.error("failed to get midi perms") },
    );
}


const dadSynth = new DadSynth({
    initialVolume: parseFloat(volumeSlider.value),
    initialTilt: parseFloat(tiltSlider.value),
    initialQuality: parseFloat(qualitySlider.value),
    initialLFO: parseFloat(lfoSlider.value),
})

function onMidiHandler(e) {
    const [status, noteNumber, velocity_] = event.data;

    const command = status & 0xF0;
    if (command === 0x90) {
        dadSynth.playNote(noteNumber)
    } else {
        dadSynth.stopNote(noteNumber)
    }

}

modeSwitcher.addEventListener('change', async (e) => {
    await requestMidiPerms()
    const checked = e.target.checked
    if (checked && MIDI != undefined && !IS_MIDI_SETUP) {
        console.log("handler")
        DAD_MODE = true;
        dadSynth.start()
        MIDI.inputs.forEach((entry) => {
            entry.onmidimessage = onMidiHandler;
        });
    } else if (MIDI != undefined) {
        console.log("Trying to remove handler")
        DAD_MODE = true;
        dadSynth.stop()
        MIDI.inputs.forEach((entry) => {
            entry.onmidimessage = null;
        });
    }
})

// SET UP THE NODES

const babySynth = new BabySynth({
    initialVolume: parseFloat(volumeSlider.value),
    initialLFO: parseFloat(lfoSlider.value),
    initialTilt: parseFloat(tiltSlider.value),
})
const analyzer = babySynth.analyzer()

const canvas = document.getElementById('spectrum') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d')!;

function drawSpectrum() {
    requestAnimationFrame(drawSpectrum);
    const values = analyzer.getValue();
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    canvasContext.beginPath();
    canvasContext.moveTo(0, canvas.height);

    values.forEach((value, index) => {
        const x = (index / values.length) * canvas.width;
        const y = (1 - ((value as number) + 140) / 140) * canvas.height; // Adjust for dB range
        canvasContext.lineTo(x, y);
    });

    canvasContext.lineTo(canvas.width, canvas.height);
    canvasContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
    canvasContext.fill();
}

drawSpectrum();

let isPlaying = false;

// Function to toggle play/pause
function togglePlayPause() {
    if (DAD_MODE) {
        babySynth.stop();
        const note = Math.floor((Math.random() * 50) + 50)
        dadSynth.playNote(note)
        setTimeout(() => { dadSynth.stopNote(note) }, 2000)
        return
    }

    if (isPlaying) {
        babySynth.stop();
        playPauseButton.textContent = "Play";
    } else {
        babySynth.start();
        playPauseButton.textContent = "Pause";
    }
    isPlaying = !isPlaying;
}

const playPauseButton = document.getElementById('playPause') as HTMLButtonElement;
playPauseButton.addEventListener('pointerdown', togglePlayPause);

// Function to update synth parameters
function updateSynthParameter(param: string, value: number) {
    switch (param) {
        case 'volume':
            babySynth.setVolume(value)
            dadSynth.setVolume(value)
            break;
        case 'tilt':
            babySynth.setTilt(value)
            dadSynth.setTilt(value)
            break;
        case 'lfo':
            babySynth.setLFO(value)
            dadSynth.setLFO(value)
            break;
        case 'quality':
            babySynth.setQuality(value)
            dadSynth.setQuality(value)
            break;
    }
}

// Add event listeners to sliders
volumeSlider.addEventListener('input', (event) => {
    const value = parseFloat(volumeSlider.value);
    updateSynthParameter('volume', value);
});

tiltSlider.addEventListener('input', (event) => {
    const value = parseFloat(tiltSlider.value);
    updateSynthParameter('tilt', value);
});

lfoSlider.addEventListener('input', (event) => {
    const value = parseFloat(lfoSlider.value);
    updateSynthParameter('lfo', value);
});

qualitySlider.addEventListener('input', (event) => {
    const value = parseFloat(qualitySlider.value);
    updateSynthParameter('quality', value);
});
