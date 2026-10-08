class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = new Float32Array(4096);
    this.offset = 0;
    this.sumSquares = 0;
    this.port.onmessage = ({ data }) => {
      if (data?.type !== 'flush') return;
      this.sendSamples();
      this.port.postMessage({ type: 'flushed' });
    };
  }

  sendSamples() {
    if (!this.offset) return;
    const samples = this.samples.slice(0, this.offset);
    const level = Math.min(1, Math.sqrt(this.sumSquares / this.offset) * 8);
    this.port.postMessage({ type: 'audio', samples: samples.buffer, level }, [samples.buffer]);
    this.offset = 0;
    this.sumSquares = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0] || [];
    const output = outputs[0] || [];
    const frames = input[0]?.length || 0;
    for (let index = 0; index < frames; index += 1) {
      let sample = 0;
      for (const channel of input) sample += channel[index] / input.length;
      this.samples[this.offset] = sample;
      this.sumSquares += sample * sample;
      this.offset += 1;
      if (this.offset === this.samples.length) this.sendSamples();
    }
    for (const channel of output) channel.fill(0);
    return true;
  }
}

registerProcessor('bala-audio-capture', AudioCaptureProcessor);
