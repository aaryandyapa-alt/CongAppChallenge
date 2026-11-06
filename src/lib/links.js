import { Linking } from "react-native";

// where people can reach the team (Google Play listing, privacy policy, and the app's Contact and Report links)
export const CONTACT_EMAIL = "shiftlimeapp@gmail.com";
// the privacy policy page, served by the AI server (src/app/privacy+api.js) on EAS Hosting
export const PRIVACY_URL = "https://queuing-app.expo.app/privacy";

/**
 * Opens the phone's email app with a message to the team. Returns false if there's no email app to open it with.
 *
 * @param {string} subject
 * @param {string} body - Optional starting text.
 */
export async function email_team(subject, body = "")
{
    const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try
    {
        await Linking.openURL(url);
        return true;
    }
    catch
    {
        return false;
    }
}

// opens the privacy policy in the phone's browser
export function open_privacy_policy()
{
    Linking.openURL(PRIVACY_URL).catch(() => {});
}
