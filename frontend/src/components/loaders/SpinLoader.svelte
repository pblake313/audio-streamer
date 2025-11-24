
<script lang="ts">
    export let color: string = "cacaca"
    export let height: string = "30px"
</script>

<div class="loadWrap">
  <span class="loader" style="border-top: 1px solid #{color}; height: {height}; width: {height};"></span>
</div>

<style>
    .loader {
        border-radius: 50%;
        display: inline-block;
        border-right: 3px solid transparent;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    } 

    .loadWrap {
        display: flex;
        justify-content: space-evenly;
    }
</style>

