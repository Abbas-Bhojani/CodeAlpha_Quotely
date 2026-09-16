/**
 * QUOTELY — Cloudflare Worker
 *
 * This Worker is QUOTELY's trusted backend boundary.
 *
 * Browser:
 * - display
 * - local state
 * - interaction
 *
 * Worker:
 * - visitor identity
 * - recovery
 * - persistent Saved Thoughts
 * - quote generation
 */

import {
    createVisitor,
    getCurrentVisitor,
    setVisitorDisplayName
} from "./visitors.js";

import {
    jsonResponse
} from "./utils.js";

import {
    recoverVisitor
} from "./recovery.js";

import {
    listSavedThoughts,
    saveThought,
    removeSavedThought
} from "./saved-thoughts.js";

import {
    generateQuote
} from "./quotes.js";


/* ---------------------------------------------------------
   Origin protection
   --------------------------------------------------------- */

/**
 * During development we allow localhost / 127.0.0.1.
 *
 * PUBLIC_ORIGIN contains QUOTELY's production URL.
 */
function isAllowedOrigin(
    origin,
    env
) {
    /*
     * Requests such as curl/Postman may not contain Origin.
     */
    if (!origin) {
        return true;
    }


    try {
        const url =
            new URL(
                origin
            );


        if (
            url.hostname === "localhost"
            || url.hostname === "127.0.0.1"
        ) {
            return true;
        }

    } catch {
        return false;
    }


    if (
        env.PUBLIC_ORIGIN
        && origin === env.PUBLIC_ORIGIN
    ) {
        return true;
    }


    return false;
}


/**
 * Adds browser CORS headers after route processing.
 */
function applyCors(
    response,
    request,
    env
) {
    const origin =
        request.headers.get(
            "Origin"
        );


    if (
        !origin
        || !isAllowedOrigin(
            origin,
            env
        )
    ) {
        return response;
    }


    const headers =
        new Headers(
            response.headers
        );


    headers.set(
        "Access-Control-Allow-Origin",
        origin
    );

    headers.set(
        "Vary",
        "Origin"
    );


    return new Response(
        response.body,
        {
            status:
                response.status,

            statusText:
                response.statusText,

            headers
        }
    );
}


/* ---------------------------------------------------------
   Worker
   --------------------------------------------------------- */

export default {

    async fetch(
        request,
        env
    ) {
        const origin =
            request.headers.get(
                "Origin"
            );


        /*
         * Reject browser requests from unknown websites.
         */
        if (
            origin
            && !isAllowedOrigin(
                origin,
                env
            )
        ) {
            return jsonResponse(
                {
                    error:
                        "Origin not allowed."
                },
                403
            );
        }


        /*
         * Browser preflight request.
         */
        if (
            request.method
            === "OPTIONS"
        ) {
            const response =
                new Response(
                    null,
                    {
                        status: 204,

                        headers: {
                            "Access-Control-Allow-Methods":
                                "GET, POST, DELETE, OPTIONS",

                            "Access-Control-Allow-Headers":
                                "Content-Type, Authorization",

                            "Access-Control-Max-Age":
                                "86400"
                        }
                    }
                );


            return applyCors(
                response,
                request,
                env
            );
        }


        const url =
            new URL(
                request.url
            );


        let response;


        /* ---------------------------------------------
           Health
           --------------------------------------------- */

        if (
            request.method === "GET"
            && url.pathname === "/api/health"
        ) {

            response =
                jsonResponse({
                    status: "ok",
                    service: "quotely"
                });
        }


        /* ---------------------------------------------
           Visitor creation
           --------------------------------------------- */

        else if (
            request.method === "POST"
            && url.pathname === "/api/visitors"
        ) {

            response =
                await createVisitor(
                    request,
                    env
                );
        }


        /* ---------------------------------------------
           Existing visitor session
           --------------------------------------------- */

        else if (
            request.method === "GET"
            && url.pathname === "/api/visitors/me"
        ) {

            response =
                await getCurrentVisitor(
                    request,
                    env
                );
        }


        /* ---------------------------------------------
           Visitor Display Name
           --------------------------------------------- */

        else if (
            request.method === "POST"
            && url.pathname === "/api/visitors/name"
        ) {

            response =
                await setVisitorDisplayName(
                    request,
                    env
                );
        }


        /* ---------------------------------------------
           Visitor Recovery
           --------------------------------------------- */

        else if (
            request.method === "POST"
            && url.pathname === "/api/recovery"
        ) {

            response =
                await recoverVisitor(
                    request,
                    env
                );
        }


        /* ---------------------------------------------
           Generate New Quote
           --------------------------------------------- */

        else if (
            request.method === "POST"
            && url.pathname === "/api/quotes/generate"
        ) {

            response =
                await generateQuote(
                    request,
                    env
                );
        }


        /* ---------------------------------------------
           List Saved Thoughts
           --------------------------------------------- */

        else if (
            request.method === "GET"
            && url.pathname === "/api/saved-thoughts"
        ) {

            response =
                await listSavedThoughts(
                    request,
                    env
                );
        }


        /* ---------------------------------------------
           Save Thought
           --------------------------------------------- */

        else if (
            request.method === "POST"
            && url.pathname === "/api/saved-thoughts"
        ) {

            response =
                await saveThought(
                    request,
                    env
                );
        }


        /* ---------------------------------------------
           Remove Saved Thought
           --------------------------------------------- */

        else if (
            request.method === "DELETE"
            && url.pathname.startsWith(
                "/api/saved-thoughts/"
            )
        ) {

            const thoughtId =
                url.pathname
                    .split("/")
                    .pop();


            response =
                await removeSavedThought(
                    request,
                    env,
                    thoughtId
                );
        }


        /* ---------------------------------------------
           Unknown route
           --------------------------------------------- */

        else {

            response =
                jsonResponse(
                    {
                        error:
                            "Not found."
                    },
                    404
                );
        }


        return applyCors(
            response,
            request,
            env
        );
    }
};