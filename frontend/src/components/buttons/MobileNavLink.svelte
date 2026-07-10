<script lang='ts'>

    import './MobileNavLink.css'

    export let title: string
    export let isActive: boolean = false
</script>


<button class="mnl_link" class:mnl_active={isActive} on:click>{title}</button>