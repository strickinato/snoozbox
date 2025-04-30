import * as Tone from "tone";

console.log("Hello, World!");

// Example usage of Tone.js
// Create a white noise synth
const synth = new Tone.Noise("white");
const tiltFilter = new Tone.Filter({
    type: "lowshelf",
    frequency: 1000,
    gain: 0
}).toDestination();

synth.connect(tiltFilter);

const analyzer = new Tone.Analyser("fft", 256);
tiltFilter.connect(analyzer);

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
        const y = (1 - (value as number) / 100) * canvas.height;
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
            break;
        case 'detune': {
            // Map 0-100 to -20 to 20 dB for the tilt filter gain
            const gainValue = (value / 100) * 40 - 20;
            tiltFilter.gain.value = gainValue;
            break;
        }
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
