<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import PlayPauseButton from '../buttons/music/PlayPauseButton.svelte';
    import AudioLoader from './Loaders/AudioLoader.svelte';

  /** Props **/
  export let audioUrl: string;
  export let barWidth = 2;
  export let barGap = 1;
  export let height = 50;
  export let showTime = true;

  /** Internal state **/
  let canvasEl: HTMLCanvasElement;
  let audioEl: HTMLAudioElement;
  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;

  let rawData: Float32Array;
  let resizeObserver: ResizeObserver | null = null;

  let barCount = 0;
  let peaks: number[] = [];

  // loading flag
  let isLoadingWaveform = true;

  function formatTime(t: number) {
    const m = Math.floor(t / 60);
    const s = String(Math.floor(t % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }

  function drawWaveform(progress = 0) {
    if (!canvasEl || !peaks.length) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const cssWidth = canvasEl.clientWidth;
    ctx.clearRect(0, 0, cssWidth, height);

    // base bars
    ctx.fillStyle = '#505050';
    peaks.forEach((p, i) => {
      const h = p * height;
      const x = i * (barWidth + barGap);
      const y = (height - h) / 2;
      ctx.fillRect(x, y, barWidth, h);
    });

    // played overlay
    const playedW = cssWidth * progress;
    if (playedW > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, playedW, height);
      ctx.clip();
      ctx.fillStyle = '#b8b8b8';
      peaks.forEach((p, i) => {
        const h = p * height;
        const x = i * (barWidth + barGap);
        const y = (height - h) / 2;
        ctx.fillRect(x, y, barWidth, h);
      });
      ctx.restore();
    }
  }

  function computePeaks() {
    if (!canvasEl || !rawData) return;

    const cssW = canvasEl.clientWidth || 1;
    barCount = Math.floor((cssW + barGap) / (barWidth + barGap)) || 1;

    const blockSize = Math.floor(rawData.length / barCount) || 1;
    peaks = [];

    for (let i = 0; i < barCount; i++) {
      let peak = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, rawData.length);
      for (let j = start; j < end; j++) {
        peak = Math.max(peak, Math.abs(rawData[j]));
      }
      peaks.push(peak);
    }
  }

  function resizeCanvas() {
    if (!canvasEl) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvasEl.clientWidth || 0;

    canvasEl.width = cssWidth * dpr;
    canvasEl.height = height * dpr;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    computePeaks();
    const progress = audioEl ? audioEl.currentTime / Math.max(1, duration) : 0;
    drawWaveform(progress);
  }

  function seek(event: MouseEvent) {
    if (!canvasEl || !audioEl || isLoadingWaveform) return;

    const { left, width } = canvasEl.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (event.clientX - left) / width));

    audioEl.currentTime = pct * audioEl.duration;

    if (!isPlaying) {
      audioEl.play();
      isPlaying = true;
    }

    drawWaveform(pct);
  }

  function togglePlayPause() {
    if (!audioEl) return;
    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
    isPlaying = !isPlaying;
  }

  onMount(async () => {
    await tick(); // ensure canvasEl & audioEl are bound

    isLoadingWaveform = true;

    try {
      const resp = await fetch(audioUrl);
      const buf = await resp.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(buf);
      rawData = audioBuffer.getChannelData(0);

      resizeObserver = new ResizeObserver(() => resizeCanvas());
      resizeObserver.observe(canvasEl);

      resizeCanvas();

      audioEl.addEventListener('ended', () => {
        isPlaying = false;
        audioEl.currentTime = 0;
        currentTime = 0;
        drawWaveform(0);
      });

      function animate() {
        if (!isLoadingWaveform && canvasEl && audioEl) {
          drawWaveform(audioEl.currentTime / Math.max(1, duration));
        }
        requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
    } catch (err) {
      console.error('Error loading waveform', err);
      // could set an error message state here if you want
    } finally {
      isLoadingWaveform = false;
    }
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
  });
</script>

<style>
  .wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .sampleAndTime {
    width: calc(100% - 75px);
    padding-top: 6px;
  }

  canvas {
    width: 100%;
    max-width: 1500px;
    background: transparent;
    cursor: pointer;
    display: block;
  }

  .timeFlex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 0.9rem;
    margin-top: 4px;
  }
  .miniForLoad{
    height: 5px;
    overflow: hidden;
  }
</style>

<div class="wrapper">
  <PlayPauseButton
    playOrPause={isPlaying ? 'pause' : 'play'}
    on:togglePlayPause={togglePlayPause}
    playIconHeight="20px"
    pauseIconHeight="20px"
    color={'#b8b8b8'}
  />

  <div class="sampleAndTime" class:miniForLoad={isLoadingWaveform}>
    {#if isLoadingWaveform}
            <AudioLoader height={'2px'} backgroundColor={'#222222'}></AudioLoader>
    {/if}

    <canvas
      bind:this={canvasEl}
      height={height}
      on:click={seek}
      style={isLoadingWaveform ? 'opacity:0.3; pointer-events:none;' : ''}
    ></canvas>

    {#if showTime}
      <div class="timeFlex">
        <p>{formatTime(currentTime)}</p>
        <p>{formatTime(duration)}</p>
      </div>
    {/if}
  </div>

  <audio
    bind:this={audioEl}
    src={audioUrl}
    on:loadedmetadata={() => (duration = audioEl.duration)}
    on:timeupdate={() => (currentTime = audioEl.currentTime)}
    style="display: none;"
  ></audio>
</div>
