import * as Tone from "tone";


export interface TiltEQOptions {
  pivot?: number; // Frequency in Hz (default 1000)
  gain?: number;  // Gain in dB (default 0)
}

export class TiltEQ {
  private lowShelf: Tone.Filter;
  private highShelf: Tone.Filter;

  public input: Tone.Gain;
  public output: Tone.Gain;

  constructor(pivot = 1000, gainDb = 0) {
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
const tilt = new TiltEQ({pivot: 1000, gainDb: 4})

synth.connect(tilt.input)
tilt.output.toDestination();

const analyzer = new Tone.Analyser("fft", 1024);
tilt.output.connect(analyzer);

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
            // Logarithmic mapping: 0-100 to 0 to -60
            const minVolume = -60;
            const maxVolume = 0;
            const logValue = Math.log10(value + 1) / 2; // Scale log value to 0-1
            synth.volume.value = minVolume + (maxVolume - minVolume) * logValue;
        case 'detune':
            tilt.setGain((-value / 100) * 20)
            break;
        case 'attack':
            // Logarithmic mapping: 0-100 to 30 to 20000 Hz
            const minFreq = 40;
            const maxFreq = 20000;
            const logFreq = minFreq * Math.pow(maxFreq / minFreq, value / 100);
            console.log(logFreq)
            tilt.setPivot(logFreq);
            break;
        case 'release':
            synth.envelope.release = value / 100; // Map 0-100 to 0-1
            break;
    }
}

// Add event listeners to sliders
document.getElementById('volume')?.addEventListener('input', (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    updateSynthParameter('volume', value);
});

document.getElementById('detune')?.addEventListener('input', (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    updateSynthParameter('detune', value);
});

document.getElementById('attack')?.addEventListener('input', (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    updateSynthParameter('attack', value);
});

document.getElementById('release')?.addEventListener('input', (event) => {
    const value = parseFloat((event.target as HTMLInputElement).value);
    updateSynthParameter('release', value);
});
