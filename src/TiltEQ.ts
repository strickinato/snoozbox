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
