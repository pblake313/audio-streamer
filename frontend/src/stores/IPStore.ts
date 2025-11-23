import { writable } from "svelte/store"
import { publicFetch } from "../helpers/Fetchers/publicFetch"

export const userBlockedMessage = writable<string | null>(null) 
export const isCheckingIp = writable<boolean>(false)
export const checkIpErrorMesssage = writable<string | null>(null)

export async function checkIp() {

    try{
        isCheckingIp.set(true)
        const response = await publicFetch('/auth/check-ip')
   
    } catch (error:any) {


        if (error?.data?.blockedUntil || error?.data?.blocked) {
            const blockedUntil = error?.data?.blockedUntil
                ? new Date(error.data.blockedUntil).toLocaleString()
                : null;

            const msg = blockedUntil
                ? `Too many invalid PIN attempts. Your IP is temporarily blocked until ${blockedUntil}.`
                : `Too many invalid PIN attempts. Your IP is temporarily blocked.`; 

            userBlockedMessage.set(msg);
        } else {
            checkIpErrorMesssage.set(error.message || 'An unknown error occurred. Please try again later.');
        }

    } finally{
        isCheckingIp.set(false)
    }
    
}