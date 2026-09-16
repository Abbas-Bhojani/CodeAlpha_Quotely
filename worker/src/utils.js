/**
 * QUOTELY — Worker Utilities
 *
 * Reusable helpers that run only inside the Cloudflare Worker.
 */


/* =========================================================
   JSON Responses
   ========================================================= */

/**
 * Creates a consistent JSON HTTP response.
 */
export function jsonResponse(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,

            headers: {
                "Content-Type": "application/json; charset=utf-8"
            }
        }
    );
}


/* =========================================================
   Visitor ID Formatting
   ========================================================= */

/**
 * Converts QUOTELY's numeric visitor sequence into its
 * public six-digit representation.
 *
 * Examples:
 * 1   -> 000001
 * 42  -> 000042
 * 999 -> 000999
 */
export function formatVisitorId(visitorNumber) {
    return String(visitorNumber).padStart(6, "0");
}


/**
 * Converts a six-digit recovery code into its readable form.
 *
 * Example:
 * 123456 -> 123-456
 */
export function formatRecoveryCode(recoveryCode) {
    const normalized = String(recoveryCode)
        .replace(/\D/g, "")
        .padStart(6, "0");

    return (
        normalized.slice(0, 3)
        + "-"
        + normalized.slice(3)
    );
}


/* =========================================================
   Secure Random Values
   ========================================================= */

/**
 * Generates a cryptographically secure hexadecimal string.
 *
 * Used for browser session credentials.
 */
export function randomHex(byteLength = 32) {
    const bytes = new Uint8Array(byteLength);

    crypto.getRandomValues(bytes);

    return Array.from(bytes)
        .map((byte) => {
            return byte
                .toString(16)
                .padStart(2, "0");
        })
        .join("");
}


/**
 * Creates exactly six cryptographically random decimal
 * digits for QUOTELY's visitor recovery code.
 */
export function createRecoveryCode() {
    const values = new Uint32Array(1);

    /*
     * We use rejection sampling so modulo arithmetic does not
     * introduce bias into the six-digit value.
     */
    const upperLimit =
        Math.floor(
            0x100000000 / 1_000_000
        ) * 1_000_000;

    let value;

    do {
        crypto.getRandomValues(values);

        value = values[0];

    } while (value >= upperLimit);


    return String(
        value % 1_000_000
    ).padStart(6, "0");
}


/* =========================================================
   Credential Verifiers
   ========================================================= */

/**
 * Creates an HMAC-SHA256 verifier using QUOTELY's private
 * Worker secret.
 *
 * The database stores the result instead of storing raw
 * recovery codes or raw session tokens.
 */
export async function createVerifier(
    secret,
    purpose,
    value
) {
    if (!secret) {
        throw new Error(
            "QUOTELY_AUTH_SECRET is not configured."
        );
    }


    const encoder = new TextEncoder();


    const key =
        await crypto.subtle.importKey(
            "raw",

            encoder.encode(secret),

            {
                name: "HMAC",
                hash: "SHA-256"
            },

            false,

            [
                "sign"
            ]
        );


    const signature =
        await crypto.subtle.sign(
            "HMAC",

            key,

            encoder.encode(
                `${purpose}:${value}`
            )
        );


    return Array.from(
        new Uint8Array(signature)
    )
        .map((byte) => {
            return byte
                .toString(16)
                .padStart(2, "0");
        })
        .join("");
}