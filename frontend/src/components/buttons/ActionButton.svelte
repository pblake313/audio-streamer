
<script lang="ts">
    export let buttonText: string = 'Enter Button Text'
</script>

<button class="actionButton" on:click>
    <p class="abp">{buttonText}</p> 
</button>

<style>
    .actionButton {
        padding: 0px;
        margin: 0px;
        font-size: 10pt;
        cursor: pointer;
        background-color: transparent;
        border: none;
        outline: none;
        opacity: .7;
        transition: .3s;
        display: block;
    }
    .actionButton:hover {
        opacity: 1;
    }
    .actionButton .abp {
        padding: 0px;
        margin: 0px;
    }
    .actionButton:hover .abp {
        text-decoration: underline;
    }
    @media(pointer: coarse){
        .actionButton:hover .abp {
            text-decoration: none;
        }
        .actionButton:focus .abp {
            text-decoration: none;
        }
        .actionButton:hover {
            opacity: .7;
        }
    }
</style>