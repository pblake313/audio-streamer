// import { writable, get } from 'svelte/store';
// import WaveSurfer from 'wavesurfer.js';
// import type { Beat } from '../../types/Beats';
// import type { WaveSurferOptions } from 'wavesurfer.js';
// import { pauseTimer, play, resumeTimer } from './trackNavigation';
// import { allBeatPagesFetched, fetchBeats, getNextBeatPageToFetch, isLastBeatInArray } from './beatArrayStore';

// const backendLink = import.meta.env.VITE_BACKEND_URL;

// // Stores
// const waveSurfer = writable<WaveSurfer | null>(null);
// const audioUrl = writable<string | null>(null);
// const playbackStatus = writable<'Waiting' | 'Playing' | 'Paused' | 'Loading'>('Loading');
// const waveformLoadingStatus = writable(false); // Updated to a boolean
// const hidingAudioPlayer = writable<boolean>(false)

// const trackLength = writable<number>(0); // Total track length in seconds
// const currentTime = writable<number>(0); // Current playback time in seconds

// const timeoutCounter = writable<number>(0);
// const isInTimeout = writable<boolean>(false)


// function createWaveSurferInstance(container: HTMLElement) {

//     const screenWidth = window.innerWidth;

//     const waveSurferHeight = screenWidth < 600 ? 40 : 60; 
//     const barWidth = screenWidth < 600 ? 0 : 2; 

//     const ws = WaveSurfer.create({
//         container,
//         waveColor: '#666666',
//         progressColor: 'white',
//         backend: 'MediaElement',
//         height: waveSurferHeight,
//         barWidth: barWidth,
//         hideScrollbar: true,
//     } as WaveSurferOptions);

//     // Log and handle changes in audioUrl
//     audioUrl.subscribe((url) => {
//         if (url && ws) {
//             // console.log('URL Changed: ', url)
//             waveformLoadingStatus.set(true); // Set loading status
//             pauseTimer()
//             ws.load(url);
//         }
//     });

//     let zerostart = 1;

//     // WaveSurfer Event Listeners
//     ws.on('ready', () => {
//         playbackStatus.set('Waiting')

//         waveformLoadingStatus.set(false);
//         trackLength.set(ws.getDuration());
//         // console.log('WaveSurfer is ready!');
    
//         // Check if this is the first time
//         if (zerostart < 1) {
//             play(); // Play if it's not the first time
//             return;
//         }
    
//         // Decrement zerostart for subsequent calls
//         zerostart -= 1;
//     });

//     ws.on('load', () => {
//         // console.log('Audio fully loaded and ready to play.');
//         playbackStatus.set('Waiting')

//     });

//     ws.on('loading', (progress) => {
//         playbackStatus.set('Loading')
//     });

//     ws.on('play', () => {
//         playbackStatus.set('Playing');
//         resumeTimer()
//     });

//     ws.on('pause', () => {
//         const waiting = get(playbackStatus); // Check if it's a "waiting" pause
//         if (waiting === 'Waiting') {
//             // console.log('WaveSurfer paused, but playback is in "Waiting" state.');
//             // Keep playbackStatus as 'Waiting'
//         } else {
//             playbackStatus.set('Paused');
//             // console.log('WaveSurfer paused, playback status set to Paused.');
//         }
//     });

//     ws.on('finish', async () => {
//         playbackStatus.set('Paused');
//         // console.log('Audio playback finished.');

//         if (isLastBeatInArray()){
//             const allBeatsFetched = get(allBeatPagesFetched);

//             if (!allBeatsFetched) {
//                 console.log('need to fetch more beats...')

//                 try {
//                     await fetchBeats(getNextBeatPageToFetch())
//                 } catch {
//                     console.log('could not fetch new beats after last song played.')
//                 }

//             }
//         }

//     });

//     ws.on('audioprocess', () => {
//         const currentTimeValue = ws.getCurrentTime();
//         currentTime.set(currentTimeValue);
//     });

//     ws.on('error', (error) => {
//         console.error('WaveSurfer encountered an error:', error);
//     });

//     // Update the store with the new WaveSurfer instance
//     waveSurfer.set(ws);

//     return ws;
// }







// export {
//     waveSurfer,
//     createWaveSurferInstance,
//     audioUrl,
//     playbackStatus,
//     waveformLoadingStatus,
//     trackLength,
//     currentTime,
//     timeoutCounter,
//     isInTimeout,
//     hidingAudioPlayer,
// };
