// ==UserScript==
// @name         X Country Codes — Bugfixed Username (v3.6)
// @namespace    https://github.com/m0nnnna/x-flags
// @version      3.6
// @description  Country coodes on your timeline
// @author       m0nnnna
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      raw.githubusercontent.com
// @downloadURL  https://github.com/m0nnnna/x-flags/raw/refs/heads/main/x-flags.user.js
// @updateURL    https://github.com/m0nnnna/x-flags/raw/refs/heads/main/x-flags.user.js
// @run-at       document-idle
// ==/UserScript==

(async function () {
    'use strict';

    const REPO_URL = 'https://raw.githubusercontent.com/m0nnnna/x-flags/main/flags.json';
    const STORAGE_KEY = 'xflags_local_db';

    let globalDB = {};
    let localDB = await GM_getValue(STORAGE_KEY, {});

    // 70+ countries (unchanged)
    const countryToCode = {
        "United States": "US", "Canada": "CA", "United Kingdom": "GB", "Germany": "DE",
        "France": "FR", "India": "IN", "Japan": "JP", "Australia": "AU", "Brazil": "BR",
        "Russia": "RU", "Mexico": "MX", "China": "CN", "Italy": "IT", "Spain": "ES",
        "Nigeria": "NG", "Kenya": "KE", "Pakistan": "PK", "Philippines": "PH", "Indonesia": "ID",
        "Turkey": "TR", "Egypt": "EG", "South Africa": "ZA", "Vietnam": "VN", "Thailand": "TH",
        "Bangladesh": "BD", "Ghana": "GH", "Algeria": "DZ", "Morocco": "MA", "Ethiopia": "ET",
        "Argentina": "AR", "Colombia": "CO", "Peru": "PE", "Venezuela": "VE", "Chile": "CL",
        "Ecuador": "EC", "Bolivia": "BO", "Ukraine": "UA", "Netherlands": "NL", "Belgium": "BE",
        "Sweden": "SE", "Norway": "NO", "Denmark": "DK", "Finland": "FI", "Poland": "PL",
        "Romania": "RO", "Greece": "GR", "Portugal": "PT", "Czech Republic": "CZ", "Hungary": "HU",
        "Austria": "AT", "Switzerland": "CH", "Ireland": "IE", "New Zealand": "NZ", "Israel": "IL",
        "Palestine": "PS", "Saudi Arabia": "SA", "United Arab Emirates": "AE", "Qatar": "QA",
        "Kuwait": "KW", "Iraq": "IQ", "Iran": "IR", "Afghanistan": "AF", "Myanmar": "MM",
        "Sri Lanka": "LK", "Nepal": "NP", "Malaysia": "MY", "Singapore": "SG", "South Korea": "KR",
        "North Korea": "KP", "Taiwan": "TW", "Hong Kong": "HK", "Mongolia": "MN", "Kazakhstan": "KZ",
        "Uzbekistan": "UZ", "Cambodia": "KH", "Laos": "LA", "Serbia": "RS", "Croatia": "HR",
        "Bosnia and Herzegovina": "BA", "Albania": "AL", "North Macedonia": "MK", "Bulgaria": "BG"
    };

    function loadGlobal() {
        GM_xmlhttpRequest({
            method: "GET", url: REPO_URL, timeout: 10000,
            onload: r => { try { globalDB = JSON.parse(r.responseText); } catch(e){} applyEverywhere(); },
            onerror: () => {}
        });
    }

    // FIXED CAPTURE: URL-first username + better span scan
    if (location.pathname.endsWith('/about')) {
        setTimeout(() => {
            console.log('X Flags: Scanning /about...');

            // Primary: Extract from URL (e.g., /9msmsg/about → "9msmsg")
            let username = location.pathname.split('/')[1]?.toLowerCase() || '';
            console.log(`X Flags: URL username: ${username || 'not found'}`);

            // Fallback: Scan spans for exact @handle (skip labels)
            if (!username) {
                const spans = document.querySelectorAll('span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3');
                for (const s of spans) {
                    const txt = s.textContent.trim();
                    if (txt.startsWith('@') && txt.length > 1 && !txt.includes('says')) { // Skip "x.com says @user"
                        username = txt.slice(1).toLowerCase();
                        console.log(`X Flags: Span username fallback: @${username}`);
                        break;
                    }
                }
            }

            let countryName = '';
            const spans = document.querySelectorAll('span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3');
            for (const s of spans) {
                const txt = s.textContent.trim();
                if (!txt.startsWith('@') && countryToCode[txt]) {
                    countryName = txt;
                    console.log(`X Flags: Found country: ${countryName}`);
                    break;
                }
            }

            if (username && countryName) {
                const code = countryToCode[countryName];
                if (!localDB[username] && !globalDB[username]) {
                    localDB[username] = code;
                    GM_setValue(STORAGE_KEY, localDB);
                    console.log(`X Flags: ✅ Captured @${username} → ${countryName} (${code})`);
                    alert(`✅ CAPTURED @${username} → ${code}`);
                } else {
                    console.log(`X Flags: @${username} already in DB (${localDB[username] || globalDB[username]})`);
                }
            } else {
                console.log('X Flags: ❌ Missing username/country (check console for details)');
            }
        }, 2000);
    }

    // DISPLAY EVERYWHERE (unchanged)
    function applyEverywhere() {
        // Profile header
        const profileHeader = document.querySelector('[data-testid="UserName"]');
        if (profileHeader) {
            const username = location.pathname.split('/')[1]?.toLowerCase();
            if (username && !profileHeader.querySelector('.profilecode')) {
                const code = globalDB[username] || localDB[username];
                if (code) {
                    const badge = document.createElement('span');
                    badge.textContent = ` ${code} `;
                    badge.className = 'profilecode';
                    badge.style.cssText = 'background:#1d9bf0;color:white;padding:3px 8px;border-radius:6px;font-size:0.8em;font-weight:bold;margin-left:8px;vertical-align:middle;';
                    profileHeader.appendChild(badge);
                }
            }
        }

        // Every post/tweet/reply
        document.querySelectorAll('article').forEach(article => {
            if (article.querySelector('.simplecode')) return;

            const link = article.querySelector('a[href^="/"][role="link"], a[href^="/"][tabindex="0"]');
            if (!link) return;

            const username = link.getAttribute('href')?.slice(1).split('/')[0]?.toLowerCase();
            if (!username) return;

            const code = globalDB[username] || localDB[username];
            if (code) {
                const span = document.createElement('span');
                span.textContent = ` ${code} `;
                span.className = 'simplecode';
                span.style.cssText = 'background:#1d9bf0;color:white;padding:2px 6px;border-radius:4px;font-size:0.75em;font-weight:bold;margin-left:6px;vertical-align:middle;';
                span.title = `@${username} → ${code}`;

                const target = article.querySelector('[data-testid="User-Name"], [data-testid="UserAvatarContainer"] ~ div span');
                if (target) target.appendChild(span);
            }
        });
    }

    // EXPORT (unchanged)
    function exportDB() {
        const json = JSON.stringify(localDB, null, 2);
        const t = document.createElement('textarea');
        t.value = json; document.body.appendChild(t); t.select();
        document.execCommand('copy'); document.body.removeChild(t);
        alert(`Copied ${Object.keys(localDB).length} entries!\nPaste into PR → https://github.com/m0nnnna/x-flags`);
    }
    GM_registerMenuCommand(`Export Local DB (${Object.keys(localDB).length} entries)`, exportDB);

    const observer = new MutationObserver(applyEverywhere);
    observer.observe(document.body, { childList: true, subtree: true });
    loadGlobal();
    setInterval(loadGlobal, 300000);
    setTimeout(applyEverywhere, 3000);

    console.log('X Country Codes v3.6 — Username bug fixed (URL fallback)');
})();