<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { audioPlayerState, audioStore } from '../../stores/AudioPlayerStore';
  import { get } from 'svelte/store';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let imageCanvas: HTMLCanvasElement;
  let averageColor = '';

  let avgR = 50, avgG = 50, avgB = 50;

  let bumpStart = 0;
  let bumpDirection = 1;
  let bumpSpeed = 0.3;
  let bumpAccumulator = 0;

  let baseHeightPhase = 0;
  let baseHeightOffsets: number[] = [];
  let animatedHeights: number[] = [];

  export let imageUrl: string | null = null;

  function getAverageColor(target: EventTarget | null) {
    const imgEl = target as HTMLImageElement;
    if (!imgEl || !imageCanvas) return;

    const tempCtx = imageCanvas.getContext('2d');
    if (!tempCtx) return;

    imageCanvas.width = imgEl.naturalWidth;
    imageCanvas.height = imgEl.naturalHeight;

    try {
      tempCtx.drawImage(imgEl, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, imgEl.naturalWidth, imgEl.naturalHeight);
      const data = imageData.data;

      let r = 0, g = 0, b = 0;
      const length = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      avgR = Math.floor(r / length);
      avgG = Math.floor(g / length);
      avgB = Math.floor(b / length);

      averageColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
    } catch (error) {
      console.error('Canvas tainted — image may not have proper CORS headers.', error);
    }
  }

  function resizeCanvas() {
    if (canvas) {
      canvas.width = canvas.offsetWidth;
    }
  }

  let audioContext: AudioContext;
  let analyser: AnalyserNode;
  let dataArray: Uint8Array;
  let source: MediaElementAudioSourceNode;
  let animationFrameId: number;

  onMount(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const audio = get(audioStore);
    if (!audio) return;

    // Use a TypeScript-friendly approach for older browsers
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('AudioContext is not supported in this browser');
    }

    // Reuse the AudioContext if it already exists on the audio element.
    if (!(audio as any).__audioContext) {
      (audio as any).__audioContext = new AudioContextClass();
    }
    audioContext = (audio as any).__audioContext;

    // Reuse or create the MediaElementSource with the same audioContext.
    if (!(audio as any).__mediaElementSource) {
      (audio as any).__mediaElementSource = audioContext.createMediaElementSource(audio);
    }
    source = (audio as any).__mediaElementSource;

    // Ensure the audio element is connected to the destination for playback only once.
    if (!(audio as any).__playbackConnected) {
      source.connect(audioContext.destination);
      (audio as any).__playbackConnected = true;
    }

    // Create a new analyser node for this visualizer instance.
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    baseHeightOffsets = Array.from({ length: bufferLength }, () => Math.random() * Math.PI * 2);
    animatedHeights = new Array(bufferLength).fill(0);

    // Connect the source to the analyser for visualization.
    source.connect(analyser);

    // Resume audio context on first user interaction if needed.
    document.addEventListener(
      'click',
      () => {
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }
      },
      { once: true }
    );

    if (canvas) {
      ctx = canvas.getContext('2d');
    }

    const draw = async () => {
      animationFrameId = requestAnimationFrame(draw);
      if (!ctx || !canvas) return;

      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / dataArray.length;
      const totalBars = Math.floor(canvas.width / (barWidth + 1));

      baseHeightPhase += 0.05;
      let x = 0;
      let hasVisual = false;

      for (let i = 0; i < totalBars; i++) {
        const phaseOffset = baseHeightOffsets[i % baseHeightOffsets.length];
        const osc = (Math.sin(baseHeightPhase + phaseOffset) + 1) / 2;
        const baseHeight = canvas.height * (0.05 + osc * 0.02);

        let targetHeight = dataArray[i] / 1.5;
        if (i < 10) {
          const percent = i / 9;
          const scale = 0.55 + (1 - 0.55) * percent;
          targetHeight *= scale;
        }

        // Use baseHeight if audio is very quiet or if the player is paused/idle.
        if (targetHeight < baseHeight || $audioPlayerState === 'Paused' || $audioPlayerState === 'Idle') {
          targetHeight = baseHeight;
        } else {
          hasVisual = true;
        }

        // Smooth animation.
        const speed = 0.1;
        animatedHeights[i] += (targetHeight - animatedHeights[i]) * speed;

        const r = Math.min(avgR + animatedHeights[i] / 2, 255);
        const g = Math.min(avgG + animatedHeights[i] / 2, 255);
        const b = Math.min(avgB + animatedHeights[i] / 2, 255);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, canvas.height - animatedHeights[i], barWidth, animatedHeights[i]);
        x += barWidth + 1;
      }

      await tick();

      const shouldShowBump =
        !hasVisual &&
        ($audioPlayerState === 'Paused' ||
          $audioPlayerState === 'Idle' ||
          $audioPlayerState === 'Ended');
      if (shouldShowBump) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bumpWidth = 25;
        const bumpHeightMultiplier = 0.3;
        const bumpEdgeFade = 10;
        x = 0;

        for (let i = 0; i < totalBars; i++) {
          const phaseOffset = baseHeightOffsets[i % baseHeightOffsets.length];
          const osc = (Math.sin(baseHeightPhase + phaseOffset) + 1) / 2;
          const baseHeight = canvas.height * (0.05 + osc * 0.02);

          let barHeight = baseHeight;

          if (i >= bumpStart && i < bumpStart + bumpWidth) {
            const bumpCenterHeight = canvas.height * (0.12 + osc * bumpHeightMultiplier);
            const indexInBump = i - bumpStart;

            let fadeFactor = 1;
            if (indexInBump < bumpEdgeFade) {
              fadeFactor = indexInBump / bumpEdgeFade;
            } else if (indexInBump >= bumpWidth - bumpEdgeFade) {
              fadeFactor = (bumpWidth - indexInBump - 1) / bumpEdgeFade;
            }

            fadeFactor = Math.max(0, Math.min(1, fadeFactor));
            barHeight = baseHeight + (bumpCenterHeight - baseHeight) * fadeFactor;
          }

          animatedHeights[i] += (barHeight - animatedHeights[i]) * 0.1;

          ctx.fillStyle = `rgba(${avgR}, ${avgG}, ${avgB}, 0.6)`;
          ctx.fillRect(x, canvas.height - animatedHeights[i], barWidth, animatedHeights[i]);
          x += barWidth + 1;
        }

        bumpAccumulator += bumpSpeed;
        if (bumpAccumulator >= 1) {
          bumpStart += bumpDirection;
          bumpAccumulator = 0;

          if (bumpStart + bumpWidth >= totalBars) {
            bumpStart = totalBars - bumpWidth;
            bumpDirection = -1;
          } else if (bumpStart <= 0) {
            bumpStart = 0;
            bumpDirection = 1;
          }
        }
      }
    };

    draw();

    return () => {
      // Cancel the animation loop.
      cancelAnimationFrame(animationFrameId);
      // Disconnect the visualizer branch only.
      try {
        source.disconnect(analyser);
      } catch (err) {
        console.error('Error during disconnect:', err);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  });
</script>

<div>
  <canvas
    bind:this={canvas}
    height="150"
    style="width: 100%; display: block; border-radius: 2px;"
  ></canvas>
</div>

{#if imageUrl}
  <img
    src={imageUrl}
    alt="EQ"
    crossorigin="anonymous"
    style="height: 100px; display: none;"
    on:load={(e) => getAverageColor(e.target)}
  />
{/if}
<canvas bind:this={imageCanvas} width="1" height="1" style="display: none;"></canvas>
