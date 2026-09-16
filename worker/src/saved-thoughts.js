/**
 * QUOTELY — Saved Thoughts
 *
 * Persistent quote collection belonging to an authenticated
 * Visitor ID.
 */

import {
    jsonResponse
} from "./utils.js";

import {
    authenticateVisitor
} from "./visitors.js";


/* =========================================================
   Validation
   ========================================================= */

function normalizeText(
    value,
    maxLength
) {
    if (
        typeof value !== "string"
    ) {
        return null;
    }


    const cleaned =
        value.trim();


    if (
        cleaned.length === 0
        || cleaned.length > maxLength
    ) {
        return null;
    }


    return cleaned;
}


function normalizeCategory(
    value
) {
    const category =
        normalizeText(
            value,
            40
        );


    if (!category) {
        return null;
    }


    return category
        .toLowerCase();
}


/* =========================================================
   Authentication Helper
   ========================================================= */

async function requireVisitor(
    request,
    env
) {
    const visitor =
        await authenticateVisitor(
            request,
            env
        );


    if (!visitor) {
        return {
            visitor: null,

            response:
                jsonResponse(
                    {
                        error:
                            "Visitor authentication required."
                    },
                    401
                )
        };
    }


    return {
        visitor,
        response: null
    };
}


/* =========================================================
   List Saved Thoughts
   ========================================================= */

export async function listSavedThoughts(
    request,
    env
) {
    const auth =
        await requireVisitor(
            request,
            env
        );


    if (!auth.visitor) {
        return auth.response;
    }


    const result =
        await env.DB
            .prepare(
                `
                SELECT
                    id,
                    quote_text,
                    author,
                    category,
                    saved_at
                FROM saved_thoughts
                WHERE visitor_number = ?
                ORDER BY saved_at DESC
                `
            )
            .bind(
                auth.visitor.visitorNumber
            )
            .all();


    const thoughts =
        result.results.map(
            (row) => {
                return {
                    id:
                        row.id,

                    quote:
                        row.quote_text,

                    author:
                        row.author,

                    category:
                        row.category,

                    savedAt:
                        row.saved_at
                };
            }
        );


    return jsonResponse({
        thoughts
    });
}


/* =========================================================
   Save Thought
   ========================================================= */

export async function saveThought(
    request,
    env
) {
    const auth =
        await requireVisitor(
            request,
            env
        );


    if (!auth.visitor) {
        return auth.response;
    }


    let body;


    try {
        body =
            await request.json();

    } catch {

        return jsonResponse(
            {
                error:
                    "Invalid save request."
            },
            400
        );
    }


    const quote =
        normalizeText(
            body.quote,
            1200
        );

    const author =
        normalizeText(
            body.author,
            160
        );

    const category =
        normalizeCategory(
            body.category
        );


    if (
        !quote
        || !author
        || !category
    ) {
        return jsonResponse(
            {
                error:
                    "Quote, author and category are required."
            },
            400
        );
    }


    const savedAt =
        new Date()
            .toISOString();


    try {
        const result =
            await env.DB
                .prepare(
                    `
                    INSERT INTO saved_thoughts (
                        visitor_number,
                        quote_text,
                        author,
                        category,
                        saved_at
                    )
                    VALUES (?, ?, ?, ?, ?)
                    RETURNING
                        id,
                        quote_text,
                        author,
                        category,
                        saved_at
                    `
                )
                .bind(
                    auth.visitor.visitorNumber,
                    quote,
                    author,
                    category,
                    savedAt
                )
                .first();


        return jsonResponse(
            {
                thought: {
                    id:
                        result.id,

                    quote:
                        result.quote_text,

                    author:
                        result.author,

                    category:
                        result.category,

                    savedAt:
                        result.saved_at
                }
            },
            201
        );

    } catch (error) {

        /*
         * D1/SQLite unique constraint prevents the same visitor
         * from saving an identical quote more than once.
         */
        if (
            String(error)
                .toLowerCase()
                .includes("unique")
        ) {
            const existing =
                await env.DB
                    .prepare(
                        `
                        SELECT
                            id,
                            quote_text,
                            author,
                            category,
                            saved_at
                        FROM saved_thoughts
                        WHERE
                            visitor_number = ?
                            AND quote_text = ?
                            AND author = ?
                        LIMIT 1
                        `
                    )
                    .bind(
                        auth.visitor.visitorNumber,
                        quote,
                        author
                    )
                    .first();


            return jsonResponse({
                thought: {
                    id:
                        existing.id,

                    quote:
                        existing.quote_text,

                    author:
                        existing.author,

                    category:
                        existing.category,

                    savedAt:
                        existing.saved_at
                },

                alreadySaved:
                    true
            });
        }


        console.error(
            "QUOTELY save failed.",
            error
        );


        return jsonResponse(
            {
                error:
                    "QUOTELY could not save this thought."
            },
            500
        );
    }
}


/* =========================================================
   Remove Saved Thought
   ========================================================= */

export async function removeSavedThought(
    request,
    env,
    thoughtId
) {
    const auth =
        await requireVisitor(
            request,
            env
        );


    if (!auth.visitor) {
        return auth.response;
    }


    const numericId =
        Number(
            thoughtId
        );


    if (
        !Number.isInteger(
            numericId
        )
        || numericId < 1
    ) {
        return jsonResponse(
            {
                error:
                    "Invalid saved thought."
            },
            400
        );
    }


    const existing =
        await env.DB
            .prepare(
                `
                SELECT id
                FROM saved_thoughts
                WHERE
                    id = ?
                    AND visitor_number = ?
                LIMIT 1
                `
            )
            .bind(
                numericId,
                auth.visitor.visitorNumber
            )
            .first();


    if (!existing) {
        return jsonResponse(
            {
                error:
                    "Saved thought not found."
            },
            404
        );
    }


    await env.DB
        .prepare(
            `
            DELETE FROM saved_thoughts
            WHERE
                id = ?
                AND visitor_number = ?
            `
        )
        .bind(
            numericId,
            auth.visitor.visitorNumber
        )
        .run();


    return jsonResponse({
        removed: true,
        id: numericId
    });
}