<script lang="ts">
    import './BeatTag.css'

    export let tagColor: string = '#353535'

    export let tagTextColor: string = '#f7f7f7'
    export let tagText: string
</script>


<div class="beatTagWrapper" style="background-color: {tagColor};">
    <p class="tagText" style="color: {tagTextColor};">{tagText}</p>
</div>