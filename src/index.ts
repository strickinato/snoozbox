import * as Tone from "tone";


export interface TiltEQOptions {
  pivot?: number; // Frequency in Hz (default 1000)
  gain?: number;  // Gain in dB (default 0)
}

export class TiltEQ {
  private low: Tone.Filter;
  private high: Tone.Filter;
  private pivot: number;
  private gain: number;

  public input: Tone.Gain;
  public output: Tone.Gain;

  constructor({ pivot = 1000,gain = 0 }: TiltEQOptions = {}) {
    this.pivot = pivot;
    this.gain = gain;

    this.low = new Tone.Filter({
      type: "lowshelf",
      frequency: this.pivot,
      gain: this.gain,
    });

    this.high = new Tone.Filter({
      type: "highshelf",
      frequency: this.pivot,
      gain: -this.gain,
    });

    this.input = new Tone.Gain();
    this.output = new Tone.Gain();

    // Connect in parallel
    this.input.connect(this.low);
    this.input.connect(this.high);

    // Merge filtered signals to output
    this.low.connect(this.output);
    this.high.connect(this.output);
  }

  /**
   * Connect the TiltEQ output to a Tone AudioNode or AudioDestination
   */
  connect(destination: Tone.InputNode | AudioNode): void {
    this.output.connect(destination);
  }

  /**
   * Disconnect the TiltEQ output
   */
  disconnect(): void {
    this.output.disconnect();
  }

  /**
   * Set the tilt gain (positive = brighter, negative = warmer)
   */
  setGain(gain: number): void {
      console.log(gain)
    this.gain = gain;
    this.low.set({ gain: this.gain });
    this.high.set({ gain: -this.gain });
  }

  /**
   * Set the pivot frequency (Hz)
   */
  setPivot(freq: number): void {
    this.pivot = freq;
    this.low.set({ frequency: this.pivot });
    this.high.set({ frequency: this.pivot });
  }
}

// Example usage of Tone.js
// Create a white noise synth
const synth = new Tone.Noise("white");
const tilt = new TiltEQ({pivot: 1000, gain: -4})

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
            tilt.setGain((value / 100) * 20)
            break;
        case 'attack':
            synth.envelope.attack = value / 100; // Map 0-100 to 0-1
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
