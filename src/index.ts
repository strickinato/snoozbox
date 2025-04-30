import * as Tone from "tone";

console.log("Hello, World!");

// Example usage of Tone.js
// Create a white noise synth
const synth = new Tone.Noise("white");
const lowShelf = new Tone.Filter({
    type: "lowshelf",
    frequency: 500,   // low shelf pivot
    gain: 0
});

const highShelf = new Tone.Filter({
    type: "highshelf",
    frequency: 2000,  // high shelf pivot
    gain: 0
}).toDestination();

synth.chain(lowShelf, highShelf);

const analyzer = new Tone.Analyser("fft", 1024);
highShelf.connect(analyzer);

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
function setMorph(morph: number) {
    // Clamp morph to [0, 1]
    morph = Math.max(0, Math.min(1, morph));

    // Map morph to tilt in dB:
    // 0 = 0 dB (white), 0.5 = -3 dB (pink), 1 = -6 dB (brown)
    const maxTilt = -6; // maximum tilt (in dB)
    const tilt = morph * maxTilt;

    // Set shelves symmetrically
    lowShelf.gain.value = -tilt; // low shelf boosted when tilt is negative
    highShelf.gain.value = tilt; // high shelf cut when tilt is negative
}
        case 'detune':
            setMorph(value / 100); // Map 0-100 to 0.0-1.0 for morph
            break;
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
