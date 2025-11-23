// ==UserScript==
// @name         X Country Codes
// @namespace    https://github.com/m0nnnna/x-flags
// @version      4.1
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

    // FULL COUNTRIES → blue
    const countryToCode = {
        "United States": "US", "Canada": "CA", "United Kingdom": "GB", "Germany": "DE",
        "France": "FR", "India": "IN", "Japan": "JP", "Australia": "AU", "Brazil": "BR",
        "Russia": "RU", "Mexico": "MX", "China": "CN", "Italy": "IT", "Spain": "ES",
        "Nigeria": "NG", "Kenya": "KE", "Pakistan": "PK", "Philippines": "PH", "Indonesia": "ID",
        "Turkey": "TR", "Egypt": "EG", "South Africa": "ZA", "Vietnam": "VN", "Thailand": "TH",
        "Bangladesh": "BD", "Ghana": "GH", "Algeria": "DZ", "Morocco": "MA", "Ethiopia": "ET",
        "Argentina": "AR", "Colombia": "CO", "Peru": "PE", "Venezuela": "VE", "Chile": "CL",
        "Ukraine": "UA", "Netherlands": "NL", "Belgium": "BE", "Sweden": "SE", "Norway": "NO",
        "Poland": "PL", "Romania": "RO", "Greece": "GR", "Portugal": "PT", "Czech Republic": "CZ",
        "Hungary": "HU", "Austria": "AT", "Switzerland": "CH", "Ireland": "IE", "New Zealand": "NZ",
        "Israel": "IL", "Saudi Arabia": "SA", "United Arab Emirates": "AE", "Qatar": "QA",
        "Iraq": "IQ", "Iran": "IR", "South Korea": "KR", "Taiwan": "TW", "Malaysia": "MY",
        "Singapore": "SG", "Kazakhstan": "KZ", "Uzbekistan": "UZ", "Serbia": "RS", "Croatia": "HR",
		"Lithuania": "LT", "Burkina Faso": "BF"
    };

    // REGIONS → red
    const regionToCode = {
        "North America": "NA",
        "South America": "SA",
        "Europe": "EU",
        "Africa": "AF",
        "Asia": "AS",
        "Oceania": "OC",
		"West Asia": "WA"
    };

    function loadGlobal() {
        GM_xmlhttpRequest({
            method: "GET", url: REPO_URL, timeout: 10000,
            onload: r => { try { globalDB = JSON.parse(r.responseText); } catch(e){} applyEverywhere(); },
            onerror: () => {}
        });
    }

    // CAPTURE — now detects BOTH country AND region
    if (location.pathname.endsWith('/about')) {
        setTimeout(() => {
            console.log('X Flags: Scanning /about...');
            let username = location.pathname.split('/')[1]?.toLowerCase() || '';
            if (!username) {
                const spans = document.querySelectorAll('span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3');
                for (const s of spans) {
                    const txt = s.textContent.trim();
                    if (txt.startsWith('@') && txt.length > 1) {
                        username = txt.slice(1).toLowerCase();
                        break;
                    }
                }
            }

            let foundText = '';
            const spans = document.querySelectorAll('span.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3');
            for (const s of spans) {
                const txt = s.textContent.trim();
                if (!txt.startsWith('@') && (countryToCode[txt] || regionToCode[txt])) {
                    foundText = txt;
                    break;
                }
            }

            if (username && foundText) {
                const isRegion = regionToCode[foundText];
                const code = isRegion ? regionToCode[foundText] : countryToCode[foundText];
                const type = isRegion ? "REGION" : "COUNTRY";

                if (!localDB[username] && !globalDB[username]) {
                    localDB[username] = code;
                    GM_setValue(STORAGE_KEY, localDB);
                    console.log(`CAPTURED @${username} → ${foundText} (${code}) [${type}]`);
                    alert(`CAPTURED @${username} → ${foundText}\nCode: ${code} ${isRegion ? '(Region)' : ''}`);
                }
            }
        }, 2000);
    }

    // DISPLAY — blue for country, red for region
    function applyEverywhere() {
        // Profile header
        const profileHeader = document.querySelector('[data-testid="UserName"]');
        if (profileHeader && !profileHeader.querySelector('.codebadge')) {
            const username = location.pathname.split('/')[1]?.toLowerCase();
            const code = globalDB[username] || localDB[username];
            if (code) {
                const isRegion = !!regionToCode[Object.keys(regionToCode).find(k => regionToCode[k] === code)];
                const badge = document.createElement('span');
                badge.textContent = ` ${code} `;
                badge.className = 'codebadge';
                badge.style.cssText = `background:${isRegion ? '#d32f2f' : '#1d9bf0'};color:white;padding:3px 8px;border-radius:6px;font-size:0.8em;font-weight:bold;margin-left:8px;`;
                profileHeader.appendChild(badge);
            }
        }

        // Posts — fixed repost logic (innermost original)
        document.querySelectorAll('article').forEach(article => {
            if (article.querySelector('.codebadge')) return;

            let targetArticle = article;
            while (targetArticle.querySelector('[data-testid="tweet"]')) {
                targetArticle = targetArticle.querySelector('[data-testid="tweet"]');
            }

            const link = targetArticle.querySelector('[data-testid="User-Name"] a[href^="/"]');
            if (!link) return;

            const username = link.getAttribute('href').slice(1).split('/')[0].toLowerCase();
            const code = globalDB[username] || localDB[username];
            if (!code) return;

            const isRegion = !!regionToCode[Object.keys(regionToCode).find(k => regionToCode[k] === code)];
            const span = document.createElement('span');
            span.textContent = ` ${code} `;
            span.className = 'codebadge';
            span.style.cssText = `background:${isRegion ? '#d32f2f' : '#1d9bf0'};color:white;padding:2px 6px;border-radius:4px;font-size:0.75em;font-weight:bold;margin-left:6px;vertical-align:middle;`;
            span.title = `@${username} → ${code} ${isRegion ? '(Region)' : '(Country)'}`;

            const target = targetArticle.querySelector('[data-testid="User-Name"]');
            if (target) target.appendChild(span);
        });
    }

    function exportDB() {
        const json = JSON.stringify(localDB, null, 2);
        const t = document.createElement('textarea');
        t.value = json; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); alert(`Copied ${Object.keys(localDB).length} entries!`); }
        catch (e) { prompt(`Copy failed — paste this JSON:`, json); }
        document.body.removeChild(t);
    }

    function clearLocalDB() {
        if (Object.keys(localDB).length === 0) {
            alert("Local DB is already empty!");
            return;
        }
        if (confirm(`Delete all ${Object.keys(localDB).length} captured entries?\nThis cannot be undone.`)) {
            localDB = {};
            GM_setValue(STORAGE_KEY, localDB);
            alert("Local DB cleared! Refresh to see changes.");
            location.reload(); // Optional: auto-refresh
        }
    }

    GM_registerMenuCommand(`Export Local DB (${Object.keys(localDB).length} entries)`, exportDB);
    GM_registerMenuCommand(`Clear Local DB (${Object.keys(localDB).length} entries)`, clearLocalDB);

    const observer = new MutationObserver(applyEverywhere);
    observer.observe(document.body, { childList: true, subtree: true });
    loadGlobal();
    setInterval(loadGlobal, 300000);
    setTimeout(applyEverywhere, 3000);

    console.log('X Country + Region Codes');
})();