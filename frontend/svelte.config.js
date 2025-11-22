import adapter from '@sveltejs/adapter-node';
import preprocess from 'svelte-preprocess';

export default {
	preprocess: preprocess({
		typescript: {
		  tsconfigFile: './tsconfig.json',
		},
	}),
	kit: {
		adapter: adapter()
	}
};