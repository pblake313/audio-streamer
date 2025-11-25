<script lang="ts">
    import GitHubIcon from "../Icons/Logos/GitHubIcon.svelte";

    export let stickyLink: boolean = false
    export let gitText:string = 'Download this project from GitHub | @pblake313'

</script>


<style>
    .gitHubLinkWrapper{
        display: flex;
        align-items: center;
        width: fit-content;
    }
    .stickyLink{
        margin: auto;
        position: sticky;
        width: 100%;
        position: fixed;
        bottom: 10px;
    }
    .insideGitLink{
        margin: auto;
        width: fit-content;
        padding: 5px 10px;
        display: flex;
        align-items: center;


    }
    .gitHubStyle{
        font-size: 10pt;
        opacity: .5;
        margin-left: 10px;
        padding-top: 5px;
        transition: .3s;
        
    }
    .insideGitLink:hover p {
        opacity: 1;
    }
</style>

<div class="gitHubLinkWrapper" class:stickyLink={stickyLink}>
    <a href="https://github.com/pblake313/audio-streamer" target="_blank" class="insideGitLink">
        <div style="width:30px; height:30px;">
            <GitHubIcon></GitHubIcon>
        </div>
        <p class="gitHubStyle">{gitText}</p>
    </a>
</div>