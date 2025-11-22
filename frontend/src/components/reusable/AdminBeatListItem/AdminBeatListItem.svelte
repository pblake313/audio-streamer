<script lang="ts">
    import './AdminBeatListItem.css'
    import { goto } from "$app/navigation";
    import type { Beat } from '../../../lib/types/Beats';
    import MoreIcon from '../../svg/Icons/MoreIcon.svelte';
    export let beat: Beat

    export let isEven:boolean = false

    function routeTo(beatId: string){
        goto(`/portal/edit-beat/${beatId}`)
    }


</script>

<!-- Desktop Grid Item -->
<button on:click={()=>{routeTo(beat.id)}} class="adwrapbeat">
    <div class="aworkwrap">
        <img class="artworkImage" src="{beat.artworkUrl}" alt="pattsway | {beat.beatTitle}">
    </div>
    <div class="admintrackerwrap">
        <div class="wrapT">
            <p class="adBeatTitle" style="color: white;">{beat.beatTitle}</p>
        </div>
    </div>
</button>


<!-- mobile Item -->
<button on:click={()=>{routeTo(beat.id)}} class="mobileAdWRap" class:evenItem={isEven == true}>
    <div class="aworkwrap" >
        <img class="artworkImage" src="{beat.artworkUrl}" alt="pattsway | {beat.beatTitle}">
    </div>
    <div class="rightSMobile" >
        <p>{beat.beatTitle}</p>
    </div>
    <div class="mobileMore">
        <MoreIcon></MoreIcon>
    </div>
</button>


