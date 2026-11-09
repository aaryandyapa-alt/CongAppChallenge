/**
 * GET /privacy: ShiftLime's privacy policy, as a plain web page. Server code (the "+api" in the file name), served by
 * EAS Hosting at https://queuing-app.expo.app/privacy, which is the address given to Google Play. Settings > About
 * links to it. Keep it matching what the app really does: if the app starts sending or keeping anything new, update it.
 * To edit the wording, change the HTML in PAGE below, then redeploy the server (npx expo export --platform web, then
 * npx eas-cli@latest deploy --prod --environment production).
 */

const CONTACT = "shiftlimeapp@gmail.com";
const UPDATED = "November 8, 2026";

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ShiftLime Privacy Policy</title>
<style>
    :root { --bg: #FFFFFF; --text: #1F2E24; --link: #3F6F34; }
    @media (prefers-color-scheme: dark) {
        :root { --bg: #121812; --text: #E6EEE3; --link: #9BE287; }
    }
    body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
    main { max-width: 700px; margin: 0 auto; padding: 32px 20px 64px; }
    h1 { font-size: 28px; margin: 0 0 4px; }
    h2 { font-size: 18px; margin: 28px 0 6px; }
    a { color: var(--link); }
</style>
</head>
<body>
<main>
<h1>ShiftLime Privacy Policy</h1>
<p>Last updated: ${UPDATED}</p>

<p>ShiftLime is a free app for planning staffing at food banks, pantries and clinics. This policy describes what
information the app uses and where it goes.</p>

<h2>Information stored on your device</h2>
<p>Runs you create, their results and your settings are stored only on your device. We do not receive them. If your
device backs up app data to your Google account, Android may include this data in that backup.</p>

<h2>Information sent when you use AI</h2>
<p>In Simple mode, you can answer five questions in your own words. When you tap Submit, those answers are sent over an
encrypted connection to our server, which forwards them to Claude, an AI service from Anthropic, to fill in the run's
settings. We do not store your answers or the response. Anthropic handles the answers under its
<a href="https://www.anthropic.com/legal/privacy">privacy policy</a>.</p>
<p>Please do not include personal information in your answers. Simple mode is optional: you can tap Skip or use
Advanced mode, and nothing is sent.</p>

<h2>IP addresses</h2>
<p>Our server receives your device's IP address when you use the AI. We use it only to limit how often one device can
make requests. We store a one-way scrambled (hashed) version of it, not the address itself, and delete it automatically
within 24 hours. Our hosting providers (Expo, Cloudflare and Upstash) may keep standard technical logs to operate and
secure the service.</p>

<h2>What we don't do</h2>
<p>ShiftLime has no accounts, ads, analytics or tracking. We do not sell or share your information.</p>

<h2>Deleting your data</h2>
<p>You can delete a run from its page, or all runs from Settings. Uninstalling the app removes all of its data. We do
not hold any copy of your runs.</p>

<h2>Children</h2>
<p>ShiftLime is not directed at children under 13, and we do not knowingly collect information from them.</p>

<h2>Changes</h2>
<p>If this policy changes, we will update this page and the date above.</p>

<h2>Contact</h2>
<p>Email <a href="mailto:${CONTACT}">${CONTACT}</a> with any questions.</p>
</main>
</body>
</html>`;

export function GET()
{
    return new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
