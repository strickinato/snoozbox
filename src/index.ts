import * as Tone from "tone";

const volumeSlider = document.getElementById('volume') as HTMLInputElement;
const tiltSlider = document.getElementById('detune') as HTMLInputElement;
const attackSlider = document.getElementById('attack') as HTMLInputElement;
const releaseSlider = document.getElementById('release') as HTMLInputElement;

const PIVOT_FREQ = 1000

function mapDetuneValue(normalized) {
    return (-normalized / 100) * 20
}

export interface TiltEQOptions {
  pivot?: number; // Frequency in Hz (default 1000)
  gain?: number;  // Gain in dB (default 0)
}

export class TiltEQ {
  private lowShelf: Tone.Filter;
  private highShelf: Tone.Filter;

  public input: Tone.Gain;
  public output: Tone.Gain;

  constructor({pivot, gainDb}) {
    const absGain = Math.abs(gainDb);

    this.lowShelf = new Tone.Filter({
      type: "lowshelf",
      frequency: pivot,
      gain: gainDb < 0 ? absGain : -absGain,
    });

    this.highShelf = new Tone.Filter({
      type: "highshelf",
      frequency: pivot,
      gain: gainDb,
    });

    this.input = new Tone.Gain();
    this.output = new Tone.Gain();

    // Serial chain (not parallel!)
    this.input.connect(this.lowShelf);
    this.lowShelf.connect(this.highShelf);
    this.highShelf.connect(this.output);
  }

  connect(dest: Tone.InputNode | AudioNode) {
    this.output.connect(dest);
  }

  setGain(gainDb: number) {
    const absGain = Math.abs(gainDb);

    this.lowShelf.set({
      gain: gainDb < 0 ? absGain : -absGain,
    });

    this.highShelf.set({
      gain: gainDb,
    });
  }

  setPivot(freqHz: number) {
    this.lowShelf.frequency.value = freqHz;
    this.highShelf.frequency.value = freqHz;
  }
}

// Example usage of Tone.js
// Create a white noise synth
const synth = new Tone.Noise("white");
const crossFade = new Tone.CrossFade(0.5); // Initial mix value
const bandpassFilter = new Tone.Filter({
    type: "bandpass",
    frequency: 1000, // Default frequency
    Q: 2 // Quality factor
});

const tilt = new TiltEQ({
    pivot: PIVOT_FREQ,
    gainDb: mapDetuneValue(tiltSlider.value)
})

const lfo = new Tone.LFO({
    frequency: 1, // LFO frequency in Hz
    min: 50,       // Minimum frequency of the bandpass filter
    max: 10000       // Maximum frequency of the bandpass filter
});

const outputGain = new Tone.Gain(0.5)

// Connect the LFO to the frequency of the bandpass filter

synth.connect(tilt.input)
const output = tilt.output
output.connect(bandpassFilter)
output.connect(crossFade.a);
bandpassFilter.connect(crossFade.b);

crossFade.connect(outputGain);
outputGain.connect(Tone.Destination);

lfo.connect(bandpassFilter.frequency);

lfo.start();

function setBandpassMix(mix: number) {
  crossFade.fade.value = mix; // mix should be between 0 (dry) and 1 (wet)
}



const analyzer = new Tone.Analyser("fft", 1024);
crossFade.connect(analyzer);

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
            outputGain.gain.value = value / 100

        case 'detune':
            tilt.setGain(mapDetuneValue(value))
            break;
        case 'attack':
            // Non-linear scaling for LFO frequency
            const minLFOFreq = 0.01;
            const midLFOFreq = 0.05;
            const maxLFOFreq = 10;
            const scaledValue = value / 100; // Normalize to 0-1
            const lfoFreq = minLFOFreq * Math.pow(midLFOFreq / minLFOFreq, 2 * (0.5 - Math.abs(0.5 - scaledValue))) * Math.pow(maxLFOFreq / midLFOFreq, scaledValue);
            console.log(lfoFreq)
            lfo.frequency.value = lfoFreq;
            break;
        case 'release':
            console.log("release", value/50 + 1)
            bandpassFilter.Q.value = value/50 + 1
            setBandpassMix(value / 100)
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
    updateSynthParameter('detune', value);
});

attackSlider.addEventListener('input', (event) => {
    const value = parseFloat(attackSlider.value);
    updateSynthParameter('attack', value);
});

releaseSlider.addEventListener('input', (event) => {
    const value = parseFloat(releaseSlider.value);
    updateSynthParameter('release', value);
});
