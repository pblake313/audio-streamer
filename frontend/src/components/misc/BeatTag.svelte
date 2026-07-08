<script lang="ts">
    import "./BeatTag.css";

    export let tagColor: string = "#353535";
    export let tagTextColor: string = "#f7f7f7";
    export let tagText: string;

    export let isActive: boolean = false;

    export let fontSize: string = "10pt";
    export let padding: string = "3px 6px 2px 6px";
    export let mobilePadding: string | null = null;

    $: hasCustomTagColor = tagColor !== "#353535";
</script>

<button
    type="button"
    class="beatTagWrapper"
    class:beatTag_active={isActive}
    class:beatTag_customColor={hasCustomTagColor}
    style="
        --tag-color: {tagColor};
        --tag-text-color: {tagTextColor};
        --tag-font-size: {fontSize};
        --tag-padding: {padding};
        --tag-mobile-padding: {mobilePadding ?? padding};
    "
    on:click
>
    <p class="tagText">{tagText}</p>
</button>