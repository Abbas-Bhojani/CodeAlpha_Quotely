/**
 * QUOTELY — Quote Delivery
 *
 * Visitors receive quotes from QUOTELY's D1 catalogue.
 *
 * External quote providers are never contacted during a
 * visitor's New Quote request.
 */

import {
    jsonResponse
} from "./utils.js";

import {
    authenticateVisitor
} from "./visitors.js";


const ALLOWED_CATEGORIES =
    new Set([
        "random",
        "wisdom",
        "life",
        "inspirational",
        "success",
        "courage",
        "happiness",
        "art"
    ]);


/* =========================================================
   Category
   ========================================================= */

function normalizeCategory(
    value
) {
    const category =
        String(
            value || "random"
        )
            .trim()
            .toLowerCase();


    if (
        !ALLOWED_CATEGORIES.has(
            category
        )
    ) {
        return null;
    }


    return category;
}


/* =========================================================
   Select Quote
   ========================================================= */

async function selectQuote(
    env,
    visitorNumber,
    category
) {
    let quote;


    /*
     * RANDOM may use anything in the catalogue.
     */
    if (
        category === "random"
    ) {

        quote =
            await env.DB.prepare(`
                SELECT
                    q.id,
                    q.quote_text,
                    q.author,
                    q.category

                FROM quotes q

                WHERE q.is_active = 1

                  AND q.id NOT IN (
                      SELECT quote_id
                      FROM generated_thoughts
                      WHERE visitor_number = ?
                      ORDER BY generated_at DESC
                      LIMIT 10
                  )

                ORDER BY RANDOM()

                LIMIT 1
            `)
                .bind(
                    visitorNumber
                )
                .first();

    } else {

        /*
         * Category selections only use quotes explicitly
         * belonging to that category.
         */
        quote =
            await env.DB.prepare(`
                SELECT
                    q.id,
                    q.quote_text,
                    q.author,
                    q.category

                FROM quotes q

                WHERE q.is_active = 1
                  AND q.category = ?

                  AND q.id NOT IN (
                      SELECT quote_id
                      FROM generated_thoughts
                      WHERE visitor_number = ?
                      ORDER BY generated_at DESC
                      LIMIT 6
                  )

                ORDER BY RANDOM()

                LIMIT 1
            `)
                .bind(
                    category,
                    visitorNumber
                )
                .first();
    }


    /*
     * Once the visitor has temporarily exhausted the
     * non-repeat pool, allow an older quote again.
     */
    if (!quote) {

        if (
            category === "random"
        ) {

            quote =
                await env.DB.prepare(`
                    SELECT
                        id,
                        quote_text,
                        author,
                        category

                    FROM quotes

                    WHERE is_active = 1

                    ORDER BY RANDOM()

                    LIMIT 1
                `)
                    .first();

        } else {

            quote =
                await env.DB.prepare(`
                    SELECT
                        id,
                        quote_text,
                        author,
                        category

                    FROM quotes

                    WHERE is_active = 1
                      AND category = ?

                    ORDER BY RANDOM()

                    LIMIT 1
                `)
                    .bind(
                        category
                    )
                    .first();
        }
    }


    return quote;
}


/* =========================================================
   Generate New Thought
   ========================================================= */

export async function generateQuote(
    request,
    env
) {
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


    let body = {};


    try {
        body =
            await request.json();

    } catch {
        /*
         * Missing body simply means Random.
         */
    }


    const category =
        normalizeCategory(
            body.category
        );


    if (!category) {
        return jsonResponse(
            {
                error:
                    "Invalid quote category."
            },
            400
        );
    }


    const selected =
        await selectQuote(
            env,
            visitor.visitorNumber,
            category
        );


    if (!selected) {
        return jsonResponse(
            {
                error:
                    "No thought is currently available in this category."
            },
            404
        );
    }


    const generatedAt =
        new Date()
            .toISOString();


    /*
     * Record what the visitor has seen so immediate repeats
     * can be avoided.
     */
    const history =
        await env.DB.prepare(`
            INSERT INTO generated_thoughts (
                visitor_number,
                quote_id,
                generated_at
            )

            VALUES (?, ?, ?)

            RETURNING id
        `)
            .bind(
                visitor.visitorNumber,
                selected.id,
                generatedAt
            )
            .first();


    /*
     * Recent Thoughts expire exactly 24 hours later.
     */
    const expiresAt =
        Date.parse(
            generatedAt
        )
        + (
            24
            * 60
            * 60
            * 1000
        );


    return jsonResponse({
        thought: {
            id:
                String(
                    history.id
                ),

            quote:
                selected.quote_text,

            author:
                selected.author,

            category:
                selected.category,

            createdAt:
                Date.parse(
                    generatedAt
                ),

            expiresAt
        }
    });
}