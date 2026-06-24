<script lang="ts">
    import GitHubIcon from "../Icons/Logos/GitHubIcon.svelte";

    export let stickyLink: boolean = false
    export let gitText:string = 'Download this project from GitHub'

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
        display: flex;
        align-items: center;


    }
    .gitHubStyle{
        margin-left: 10px;
        padding-top: 5px;
        transition: .3s;
        color: var(--font-color-light);
        
    }
    .insideGitLink:hover p {
        color: var(--font-color-heading);

    }
</style>

<div class="gitHubLinkWrapper" class:stickyLink={stickyLink}>
    <a href="https://github.com/pblake313/audio-streamer" target="_blank" class="insideGitLink">
        <div style="width:30px; height:30px;">
            <GitHubIcon />
        </div>
        <p class="gitHubStyle">{gitText}</p>
    </a>
</div>