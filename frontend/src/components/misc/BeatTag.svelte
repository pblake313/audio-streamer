<script lang="ts">
    import './BeatTag.css';

    export let tagColor: string = '#353535';
    export let tagTextColor: string = '#f7f7f7';
    export let tagText: string;
</script>

<div
    class="beatTagWrapper"
    style="--tag-color: {tagColor}; --tag-text-color: {tagTextColor};"
>
    <p class="tagText">{tagText}</p>
</div>