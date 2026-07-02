<script lang="ts">
    import "./BeatTag.css";

    export let tagColor: string = "#353535";
    export let tagTextColor: string = "#f7f7f7";
    export let tagText: string;

    export let isActive: boolean = false;

    $: hasCustomTagColor = tagColor !== "#353535";
</script>

<button
    type="button"
    class="beatTagWrapper"
    class:beatTag_active={isActive}
    class:beatTag_activeColor={isActive && hasCustomTagColor}
    style="--tag-color: {tagColor}; --tag-text-color: {tagTextColor};"
    on:click
>
    <p class="tagText">{tagText}</p>
</button>