<script lang="ts">
    import './Homepage.css'
    import Hero from "../components/feature-sections/Hero.svelte";
    import ProjectDetails from "../components/feature-sections/ProjectDetails.svelte";
    import Footer from "../components/standalone/Nav/Footer.svelte";

</script>


<svelte:head>
    <title>Audio Streamer - PATTSWAY</title>
</svelte:head>



        
<Hero />

<!-- how would i say an open sourced audio player? what would be good for a hero section here? -->
<ProjectDetails />

<Footer />


