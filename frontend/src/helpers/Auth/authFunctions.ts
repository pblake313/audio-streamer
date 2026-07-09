import { get, writable } from "svelte/store"
import { accessToken } from "../../stores/tokenStore"
import { user } from "../../stores/UserStore"
import { authorizedFetch } from "../Fetchers/authorizedFetch"
import { publicFetch } from "../Fetchers/publicFetch"
import { audioMode, stopTrack } from "../../stores/AudioPlayerStore"
import { allBeatPagesFetched, beatPagesFetched, beats, fetchBeatsAttempted, oneBeatFetchSuccessfull } from "../../stores/AudioPlayer/BeatsStore"
import { selectedBeat } from "../../stores/AudioPlayer/selectedBeatStore"
import { goto } from "$app/navigation"


export const attemptingAutoLogin = writable<boolean>(false)
export const autoLoginAttempted = writable<boolean>(false)

export async function autoLogin(){
    try {



        if (get(autoLoginAttempted)) return
        
        attemptingAutoLogin.set(true)
        // try to get an authenticated user with an access token or refresh cookie.
        await getAuthenticatedUser()

    } catch (err) {
        console.log(err)
    } finally {
        attemptingAutoLogin.set(false)
        autoLoginAttempted.set(true)

    }
    

}

export async function getAuthenticatedUser() {
    //will return true if we have a valid user, or false if we dont...
    try {
        await authorizedFetch('/secure/get-authorized-user', {
            method: 'GET'
        })

        // console.log(response)

        user.set(true)
    } catch (err) {
        throw err
    } 

    // will return the authenticated user- but a valid access token is required.
}
export async function logout() {
    try {
        await publicFetch("/auth/logout", {
            method: "GET",
        });
    } catch (err) {
        console.log("Logout request failed:", err);
    } finally {
        stopTrack();

        accessToken.set(null);
        user.set(false);

        allBeatPagesFetched.set(false);
        beatPagesFetched.set([]);
        fetchBeatsAttempted.set(false);
        beats.set([]);
        selectedBeat.set(null);
        oneBeatFetchSuccessfull.set(false)

        audioMode.set('streamer')


        await goto("/login", {
            replaceState: true,
        });
    }
}