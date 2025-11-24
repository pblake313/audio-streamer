<script lang="ts">
    export let height = '20px';
    export let uid: string = `${new Date().getTime() + Math.random()}`;
    export let colorOne = '#f7f7f7';
    export let colorTwo = '#f7f7f7';
    export let colorThree = '#f7f7f7';
  
    // State to control the animation
    let isClicked = false;
  
    // Trigger animation
    const toggleAnimation = () => {
      isClicked = true;
    };
  
    // Reset animation after it ends
    const resetAnimation = () => {
      isClicked = false;
    };
  </script>
  
  <button
    id={uid}
    class="rewind-button"
    on:click={toggleAnimation}
    on:keydown={(event) => event.key === 'Enter' && toggleAnimation()}
    aria-label="Rewind"
  >
    <svg
      height={height}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 245.18 154.31"
      class:is-clicked={isClicked}
      role="img"
      on:animationend={resetAnimation}
    >
      <defs>
        <style>
          @keyframes annie {
            0% {
              opacity: 1;
              transform: translateX(0%);
            }
            50% {
              transform: translateX(100%);
            }
            100% {
              opacity: 1;
              transform: translateX(0%);
            }
          }

          @keyframes animateOne {
            0% {
              opacity: 1;
              transform: translateX(0%);
            }
            97% {
              transform: translateX(100%);
              opacity: 0
            }
  
            99% {
                transform: translateX(0%);
            }
            100% {
              opacity: 1;
            }
          }

          .is-clicked .cls-1 {
            animation: animateOne 0.5s forwards;

          }
  
          @keyframes animateTwo {
            0% {
              opacity: 1;
              transform: translateX(0%);
            }
            97% {
              transform: translateX(48%);
              opacity: 1

            }
            98% {
                opacity: 0
            }
            99% {
                transform: translateX(0%);
            }
            100% {
              opacity: 1;
            }
          }

          .is-clicked .cls-2 {
            animation: animateTwo 0.5s forwards;
          }
  
          @keyframes animateThree {
            0% {
              opacity: 0;
              transform: translateX(-48%);
            }
            97% {
              transform: translateX(0%);
              opacity: 1

            }
            98% {
                opacity: 0
            }
            99% {
                transform: translateX(0%);
            }
            100% {
              opacity: 1;
            }
          }

          .is-clicked .cls-3 {
            animation: animateThree 0.5s forwards;
          }
  


        </style>
      </defs>
      <path
        class="cls-3"
        fill={colorOne}
        d="m132.27,72.12L8.73.79C4.85-1.45,0,1.35,0,5.83v142.66c0,4.48,4.85,7.28,8.73,5.04l123.55-71.33c3.88-2.24,3.88-7.84,0-10.08Z"
      />
      <path
        class="cls-2"
        fill={colorTwo}
        d="m132.27,72.12L8.73.79C4.85-1.45,0,1.35,0,5.83v142.66c0,4.48,4.85,7.28,8.73,5.04l123.55-71.33c3.88-2.24,3.88-7.84,0-10.08Z"
      />
      <path
        class="cls-1"
        fill={colorThree}
        d="m242.27,72.12L118.73.79c-3.88-2.24-8.73.56-8.73,5.04v142.66c0,4.48,4.85,7.28,8.73,5.04l123.55-71.33c3.88-2.24,3.88-7.84,0-10.08Z"
      />
    </svg>
  </button>
  
  <style>
    .rewind-button {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .rewind-button:focus-visible {
      outline: 2px solid #000;
    }
  </style>
  