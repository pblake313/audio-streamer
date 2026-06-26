<script lang="ts">
  export let color: string = "#1b1b1b";
  export let size: number = 2;
  export let status: "idle" | "playing" = "playing";

  // snap width to whole pixels
  $: px = Math.max(2, Math.round(size));

  // generate per-bar randomness ONCE
  const bars = Array.from({ length: 4 }, () => ({
    speed: (Math.random() * 0.25 + 0.25).toFixed(2), // 0.25–0.5s
    min: (Math.random() * 0.3 + 0.15).toFixed(2),   // scaleY min
    max: (Math.random() * 0.4 + 0.6).toFixed(2),    // scaleY max
    delay: (Math.random() * 0.2).toFixed(2),
  }));
</script>

<span
  class="eq {status}"
  style="--color:{color}; --w:{px}px;"
  aria-hidden="true"
>
  {#each bars as bar}
    <span
      class="bar"
      style="
        --speed:{bar.speed}s;
        --min:{bar.min};
        --max:{bar.max};
        --delay:{bar.delay}s;
      "
    ></span>
  {/each}
</span>

<style>
  .eq {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;
    height: calc(var(--w) * 5);
    transform: translateZ(0);
    backface-visibility: hidden;
  }

  .bar {
    width: var(--w);
    height: calc(var(--w) * 5);
    background: var(--color);
    border-radius: calc(var(--w) / 2);
    transform-origin: bottom;
    will-change: transform, height;
    transition: height 0.25s ease;
  }

  /* ───────── PLAYING ───────── */

  .eq.playing .bar {
    animation: eq var(--speed) ease-in-out infinite alternate;
    animation-delay: var(--delay);
  }

  /* ───────── IDLE ───────── */

  .eq.idle .bar {
    animation: none;
    height: calc(var(--w) * 1.5);
    transform: scaleY(1);
  }

  @keyframes eq {
    from { transform: scaleY(var(--min)); }
    to   { transform: scaleY(var(--max)); }
  }
</style>
