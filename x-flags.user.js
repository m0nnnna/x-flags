// ==UserScript==
// @name         X Flags
// @namespace    https://github.com/m0nnnna/x-flags
// @version      3.4
// @description  Shows country code (US, NG, IN...) on timeline + profiles + replies
// @author       Noc
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// ==/UserScript==

(async function () {
    'use strict';

    const REPO_URL = 'https://raw.githubusercontent.com/m0nnnna/x-flags/main/flags.json';
    const STORAGE_KEY = 'xflags_local_db';

    let globalDB = {};
    let localDB = await GM_getValue(STORAGE_KEY, {});

    const countryToCode = {
        "United States": "US", "Canada": "CA", "United Kingdom": "GB", "Germany": "DE",
        "France": "FR", "India": "IN", "Japan": "JP", "Australia": "AU", "Brazil": "BR",
        "Russia": "RU", "Mexico": "MX", "China": "CN", "Italy": "IT", "Spain": "ES",
        "Nigeria": "NG", "Kenya": "KE", "Pakistan": "PK", "Philippines": "PH", "Indonesia": "ID",
        "Turkey": "TR", "Egypt": "EG", "South Africa": "ZA", "Vietnam": "VN", "Thailand": "TH"
    };

    function loadGlobal() {
        GM_xmlhttpRequest({
            method: "GET", url: REPO_URL, timeout: 10000,
            onload: r => { try { globalDB = JSON.parse(r.responseText); } catch(e){} applyEverywhere(); },
            onerror: () => {}
        });
    }

    // CAPTURE (unchanged — still 100% working)
    if (location.pathname.endsWith('/about')) {
        setTimeout(() => {
            const spans = document.querySelectorAll('span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3');
            let username = '', countryName = '';
            for (const s of spans) {
                const txt = s.textContent.trim();
                if (txt.startsWith('@')) username = txt.slice(1).toLowerCase();
                else if (countryToCode[txt]) countryName = txt;
            }
            if (username && countryName) {
                const code = countryToCode[countryName];
                if (!localDB[username] && !globalDB[username]) {
                    localDB[username] = code;
                    GM_setValue(STORAGE_KEY, localDB);
                    alert(`CAPTURED @${username} → ${code}`);
                }
            }
        }, 2000);
    }

    // DISPLAY EVERYWHERE — profile header + every post
    function applyEverywhere() {
        // 1. Profile header (when viewing someone's profile)
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

        // 2. Every post/tweet/reply on page
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

    // EXPORT (still 100% working)
    function exportDB() {
        const json = JSON.stringify(localDB, null, 2);
        const t = document.createElement('textarea');
        t.value = json; document.body.appendChild(t); t.select();
        document.execCommand('copy'); document.body.removeChild(t);
        alert(`Copied ${Object.keys(localDB).length} entries!\nPaste into PR → https://github.com/m0nnnna/x-flags`);
    }
    GM_registerMenuCommand(`Export Local DB (${Object.keys(localDB).length} entries)`, exportDB);

    // Run everywhere
    const observer = new MutationObserver(applyEverywhere);
    observer.observe(document.body, { childList: true, subtree: true });
    loadGlobal();
    setInterval(loadGlobal, 300000);
    setTimeout(applyEverywhere, 3000);

    console.log('X Country Codes v3.4 — Shows on profiles + timeline + replies');
})();