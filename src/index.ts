import * as Tone from "tone";

console.log("Hello, World!");

// Example usage of Tone.js
// Create a white noise synth
const synth = new Tone.Noise("white").toDestination();
synth.start();


// Function to update synth parameters
function updateSynthParameter(param: string, value: number) {
    switch (param) {
        case 'volume':
            synth.volume.value = value;
            break;
        case 'detune':
            synth.detune.value = value;
            break;
        case 'attack':
            synth.envelope.attack = value;
            break;
        case 'release':
            synth.envelope.release = value;
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
