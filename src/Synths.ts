import * as Tone from 'tone'

import { TiltEQ } from "./TiltEQ.js"

const PIVOT_FREQ = 1000

export class BabySynth {
    synth: any
    lfo: any
    tilt: any
    bandpassFilter: any
    crossFade: any
    outputGain: any

    constructor(opts) {
        this.synth = new Tone.Noise("white");
        this.crossFade = new Tone.CrossFade(0.5); // Initial mix value
        this.bandpassFilter = new Tone.Filter({
            type: "bandpass",
            frequency: 1000, // Default frequency
            Q: 2 // Quality factor
        });

        this.tilt = new TiltEQ({
            pivot: PIVOT_FREQ,
            gainDb: this.mapTilt(opts.initialTilt),
        })

        this.lfo = new Tone.LFO({
            frequency: this.mapLFO(opts.initialLFO),
            min: 50,
            max: 10000
        });

        this.outputGain = new Tone.Gain(this.mapVolume(opts.initialVolume))

        this.synth.connect(this.bandpassFilter)
        this.synth.connect(this.crossFade.a)
        this.bandpassFilter.connect(this.crossFade.b);
        this.crossFade.connect(this.tilt.input)
        this.tilt.output.connect(this.outputGain)
        this.outputGain.connect(Tone.Destination);

        this.lfo.connect(this.bandpassFilter.frequency);

    }

    start() {
        this.lfo.start()
        this.synth.start()
    }

    stop() {
        this.lfo.stop()
        this.synth.stop()
    }

    analyzer() {
        const analyzer = new Tone.Analyser("fft", 1024);
        this.outputGain.connect(analyzer);
        return analyzer
    }

    setVolume(value: number): void {
        this.outputGain.gain.value = this.mapVolume(value)
    }

    setTilt(value: number): void {
        this.tilt.setGain(this.mapTilt(value))
    }

    setLFO(value: number): void {
        this.lfo.frequency.value = this.mapLFO(value)
    }

    setQuality(value: number): void {
        this.bandpassFilter.Q.value = 2
        this.bandpassFilter.gain.value = 1 + (value / 20)
        this.crossFade.fade.value = (value / 100)
    }

    mapVolume(value: number): number {
        return value/100
    }

    mapLFO(value: number): number {
        // Non-linear scaling for LFO frequency
        const minLFOFreq = 0.01;
        const midLFOFreq = 0.05;
        const maxLFOFreq = 500;
        const scaledValue = value / 100; // Normalize to 0-1
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

    mapTilt(value: number): number {
        return -(value / 100) * 20
    }
}

export class DadSynth {
    noise: any
    env: any
    osc: any
    bandpassFilter: any
    outputGain: any
    oscEnv: any
    oscGain: any
    noiseGain: any
    lfoStopped: boolean
    distortion: any
    lfo: any


    constructor(opts) {
        this.noise = new Tone.Noise("white")
        this.osc = new Tone.Oscillator(500, "sine").start()
        this.oscEnv = new Tone.AmplitudeEnvelope();
        this.oscGain = new Tone.Gain(0)
        this.noiseGain = new Tone.Gain(1)

        // Still unssure about LFO
        this.lfo = new Tone.LFO({
            type: "sine",
            frequency: 1,
            min: 0.3,
            max: 0.7,
        });
        this.lfoStopped = false

        this.osc.connect(this.oscEnv)
        this.oscEnv.connect(this.oscGain)
        const depth = new Tone.Gain(5)
        this.noise.connect(depth)
        depth.connect(this.osc.frequency)

        this.env = new Tone.AmplitudeEnvelope()

        this.bandpassFilter = new Tone.Filter({
            type: "bandpass",
            Q: 20,
        });

        this.outputGain = new Tone.Gain()

        this.distortion = new Tone.Distortion({
            oversample: "2x", // "none", "2x", or "4x"
        })

        this.noise.connect(this.bandpassFilter)
        this.bandpassFilter.connect(this.env)
        this.env.connect(this.distortion)
        this.distortion.connect(this.noiseGain)

        this.oscGain.connect(this.outputGain)
        this.noiseGain.connect(this.outputGain)

        // STILL UNSURE ABOUT LFO
        // this.lfoGain = new Tone.Gain()
        // this.lfo.connect(this.lfoGain)
        // this.lfoGain.connect(this.bandpassFilter.frequency)

        this.outputGain.toDestination()

        this.setLFO(opts.initialLFO)
        this.setQuality(opts.initialQuality)
        this.setTilt(opts.initialTilt)
        this.setVolume(opts.initialVolume)
    }

    playNote(value) {
        const freq = Tone.Midi(value).toFrequency()
        this.bandpassFilter.frequency.value = freq
        this.osc.frequency.value = freq

        this.env.triggerAttack(Tone.now());
        this.oscEnv.triggerAttack(Tone.now());
    }

    stopNote(value) {
        this.env.triggerRelease(Tone.now());
        this.oscEnv.triggerRelease(Tone.now());
    }

    start() {
        Tone.start();
        this.lfo.start();
        this.noise.start()
        this.osc.start()
    }

    stop() {
        this.noise.stop()
        this.osc.stop()
    }

    analyzer() {
        const analyzer = new Tone.Analyser("fft", 1024);
        this.outputGain.connect(analyzer);
        return analyzer
    }

    setVolume(value: number): void {
        this.outputGain.gain.value = this.mapVolume(value)
    }

    setTilt(value: number): void {
        // This controls how much of the oscillator we fold into
        // the output signal
        //
        // The highest point is 50/50
        // We normalize the total output gain
        // And we also make the distortion stronger when there is
        // only noise
        const skew = 0.5;
        const skewed = Math.pow(this.mapTilt(value), skew);

        const maxAngle = Math.PI / 8;
        const angle = skewed * maxAngle;

        const noiseLevel = Math.cos(angle);
        const oscLevel = Math.sin(angle);

        this.distortion = 1 - ((0.2) + value/80)
        this.oscGain.gain.value = oscLevel
        this.noiseGain.gain.value = noiseLevel
    }

    setLFO(value: number): void {
        // Still not sure what to do
        // this.lfoGain.gain.value = value
        // if (value === 0) {
        //     this.lfo.frequency.value = this.mapLFO(value)
        //     this.lfo.stop()
        //     this.lfoStopped = true
        // } else {
        //     if (this.lfoStopped) {
        //         this.lfo.start()
        //     }
        // }
    }

    setQuality(value: number): void {
        // Quality changes the attack and release
        //
        // The higher the value, the more padlike
        // Also, as the value goes higher, we start to flatten out the Q to make it hazier
        const envelope = {
            attack: value/100,
            release: value/100*2,
        }
        this.env.set(envelope)
        this.oscEnv.set(envelope)

        const q = Math.floor((1-(value/100))*45 + 5)
        this.bandpassFilter.Q.value = q
    }

    mapVolume(value: number): number {
        return value/100*2
    }

    mapLFO(value: number): number {
        // Non-linear scaling for LFO frequency
        const minLFOFreq = 0.01;
        const midLFOFreq = 100;
        const maxLFOFreq = 2000;
        const scaledValue = value / 100; // Normalize to 0-1
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

    mapTilt(value: number): number {
        // Skew the mix so noise is generally louder
        return value / 100
    }
}
