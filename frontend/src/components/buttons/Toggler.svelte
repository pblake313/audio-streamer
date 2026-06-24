<script lang="ts">
  import DesktopIcon from "../Icons/svg/DesktopIcon.svelte";
  import MobileIcon from "../Icons/svg/MobileIcon.svelte";

  export let value: "desktop" | "mobile" = "desktop";
  // callback prop pattern
  export let onToggle: ((val: "desktop" | "mobile") => void) | undefined;

  function handleToggle(newValue: "desktop" | "mobile") {
    if (newValue !== value) {
      value = newValue;
      onToggle?.(value); // call parent callback
    }
  }
</script>

<style>
  .pill {
    position: relative;
    width: 95px;
    height: 32px;
    background: #222222;
    border-radius: 9999px;
    border: 1px solid rgba(211, 211, 211, 0.226);
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
  }

  .segbtn {
    appearance: none;
    border: 0;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    cursor: pointer;
    z-index: 2;
  }

  .segbtn:focus-visible {
    outline: 2px solid #6b7280;
    outline-offset: 2px;
    border-radius: 9999px;
  }

  .segbtn :global(svg) {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .segbtn[aria-pressed="true"] :global(svg) {
    transform: scale(1.05);
  }

  .indicator {
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc(50% - 6px);
    height: calc(100% - 6px);
    background: #f7f7f7;
    border-radius: 9999px;
    transition: transform 0.25s ease;
    z-index: 1;
  }

  .indicator.desktop {
    transform: translateX(0);
  }

  .indicator.mobile {
    transform: translateX(calc(100% + 6px));
  }
</style>

<div class="pill" role="group" aria-label="View mode">
  <div class="indicator {value}" aria-hidden="true"></div>

  <button
    type="button"
    class="segbtn"
    aria-pressed={value === "desktop"}
    on:click={() => handleToggle("desktop")}
    title="Desktop"
  >
    <DesktopIcon color={value === "desktop" ? "#222222" : "#f7f7f7"} />
  </button>

  <button
    type="button"
    class="segbtn"
    aria-pressed={value === "mobile"}
    on:click={() => handleToggle("mobile")}
    title="Mobile"
  >
    <MobileIcon color={value === "mobile" ? "#222222" : "#f7f7f7"} />
  </button>
</div>
