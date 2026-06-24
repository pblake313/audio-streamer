<script lang="ts">
    import { onMount } from "svelte";
    import { navStyle } from "../stores/navstore";
    import GitHubLink from "../components/links/GitHubLink.svelte";
    import RightArrowIcon from "../components/Icons/svg/RightArrowIcon.svelte";
    import { user } from "../stores/UserStore";
    import HighlightedTrack from "../components/standalone/HighlightedTrack.svelte";
    import TrackList from "../components/lists/TrackList/TrackList.svelte";

    import './Homepage.css'
    import Hero from "../components/feature-sections/Hero.svelte";
    import ProjectDetails from "../components/feature-sections/ProjectDetails.svelte";

    onMount(() => {
        navStyle.set({style: 'standard', capWidth:false, addLine: true})
    })

</script>


<svelte:head>
    <title>Audio Streamer - PATTSWAY</title>
</svelte:head>



{#if $user}

    <HighlightedTrack />

    <div class="wrapTrackList">
        <TrackList />
    </div>

{:else}



        
        <Hero />

        <br><br><br><br>

        <!-- how would i say an open sourced audio player? what would be good for a hero section here? -->
        <ProjectDetails />

{/if}

