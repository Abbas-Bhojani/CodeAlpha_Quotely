/**
 * QUOTELY — Visitor Recovery
 *
 * Restores an existing visitor using:
 *
 * - Visitor ID
 * - Recovery Code
 *
 * Raw recovery codes are never stored in D1.
 */

import {
    createVerifier,
    formatVisitorId,
    jsonResponse,
    randomHex
} from "./utils.js";


/* =========================================================
   Recovery Limits
   ========================================================= */

const RECOVERY_WINDOW_SECONDS =
    15 * 60;

const MAX_RECOVERY_ATTEMPTS =
    5;


/* =========================================================
   Input Normalization
   ========================================================= */

function normalizeVisitorId(value) {
    const digits =
        String(value ?? "")
            .replace(/\D/g, "");


    if (
        digits.length !== 6
        || Number(digits) < 1
    ) {
        return null;
    }


    return digits;
}


function normalizeRecoveryCode(value) {
    const digits =
        String(value ?? "")
            .replace(/\D/g, "");


    if (digits.length !== 6) {
        return null;
    }


    return digits;
}


/* =========================================================
   Safe Comparison
   ========================================================= */

/**
 * Compares two verifier strings without returning immediately
 * on the first mismatching character.
 */
function safeEqual(first, second) {
    if (
        typeof first !== "string"
        || typeof second !== "string"
        || first.length !== second.length
    ) {
        return false;
    }


    let difference = 0;


    for (
        let index = 0;
        index < first.length;
        index += 1
    ) {
        difference |=
            first.charCodeAt(index)
            ^ second.charCodeAt(index);
    }


    return difference === 0;
}


/* =========================================================
   Rate Limiting
   ========================================================= */

async function createRateKey(
    request,
    visitorId,
    env
) {
    const clientAddress =
        request.headers.get(
            "CF-Connecting-IP"
        )
        || "local-development";


    return createVerifier(
        env.QUOTELY_AUTH_SECRET,
        "recovery-rate",
        `${clientAddress}:${visitorId}`
    );
}


async function consumeRecoveryAttempt(
    rateKey,
    env
) {
    const now =
        Math.floor(
            Date.now() / 1000
        );


    const existing =
        await env.DB
            .prepare(
                `
                SELECT
                    attempts,
                    window_started_at
                FROM recovery_rate_limits
                WHERE rate_key = ?
                `
            )
            .bind(rateKey)
            .first();


    /*
     * First attempt for this recovery key.
     */
    if (!existing) {
        await env.DB
            .prepare(
                `
                INSERT INTO recovery_rate_limits (
                    rate_key,
                    attempts,
                    window_started_at
                )
                VALUES (?, 1, ?)
                `
            )
            .bind(
                rateKey,
                now
            )
            .run();


        return true;
    }


    const windowAge =
        now
        - existing.window_started_at;


    /*
     * Old window expired, so begin a new one.
     */
    if (
        windowAge
        >= RECOVERY_WINDOW_SECONDS
    ) {
        await env.DB
            .prepare(
                `
                UPDATE recovery_rate_limits
                SET
                    attempts = 1,
                    window_started_at = ?
                WHERE rate_key = ?
                `
            )
            .bind(
                now,
                rateKey
            )
            .run();


        return true;
    }


    /*
     * Too many attempts inside the active window.
     */
    if (
        existing.attempts
        >= MAX_RECOVERY_ATTEMPTS
    ) {
        return false;
    }


    await env.DB
        .prepare(
            `
            UPDATE recovery_rate_limits
            SET attempts = attempts + 1
            WHERE rate_key = ?
            `
        )
        .bind(rateKey)
        .run();


    return true;
}


async function clearRecoveryAttempts(
    rateKey,
    env
) {
    await env.DB
        .prepare(
            `
            DELETE FROM recovery_rate_limits
            WHERE rate_key = ?
            `
        )
        .bind(rateKey)
        .run();
}


/* =========================================================
   Recovery
   ========================================================= */

export async function recoverVisitor(
    request,
    env
) {
    let body;


    try {
        body =
            await request.json();

    } catch {
        return jsonResponse(
            {
                error:
                    "Invalid recovery request."
            },
            400
        );
    }


    const visitorId =
        normalizeVisitorId(
            body.visitorId
        );

    const recoveryCode =
        normalizeRecoveryCode(
            body.recoveryCode
        );


    if (
        !visitorId
        || !recoveryCode
    ) {
        return jsonResponse(
            {
                error:
                    "Visitor ID and recovery code are required."
            },
            400
        );
    }


    const rateKey =
        await createRateKey(
            request,
            visitorId,
            env
        );


    const attemptAllowed =
        await consumeRecoveryAttempt(
            rateKey,
            env
        );


    if (!attemptAllowed) {
        return jsonResponse(
            {
                error:
                    "Too many recovery attempts. Please try again later."
            },
            429
        );
    }


    const visitorNumber =
        Number(visitorId);


    const visitor =
        await env.DB
            .prepare(
                `
                SELECT
                    visitor_number,
                    display_name,
                    recovery_hash
                FROM visitors
                WHERE
                    visitor_number = ?
                    AND is_active = 1
                LIMIT 1
                `
            )
            .bind(
                visitorNumber
            )
            .first();


    /*
     * We intentionally return the same message whether the
     * Visitor ID or recovery code is incorrect.
     */
    if (!visitor) {
        return jsonResponse(
            {
                error:
                    "Recovery details are incorrect."
            },
            401
        );
    }


    const submittedVerifier =
        await createVerifier(
            env.QUOTELY_AUTH_SECRET,
            "recovery",
            recoveryCode
        );


    if (
        !safeEqual(
            submittedVerifier,
            visitor.recovery_hash
        )
    ) {
        return jsonResponse(
            {
                error:
                    "Recovery details are incorrect."
            },
            401
        );
    }


    /*
     * Recovery succeeded.
     *
     * Generate a fresh session credential so the recovery
     * code itself never becomes a normal authentication token.
     */
    const sessionToken =
        randomHex(32);


    const sessionHash =
        await createVerifier(
            env.QUOTELY_AUTH_SECRET,
            "session",
            sessionToken
        );


    const now =
        new Date()
            .toISOString();


    await env.DB
        .prepare(
            `
            UPDATE visitors
            SET
                session_hash = ?,
                last_seen_at = ?
            WHERE visitor_number = ?
            `
        )
        .bind(
            sessionHash,
            now,
            visitorNumber
        )
        .run();


    await clearRecoveryAttempts(
        rateKey,
        env
    );


    return jsonResponse(
        {
            visitor: {
                visitorId:
                    formatVisitorId(
                        visitorNumber
                    ),

                displayName:
                    visitor.display_name
                    || null,

                sessionToken
            }
        }
    );
}