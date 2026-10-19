<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";
    import BoxButton from "../components/buttons/BoxButton.svelte";
    import Seo from "../components/misc/Seo.svelte";
    import { pageIn } from "../helpers/transitions";
</script>

<Seo
    title={page.status === 404 ? "Page Not Found" : "Something Went Wrong"}
    noindex
/>

<main class="errorPage" in:pageIn|global>
    <div class="errorPage_content">
        <h1 class="errorPage_status">
            {page.status}
        </h1>

        <h4>
            {page.status === 404
                ? "Page not found"
                : "Something went wrong"}
        </h4>
        <br>

        <p>
            {page.status === 404
                ? "The page you’re looking for doesn’t exist or may have been moved."
                : page.error?.message ?? "An unexpected error occurred."}
        </p>

        <div style="margin: auto; width: fit-content; margin-top: 25px;">
            <BoxButton buttonText={"Return Home"} on:click={() => {
                goto('/')
            }}/>
        </div>

    </div>
</main>

<style>
    .errorPage {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 30px;
        text-align: center;
    }

    .errorPage_content {
        width: 100%;
        max-width: 550px;
    }




</style>