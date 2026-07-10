<script lang="ts">
    import "./ManageBeatListItem.css";
    import type { Beat } from "../../../lib/types/Beats";
    import AlbumArtwork from "../../UI/AlbumArtwork.svelte";
    export let beat: Beat;

</script>

<!-- Desktop Grid Item -->
<a
    href="/portal/edit-beat/{beat.id}"
    class="adwrapbeat"
>

    <AlbumArtwork width={'100%'} imageUrl={beat.artworkUrl}/>

    <p class="mbli_title">{beat.beatTitle}</p>

</a>

