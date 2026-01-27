export function sanitizeUrl(input: string) {
    // 1. Remove control chars
    input = input.replace(/[\t\r\n]/g, '').trim();

    // 2. Percent-decode safely
    input = repeatedlyPercentDecode(input);

    // 3. Remove fragment
    input = input.replace(/#.*$/, '');

    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input)) {
        input = "http://" + input;
    }

    // 4. Parse URL
    const url = new URL(input);

    // 5. Normalize hostname ONLY
    url.hostname = normalizeHostname(url.hostname);

    // 6. Canonicalize path
    url.pathname = canonicalizePath(url.pathname);

    // 7. Percent-escape path
    url.pathname = percentEscapePath(url.pathname);

    url.search = percentEscapeQuery(url.search);

    return url.toString();
}

function percentEscapeQuery(query: string) {
    if (!query || query === "?") return query;

    let out = "";
    let i = 0;

    // Preserve leading ?
    if (query[0] === "?") {
        out += "?";
        i = 1;
    }

    while (i < query.length) {
        const ch = query[i];

        // Preserve valid percent-escapes
        if (
            ch === "%" &&
            i + 2 < query.length &&
            /^[0-9A-Fa-f]{2}$/.test(query.slice(i + 1, i + 3))
        ) {
            out += "%" + query.slice(i + 1, i + 3).toUpperCase();
            i += 3;
            continue;
        }

        const code = ch.charCodeAt(0);

        // Characters that MUST be escaped
        if (
            code <= 0x20 ||
            code >= 0x7f ||
            ch === "#" ||
            ch === "%"
        ) {
            // UTF-8 encode
            const bytes = new TextEncoder().encode(ch);
            for (const b of bytes) {
                out += "%" + b.toString(16).toUpperCase().padStart(2, "0");
            }
        } else {
            out += ch;
        }

        i++;
    }

    return out;
}


/* ---------------- Path Canonicalization ---------------- */

function canonicalizePath(path: string) {
    // Collapse consecutive slashes
    path = path.replace(/\/{2,}/g, "/");

    const segments = path.split("/");
    const stack = [];

    for (const seg of segments) {
        if (seg === "" || seg === ".") {
            continue;
        }
        if (seg === "..") {
            stack.pop();
        } else {
            stack.push(seg);
        }
    }

    return "/" + stack.join("/");
}

/* ---------------- Percent Escaping ---------------- */

function percentEscapePath(path: string) {
    let out = "";
    let i = 0;

    while (i < path.length) {
        const ch = path[i];

        // Preserve valid percent-escapes
        if (
            ch === "%" &&
            i + 2 < path.length &&
            /^[0-9A-Fa-f]{2}$/.test(path.slice(i + 1, i + 3))
        ) {
            out += "%" + path.slice(i + 1, i + 3).toUpperCase();
            i += 3;
            continue;
        }

        const code = ch.charCodeAt(0);

        if (
            code <= 0x20 ||   // ASCII control + space
            code >= 0x7f ||   // non-ASCII
            ch === "#" ||
            ch === "%"
        ) {
            // UTF-8 encode properly
            const bytes = new TextEncoder().encode(ch);
            for (const b of bytes) {
                out += "%" + b.toString(16).toUpperCase().padStart(2, "0");
            }
        } else {
            out += ch;
        }

        i++;
    }

    return out;
}


function isValidPercentEscape(str: string, i: number) {
    return (
        str[i] === "%" &&
        /[0-9A-Fa-f]{2}/.test(str.slice(i + 1, i + 3))
    );
}

function normalizeHostname(hostname: string) {
    hostname = hostname.replace(/^\.+|\.+$/g, '');
    hostname = hostname.replace(/\.{2,}/g, '.');

    // IPv6 must be bracketed
    if (hostname.startsWith("[") && hostname.endsWith("]")) {
        return normalizeIPv6(hostname);
    }

    // Try IPv4
    const ipv4 = parseIPv4(hostname);
    if (ipv4 !== null) {
        return ipv4;
    }

    // Otherwise return hostname as-is (DNS name)
    return hostname.toLowerCase();
}

function repeatedlyPercentDecode(input: string) {
    let prev;
    for (let i = 0; i < 5; i++) {
        prev = input;
        try {
            input = decodeURIComponent(input);
        } catch {
            break;
        }
        if (input === prev) break;
    }
    return input;
}


function parseIPv4(input: string) {
    const parts = input.split(".");
    if (parts.length > 4) return null;

    let nums = [];
    for (let part of parts) {
        if (part === "") return null;

        let base = 10;
        if (/^0x/i.test(part)) base = 16;
        else if (part.length > 1 && part.startsWith("0")) base = 8;

        const value = parseInt(part, base);
        if (!Number.isFinite(value) || value < 0) return null;

        nums.push(value);
    }

    // Expand fewer-than-4 parts
    let ipv4 = 0;
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] > 0xffffffff) return null;
        ipv4 = ipv4 * 256 + nums[i];
    }

    if (ipv4 > 0xffffffff) return null;

    return [
        (ipv4 >>> 24) & 255,
        (ipv4 >>> 16) & 255,
        (ipv4 >>> 8) & 255,
        ipv4 & 255
    ].join(".");
}

function normalizeIPv6(input: string) {
    const inner = input.slice(1, -1).toLowerCase();

    // IPv4-mapped IPv6 ::ffff:x.x.x.x
    let match = inner.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (match) {
        return parseIPv4(match[1]) ?? input;
    }

    // NAT64 well-known prefix 64:ff9b::/96
    match = inner.match(/^64:ff9b::(\d+\.\d+\.\d+\.\d+)$/);
    if (match) {
        return parseIPv4(match[1]) ?? input;
    }

    // Parse IPv6 using built-in URL
    try {
        const url = new URL("http://[" + inner + "]/");
        return "[" + compressIPv6(url.hostname.slice(1, -1)) + "]";
    } catch {
        return input;
    }
}

function compressIPv6(address: string) {
    let parts = address.split(":").map(p => p.replace(/^0+/, "") || "0");

    // Find longest zero run
    let bestStart = -1, bestLen = 0;
    let curStart = -1, curLen = 0;

    for (let i = 0; i <= parts.length; i++) {
        if (i < parts.length && parts[i] === "0") {
            if (curStart === -1) curStart = i;
            curLen++;
        } else {
            if (curLen > bestLen) {
                bestStart = curStart;
                bestLen = curLen;
            }
            curStart = -1;
            curLen = 0;
        }
    }

    if (bestLen > 1) {
        parts.splice(bestStart, bestLen, "");
        if (bestStart === 0) parts.unshift("");
        if (bestStart + bestLen === 8) parts.push("");
    }

    return parts.join(":").replace(/:{3,}/, "::");
}