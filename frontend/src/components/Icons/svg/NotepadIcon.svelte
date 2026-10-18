<script lang="ts">
    // hex without the leading "#"
    export let color: string = 'f7f7f7'
    export let height = '16px'
</script>

<!-- note with ruled lines: bold strokes so it reads at small sizes -->
<svg
    {height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#{color}"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
>
    <path d="M14.5 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8.5z" />
    <path d="M14.5 3.5v5h5" />
    <path d="M8.5 13h7" />
    <path d="M8.5 16.5h5" />
</svg>
