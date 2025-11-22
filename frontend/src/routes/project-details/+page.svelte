<script lang="ts">
    import { goto } from "$app/navigation";
    import BoxButton from "../../components/buttons/BoxButton.svelte";
import GitHubLink from "../../components/PageComponents/GitHubLink.svelte";


</script>


<style>
    .containProjectDetails{
        max-width: 1200px;
        margin: auto;
    }
    h1 {
        font-size: 22pt;
    }
    h2 {
        font-size: 16pt;
        margin-bottom: 5px;
    }
    h3 {
        font-size: 12pt;
    }
    p {
        font-size: 12pt;
        opacity: .6;
    }
    .wrapGit{
        width: fit-content;
        margin: auto;
        width: 100%;
        position: sticky;
        top: 0px;
        display: flex;
        justify-content: space-evenly;
        padding: 5px 0px;
        background-color: #222222;
        z-index: 5;

    }
    .wrapProjDeets{
        padding: 25px;
    }
    .wrapGotoLoginButton{
        width: 100%;
        max-width: 250px;

    }
    .stickyGotoLoginWrap{
        position: fixed;
        width: calc(100% - 50px);
        bottom: 0px;
        left: 0px;
        display: flex;
        justify-content: space-evenly;
        padding: 15px 25px;
        background-color: #222222;
    }
    @media(max-width: 600px){
        .wrapGotoLoginButton{
            width: 100%;
            max-width: 100%;
        }
    }
</style>

<div class="containProjectDetails">
    <div class="wrapGit">
        <GitHubLink></GitHubLink>
    </div>

    <div class="wrapProjDeets">

        <h1 style="text-align: center;">Project Details</h1>
        <p style="text-align: center;"><em>audio-streamer</em></p>

        <div style="height: 75px;"></div>

        <!-- PROJECT SUMMARY -->
        <h2>Project Summary</h2>
        <p>
            A secure audio-streaming platform designed to protect digital content from 
            direct access or downloads. Streams are fully controlled by the backend, and 
            no public URLs or file references ever reach the client.
        </p>
        <br>


        <h2>Purpose</h2>
        <p>
            This platform was designed specifically for music producers who want a secure, 
            on-the-go way to test their tracks without exposing the original audio files. 
            It acts as a private streaming vault: all audio is stored remotely and can be 
            played from anywhere, but never downloaded or accessed directly. The site operates with a single authorized user. Only one PIN grants full 
            access to the entire system, ensuring that the library remains private and 
            completely locked down from the public. 
        </p>

        <br>

        <!-- STREAMING -->
        <h2>Streaming</h2>
        <p>
            Audio is delivered using <strong>chunked HTTP streaming</strong> from 
            Firebase Storage through controlled Express endpoints. The client receives 
            data in buffered segments, never the full file, preventing downloads, direct 
            access, or URL scraping. This ensures audio playback is smooth while keeping 
            the source file fully protected.
        </p>
        <br>

        <!-- AUTH -->
        <h2>Auth</h2>
        <p>
            Users authenticate using a combination of <strong>IP verification</strong> 
            and a temporary <strong>PIN login</strong>. Only approved devices can log in, 
            and all authentication flows run through the backend — preventing unauthorized 
            access even if someone attempts to spoof requests.
        </p>

        <br>

        <!-- FRONTEND -->
        <h2>Frontend</h2>
        <p>
            Built with <strong>Svelte</strong>, featuring a custom, protected audio player, 
            reactive stores, animations, and clean session handling. The frontend never 
            receives a direct link to the audio file — it streams only what the backend 
            provides through secure endpoints.
        </p>

        <br>

        <!-- BACKEND -->
        <h2>Backend</h2>
        <p>
            Powered by <strong>Node.js</strong> and <strong>Express</strong>, the backend 
            controls all authentication, streaming, and session logic. Audio is served 
            using <strong>chunked HTTP streaming</strong> from Firebase Storage, ensuring 
            users cannot download or extract the original audio files. All routes enforce 
            IP/PIN validation and token-based access.
        </p>

        <div style="height: 75px;"></div>
        <div class="stickyGotoLoginWrap">
            <div class="wrapGotoLoginButton">
                <BoxButton buttonText={'Go To Login'} fullWidth={true} on:click={()=> {goto('/')}}></BoxButton>
            </div>
        </div>
    
    </div>

</div>
