import * as Tone from "tone";
import { TiltEQ } from "./TiltEQ.ts"

const volumeSlider = document.getElementById('volume') as HTMLInputElement;
const tiltSlider = document.getElementById('tilt') as HTMLInputElement;
const lfoSlider = document.getElementById('lfo') as HTMLInputElement;
const qualitySlider = document.getElementById('quality') as HTMLInputElement;

const PIVOT_FREQ = 1000

function mapTiltValue(normal) {
    return -(normal / 100) * 20
}
const initialTiltValue = mapTiltValue(parseFloat(tiltSlider.value));

function mapVolumeValue(normal) {
    return normal / 100
}
const initialVolumeValue = mapVolumeValue(parseFloat(volumeSlider.value))

function mapLfoValue(normal) {
    // Non-linear scaling for LFO frequency
    const minLFOFreq = 0.005;
    const midLFOFreq = 0.05;
    const maxLFOFreq = 500;
    const scaledValue = normal / 100; // Normalize to 0-1
    let lfoFreq;
    if (scaledValue <= 0.5) {
        // Lower half: scale from minLFOFreq to midLFOFreq
        lfoFreq = minLFOFreq * Math.pow(midLFOFreq / minLFOFreq, scaledValue * 2);
    } else {
        // Upper half: scale from midLFOFreq to maxLFOFreq
        lfoFreq = midLFOFreq * Math.pow(maxLFOFreq / midLFOFreq, (scaledValue - 0.5) * 2);
    }
    return lfoFreq
}
const initialLfoValue = mapLfoValue(parseFloat(lfoSlider.value))

// SET UP THE NODES

const synth = new Tone.Noise("white");
const crossFade = new Tone.CrossFade(0.5); // Initial mix value
const bandpassFilter = new Tone.Filter({
    type: "bandpass",
    frequency: 1000, // Default frequency
    Q: 2 // Quality factor
});

const tilt = new TiltEQ({
    pivot: PIVOT_FREQ,
    gainDb: initialTiltValue,
})

const lfo = new Tone.LFO({
    frequency: initialLfoValue,
    min: 50,
    max: 10000
});

const outputGain = new Tone.Gain(initialVolumeValue)

synth.connect(bandpassFilter)
synth.connect(crossFade.a)
bandpassFilter.connect(crossFade.b);
crossFade.connect(tilt.input)
tilt.output.connect(outputGain)
outputGain.connect(Tone.Destination);

lfo.connect(bandpassFilter.frequency);

lfo.start();



function setBandpassMix(mix: number) {
  ; // mix should be between 0 (dry) and 1 (wet)
}



const analyzer = new Tone.Analyser("fft", 1024);
outputGain.connect(analyzer);

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
    if (isPlaying) {
        synth.stop();
        playPauseButton.textContent = "Play";
    } else {
        synth.start();
        playPauseButton.textContent = "Pause";
    }
    isPlaying = !isPlaying;
}

const playPauseButton = document.getElementById('playPause') as HTMLButtonElement;
playPauseButton.addEventListener('click', togglePlayPause);

// Function to update synth parameters
function updateSynthParameter(param: string, value: number) {
    switch (param) {
        case 'volume':
            outputGain.gain.value = mapVolumeValue(value)
        case 'tilt':
            tilt.setGain(mapTiltValue(value))
            break;
        case 'lfo':
            lfo.frequency.value = mapLfoValue(value)
            break;
        case 'quality':
            bandpassFilter.Q.value = value/50 + 1
            crossFade.fade.value = (value / 100)
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
