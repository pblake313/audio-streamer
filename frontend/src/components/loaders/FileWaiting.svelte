
<style>
    
    .fileWaitingLoader {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: block;
        margin:8px auto;
        position: relative;
        background: #cacaca;
        box-sizing: border-box;
        animation: shadowExpandX 2s linear infinite alternate;
    }

    @keyframes shadowExpandX {
        0% {
            box-shadow: 0 0, 0 0;
            color: rgba(255, 255, 255, 0.2);
        }
        100% {
            box-shadow: -12px 0, 12px 0;
            color: rgba(55, 55, 55, 0.8);
        }
    }
    
</style>
<span class="fileWaitingLoader"></span>