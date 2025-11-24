<script lang="ts">
    import { onMount } from "svelte";
    import { navStyle } from "../stores/navstore";
    import PinForm from "../forms/PinForm.svelte";
    import GitHubLink from "../components/links/GitHubLink.svelte";
    import './Home.css'    
    import RightArrowIcon from "../components/Icons/svg/RightArrowIcon.svelte";


    onMount(() => {
        navStyle.set({style: 'standard', capWidth:false, addLine: true})


    })


</script>


<svelte:head>
    <title>Audio Streamer - PATTSWAY</title>
</svelte:head>




<div class="containStartInfo">
    <div class="wrapPinForm">
        <PinForm></PinForm>
    </div>
</div>

<div class="wrapGitLinkAndDetails">
    <a class="moreInfoLink" href="/project-details">

        <h4 style="font-size: 16pt;">About This Project</h4>
        <p class="projectInfoLink">Details about how it works.</p>

        <div class="flexMoreInfo">
            <div class="learnMore">
                <p class="lmoreText" >Learn More</p>
            </div>
            <div class="contiainTheIcon">
                <div class="wrapRighta">
                    <RightArrowIcon></RightArrowIcon>
                </div>
            </div>

        </div>
    </a>
    <div style="height: 50px;"></div>
    <GitHubLink></GitHubLink>
</div>


