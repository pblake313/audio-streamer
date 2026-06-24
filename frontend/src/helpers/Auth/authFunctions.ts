import { get, writable } from "svelte/store"
import { accessToken } from "../../stores/tokenStore"
import { user } from "../../stores/UserStore"
import { authorizedFetch } from "../Fetchers/authorizedFetch"
import { publicFetch } from "../Fetchers/publicFetch"
import { stopTrack } from "../../stores/AudioPlayerStore"
import { allBeatPagesFetched, beatPagesFetched, beats, fetchBeatsAttempted } from "../../stores/AudioPlayer/beatArrayStore"
import { selectedBeat } from "../../stores/AudioPlayer/selectedBeatStore"


export const attemptingAutoLogin = writable<boolean>(false)
export const autoLoginAttempted = writable<boolean>(false)

export async function autoLogin(){
    try {

        if (get(autoLoginAttempted) === true){
            console.log('autologin already attempted, returning.')
            return
        }

        attemptingAutoLogin.set(true)
        // try to get an authenticated user with an access token or refresh cookie.
        const validUser = await getAuthenticatedUser()

    } catch (err) {
        console.log(err)
    } finally {
        attemptingAutoLogin.set(false)
        autoLoginAttempted.set(true)

    }
    

}

export async function getAuthenticatedUser() : Promise<boolean> {
    //will return true if we have a valid user, or false if we dont...
    try {
        await authorizedFetch('/secure/get-authorized-user', {
            method: 'GET'
        })

        // console.log(response)

        user.set(true)
        return true
    } catch (err) {
        console.log(err)
        return false
    } 

    // will return the authenticated user- but a valid access token is required.
}

export async function logout() {
    try {
        await publicFetch('/auth/logout', {
            method:'GET',
        })
        // console.log(response)
    } catch { 

    } finally {
        stopTrack()
        accessToken.set(null)
        user.set(false)

        // reset beat stores

        allBeatPagesFetched.set(false)
        beatPagesFetched.set([])
        fetchBeatsAttempted.set(false)
        beats.set([])

        selectedBeat.set(null)

    }
   
}