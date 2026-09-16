/**
 * QUOTELY — Visitor Identity
 *
 * Handles:
 * - visitor creation
 * - visitor display names
 * - sequential Visitor IDs
 * - recovery credentials
 * - persistent browser sessions
 * - session verification
 */

import {
    createRecoveryCode,
    createVerifier,
    formatRecoveryCode,
    formatVisitorId,
    jsonResponse,
    randomHex
} from "./utils.js";


/* =========================================================
   Display Name
   ========================================================= */

function normalizeDisplayName(
    value
) {
    const name =
        String(value ?? "")
            .trim()
            .replace(/\s+/g, " ");


    /*
     * Keep names intentionally lightweight.
     *
     * We are not building usernames or profiles.
     */
    if (
        name.length < 1
        || name.length > 40
    ) {
        return null;
    }


    return name;
}


/* =========================================================
   Create Visitor
   ========================================================= */

export async function createVisitor(
    request,
    env
) {
    try {

        let body;


        try {
            body =
                await request.json();

        } catch {
            return jsonResponse(
                {
                    error:
                        "Your name is required."
                },
                400
            );
        }


        const displayName =
            normalizeDisplayName(
                body.displayName
            );


        if (!displayName) {
            return jsonResponse(
                {
                    error:
                        "Enter a name between 1 and 40 characters."
                },
                400
            );
        }


        /*
         * Raw browser session credential.
         */
        const sessionToken =
            randomHex(32);


        /*
         * Six-digit recovery credential.
         */
        const recoveryCode =
            createRecoveryCode();


        const sessionHash =
            await createVerifier(
                env.QUOTELY_AUTH_SECRET,
                "session",
                sessionToken
            );


        const recoveryHash =
            await createVerifier(
                env.QUOTELY_AUTH_SECRET,
                "recovery",
                recoveryCode
            );


        const now =
            new Date()
                .toISOString();


        /*
         * D1 owns the Visitor ID sequence.
         */
        const visitor =
            await env.DB
                .prepare(`
                    INSERT INTO visitors (
                        display_name,
                        recovery_hash,
                        session_hash,
                        created_at,
                        last_seen_at,
                        is_active
                    )

                    VALUES (?, ?, ?, ?, ?, 1)

                    RETURNING visitor_number
                `)
                .bind(
                    displayName,
                    recoveryHash,
                    sessionHash,
                    now,
                    now
                )
                .first();


        if (!visitor) {
            throw new Error(
                "D1 did not return a visitor number."
            );
        }


        const visitorNumber =
            Number(
                visitor.visitor_number
            );


        return jsonResponse(
            {
                visitor: {

                    visitorId:
                        formatVisitorId(
                            visitorNumber
                        ),

                    displayName,

                    /*
                     * Returned once.
                     * Never stored in plaintext in D1.
                     */
                    recoveryCode:
                        formatRecoveryCode(
                            recoveryCode
                        ),

                    sessionToken
                }
            },
            201
        );


    } catch (error) {

        console.error(
            "Visitor creation failed:",
            error
        );


        return jsonResponse(
            {
                error:
                    "QUOTELY could not create a visitor."
            },
            500
        );
    }
}


/* =========================================================
   Session Authentication
   ========================================================= */

function readBearerToken(
    request
) {
    const authorization =
        request.headers.get(
            "Authorization"
        );


    if (
        !authorization
        || !authorization.startsWith(
            "Bearer "
        )
    ) {
        return null;
    }


    return authorization
        .slice(7)
        .trim();
}


export async function authenticateVisitor(
    request,
    env
) {
    const sessionToken =
        readBearerToken(
            request
        );


    if (!sessionToken) {
        return null;
    }


    const sessionHash =
        await createVerifier(
            env.QUOTELY_AUTH_SECRET,
            "session",
            sessionToken
        );


    const visitor =
        await env.DB
            .prepare(`
                SELECT
                    visitor_number,
                    display_name,
                    created_at,
                    last_seen_at

                FROM visitors

                WHERE
                    session_hash = ?
                    AND is_active = 1

                LIMIT 1
            `)
            .bind(
                sessionHash
            )
            .first();


    if (!visitor) {
        return null;
    }


    return {
        visitorNumber:
            Number(
                visitor.visitor_number
            ),

        visitorId:
            formatVisitorId(
                visitor.visitor_number
            ),

        displayName:
            visitor.display_name
            || null,

        createdAt:
            visitor.created_at,

        lastSeenAt:
            visitor.last_seen_at
    };
}


/* =========================================================
   Current Visitor
   ========================================================= */

export async function getCurrentVisitor(
    request,
    env
) {
    try {

        const visitor =
            await authenticateVisitor(
                request,
                env
            );


        if (!visitor) {
            return jsonResponse(
                {
                    error:
                        "Invalid or expired visitor session."
                },
                401
            );
        }


        const now =
            new Date()
                .toISOString();


        await env.DB
            .prepare(`
                UPDATE visitors

                SET last_seen_at = ?

                WHERE visitor_number = ?
            `)
            .bind(
                now,
                visitor.visitorNumber
            )
            .run();


        return jsonResponse({
            visitor: {

                visitorId:
                    visitor.visitorId,

                displayName:
                    visitor.displayName,

                createdAt:
                    visitor.createdAt
            }
        });


    } catch (error) {

        console.error(
            "Visitor session lookup failed:",
            error
        );


        return jsonResponse(
            {
                error:
                    "QUOTELY could not verify this visitor."
            },
            500
        );
    }
}


/* =========================================================
   Set Display Name
   ========================================================= */

/*
 * Used mainly for visitors created before names were added
 * to QUOTELY.
 */
export async function setVisitorDisplayName(
    request,
    env
) {
    try {

        const visitor =
            await authenticateVisitor(
                request,
                env
            );


        if (!visitor) {
            return jsonResponse(
                {
                    error:
                        "Visitor authentication required."
                },
                401
            );
        }


        let body;


        try {
            body =
                await request.json();

        } catch {
            return jsonResponse(
                {
                    error:
                        "A name is required."
                },
                400
            );
        }


        const displayName =
            normalizeDisplayName(
                body.displayName
            );


        if (!displayName) {
            return jsonResponse(
                {
                    error:
                        "Enter a name between 1 and 40 characters."
                },
                400
            );
        }


        await env.DB
            .prepare(`
                UPDATE visitors

                SET display_name = ?

                WHERE visitor_number = ?
            `)
            .bind(
                displayName,
                visitor.visitorNumber
            )
            .run();


        return jsonResponse({
            visitor: {

                visitorId:
                    visitor.visitorId,

                displayName
            }
        });


    } catch (error) {

        console.error(
            "Visitor name update failed:",
            error
        );


        return jsonResponse(
            {
                error:
                    "QUOTELY could not save your name."
            },
            500
        );
    }
}