<script lang="ts">
    import { onMount } from "svelte";
    import { navStyle } from "../stores/navstore";

    import './Homepage.css'
    import Hero from "../components/feature-sections/Hero.svelte";
    import ProjectDetails from "../components/feature-sections/ProjectDetails.svelte";
    import Footer from "../components/standalone/Nav/Footer.svelte";

    onMount(() => {
        navStyle.set({style: 'standard', capWidth:false, addLine: true})
    })

</script>


<svelte:head>
    <title>Audio Streamer - PATTSWAY</title>
</svelte:head>



        
<Hero />

<!-- how would i say an open sourced audio player? what would be good for a hero section here? -->
<ProjectDetails />

<Footer />


