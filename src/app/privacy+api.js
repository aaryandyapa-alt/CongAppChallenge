/**
 * GET /privacy: ShiftLime's privacy policy, as a plain web page. Server code (the "+api" in the file name), served by
 * EAS Hosting at https://queuing-app.expo.app/privacy, which is the address given to Google Play. Settings > About
 * links to it. Keep it matching what the app really does: if the app starts sending or keeping anything new, update it.
 */

const CONTACT = "shiftlimeapp@gmail.com";
const UPDATED = "November 8, 2026";

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ShiftLime privacy policy</title>
<style>
    :root { --bg: #FAFCF4; --card: #FFFFFF; --text: #1F2E24; --muted: #44564A; --green: #3F6F34; --line: rgba(31, 46, 36, 0.1); }
    @media (prefers-color-scheme: dark) {
        :root { --bg: #0F1611; --card: #1B251E; --text: #EAF2E6; --muted: #B5C4B5; --green: #9BE287; --line: rgba(234, 242, 230, 0.12); }
    }
    body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
    main { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; }
    .card { background: var(--card); border-radius: 20px; padding: 24px 22px; box-shadow: 0 12px 30px rgba(31, 46, 36, 0.07); }
    .eyebrow { color: var(--green); font-weight: 700; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 4px; }
    h1 { font-size: 30px; line-height: 1.2; margin: 0 0 6px; }
    h2 { font-size: 19px; margin: 28px 0 6px; padding-top: 18px; border-top: 1px solid var(--line); }
    p, li { color: var(--muted); }
    strong { color: var(--text); }
    a { color: var(--green); }
    .updated { margin: 0 0 8px; font-size: 14px; }
</style>
</head>
<body>
<main>
<div class="card">
<p class="eyebrow">ShiftLime</p>
<h1>Privacy policy</h1>
<p class="updated">Last updated ${UPDATED}</p>

<p>ShiftLime is a free app that helps food banks, pantries and clinics plan how to split their workers so people wait less.
It's made by a small student team. This policy explains what happens to the information you put into the app.</p>

<h2>The short version</h2>
<ul>
    <li><strong>Your runs stay on your phone.</strong> Everything you set up and every result is saved only on your device.</li>
    <li><strong>Only Simple mode's five answers ever leave your phone,</strong> and only when you tap Submit, so an AI can fill in the details for you.</li>
    <li><strong>No accounts, no ads, no analytics, no tracking.</strong> We don't sell or share your information.</li>
</ul>

<h2>What stays on your phone</h2>
<p>The runs you create (names, opening hours, stations, workers, times and arrival numbers), their results, and your
settings (like light or dark mode) are stored only on your device. They aren't sent to us or anyone else. The
simulation that finds the best way to split your workers runs entirely on your phone. If your phone backs up app
data to your Google account, Android may include your runs in that backup, which only you can restore.</p>

<h2>What's sent when you use the AI (Simple mode)</h2>
<p>In Simple mode you can answer five questions in your own words. When you tap <strong>Submit</strong>, those five
answers are sent over an encrypted connection to our server, which passes them to <strong>Claude</strong>, an AI made by
<strong>Anthropic</strong>, to turn them into the app's settings. The result comes straight back to your phone.</p>
<ul>
    <li>We don't store your answers or the AI's reply on our server.</li>
    <li>Anthropic processes the answers to produce the reply, under its own terms and
        <a href="https://www.anthropic.com/legal/privacy">privacy policy</a>.</li>
    <li>Please don't include names or other personal information in your answers. The app reminds you of this before you submit.</li>
    <li>If you'd rather nothing leave your phone, tap <strong>Skip</strong> or use <strong>Advanced</strong> mode and fill everything in yourself.</li>
</ul>

<h2>Technical information</h2>
<p>Like any internet service, our server (hosted by Expo, on Cloudflare's network) receives your device's IP address when
the AI is used. We use it only to limit how often one device can use the AI, so the service stays available for
everyone. We count requests in a database (Upstash) under a scrambled form of the address, never the address itself,
and each count deletes itself automatically within a day. Nothing is shared. Our hosting provider may keep standard
short-term technical logs to run and secure the service.</p>

<h2>Deleting your information</h2>
<p>You can delete any run from its page, or all of them with <strong>Settings &gt; Delete all runs</strong>.
Uninstalling the app removes everything it stored. We don't keep a copy, so there's nothing for us to delete.</p>

<h2>Children</h2>
<p>ShiftLime is made for the staff and volunteers who run food banks, pantries and clinics. It isn't directed at
children under 13, and we don't knowingly collect information from them.</p>

<h2>Changes to this policy</h2>
<p>If we change what the app does with your information, we'll update this page and the date at the top.</p>

<h2>Contact us</h2>
<p>Questions, or something wrong with the AI? Email us at <a href="mailto:${CONTACT}">${CONTACT}</a>.</p>
</div>
</main>
</body>
</html>`;

export function GET()
{
    return new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
