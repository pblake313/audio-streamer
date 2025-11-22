<script lang="ts">
  import TrashIcon from "../svg/Icons/TrashIcon.svelte";


</script>

<button class="remoBut" on:click>
    <div class="removeFlex">
        <TrashIcon></TrashIcon>
        <p style="margin: 0px; padding: 0px; margin-left: 5px;"><slot></slot></p>
    </div>
</button>


<style>
    .remoBut {
        background-color: transparent;
        border: none;
        border-radius: 5px;
        padding: 5px 15px;
        border: 1px solid #404040;
        opacity: .9;
        transition: .3s;
    }
    .remoBut:hover {
        background-color: rgba(211, 211, 211, 0.286);
        cursor: pointer;
        opacity: 1;
    }
    .removeFlex {
        display: flex;
        align-items: center;
    }
</style>