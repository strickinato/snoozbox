export let hasMidiPerms = false;
export let midi = undefined

export const requestMidiPerms = () => {
    navigator.requestMIDIAccess().then(
        (midi) => { hasMidiPerms = true; midi = midi; },
        () => { console.error("failed to get midi perms") },
    );
}
