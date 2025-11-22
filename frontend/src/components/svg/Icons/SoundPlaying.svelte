<script lang="ts">
    export let color: string = '#1b1b1b'; // Bar color
    export let size: number = 2; // Base size for bar width and height
  </script>
  
  <span 
    class="soundplaying" 
    style="--color: {color}; --size: {size}px;">
  </span>
  
  <style>
  .soundplaying {
    width: var(--size);
    height: calc(var(--size) * 5); /* Base height */
    display: block;
    margin: 0 auto;
    position: relative;
    border-radius: calc(var(--size) / 2);
    background: var(--color);
    box-sizing: border-box;
    animation: animsoundplaying 0.3s 0.3s linear infinite alternate;
    transform-origin: bottom; /* Anchor at the bottom */
  }
  
  .soundplaying::after,
  .soundplaying::before {
    content: '';
    box-sizing: border-box;
    width: var(--size);
    height: calc(var(--size) * 5); /* Base height */
    border-radius: calc(var(--size) / 2);
    background: var(--color);
    position: absolute;
    bottom: 0; /* Keep anchored at the bottom */
    transform-origin: bottom; /* Anchor animation at the bottom */
    animation: animsoundplaying 0.3s 0.45s linear infinite alternate;
  }
  
  .soundplaying::before {
    left: calc(var(--size) * -3); /* Space to the left */
    animation-delay: 0s;
  }
  
  .soundplaying::after {
    left: calc(var(--size) * 3); /* Space to the right */
    animation-delay: 0.15s; /* Slight delay for staggered effect */
  }
  
  @keyframes animsoundplaying {
    0% {
      transform: scaleY(0.3); /* Start small */
    }
    100% {
      transform: scaleY(1); /* Grow upwards */
    }
  }
  </style>
  