import * as Tone from "tone";

console.log("Hello, World!");

// Example usage of Tone.js
// Create a white noise synth
const synth = new Tone.Noise("white").toDestination();

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
            synth.volume.value = (value / 100) * -60; // Map 0-100 to -60 to 0
            break;
        case 'detune':
            synth.detune.value = (value / 100) * 2400 - 1200; // Map 0-100 to -1200 to 1200
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
