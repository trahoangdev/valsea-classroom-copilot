import { downsampleBuffer } from "@/lib/classroom/audio/resample";
import { floatTo16BitPCM, pcm16ToBase64 } from "@/lib/classroom/audio/pcm16";

const TARGET_RATE = 16_000;

export type AudioCapture = {
  stop: () => void;
};

export async function startAudioCapture(
  onChunk: (base64Pcm16: string) => void,
  onError: (message: string) => void
): Promise<AudioCapture> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });
  } catch {
    onError("Không lấy được quyền microphone.");
    return { stop: () => {} };
  }

  const ctx = new AudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  const source = ctx.createMediaStreamSource(stream);
  const bufferSize = 4096;
  const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
  const mute = ctx.createGain();
  mute.gain.value = 0;

  processor.onaudioprocess = (ev) => {
    const input = ev.inputBuffer.getChannelData(0);
    const down = downsampleBuffer(input, ctx.sampleRate, TARGET_RATE);
    const pcm = floatTo16BitPCM(down);
    const b64 = pcm16ToBase64(pcm);
    onChunk(b64);
  };

  source.connect(processor);
  processor.connect(mute);
  mute.connect(ctx.destination);

  return {
    stop: () => {
      processor.onaudioprocess = null;
      try {
        processor.disconnect();
        mute.disconnect();
        source.disconnect();
      } catch {
        /* ignore */
      }
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
    },
  };
}
