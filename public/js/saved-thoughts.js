/**
 * QUOTELY — Saved Thoughts
 *
 * Handles saving and unsaving thoughts through the
 * Cloudflare Worker.
 *
 * Important:
 * Saving a thought NEVER requests a new quote.
 */

import {
    getCurrentVisitor
} from "./visitors.js";

import {
    getLastDisplayedQuote,
    getRecentThoughts
} from "./storage.js";


const API_BASE_URL =
    "https://worker.quotelysite.workers.dev";


/* =========================================================
   Runtime State
   ========================================================= */

/*
 * Maps a quote fingerprint to its D1 saved-thought ID.
 *
 * This lets the interface quickly determine whether a
 * displayed quote is already saved.
 */
const savedThoughts =
    new Map();


/* =========================================================
   Helpers
   ========================================================= */

function createFingerprint(
    quote
) {
    return [
        quote.quote
            ?.trim()
            .toLowerCase(),

        quote.author
            ?.trim()
            .toLowerCase()
    ].join("::");
}


function getSessionToken() {
    return localStorage.getItem(
        "quotely:visitorSession"
    );
}


function getQuoteByRecentId(
    quoteId
) {
    return getRecentThoughts()
        .find(
            (quote) =>
                String(quote.id)
                === String(quoteId)
        );
}


/*
 * Determine which quote belongs to a clicked SAVE button.
 */
function resolveQuoteFromButton(
    button
) {
    const recentId =
        button.dataset.quoteId;


    if (recentId) {
        return getQuoteByRecentId(
            recentId
        );
    }


    /*
     * Featured SAVE button.
     */
    if (
        button.id
        === "save-featured-button"
    ) {
        return getLastDisplayedQuote();
    }


    return null;
}


/* =========================================================
   Backend Requests
   ========================================================= */

async function requestSavedThoughts() {
    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        throw new Error(
            "Visitor identity is required."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/api/saved-thoughts`,
            {
                headers: {
                    Authorization:
                        `Bearer ${sessionToken}`
                }
            }
        );


    if (!response.ok) {
        throw new Error(
            "Saved Thoughts could not be loaded."
        );
    }


    const data =
        await response.json();


    return data.thoughts ?? [];
}


async function requestSaveThought(
    quote
) {
    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        throw new Error(
            "Visitor identity is required."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/api/saved-thoughts`,
            {
                method:
                    "POST",

                headers: {
                    Authorization:
                        `Bearer ${sessionToken}`,

                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        quote:
                            quote.quote,

                        author:
                            quote.author,

                        category:
                            quote.category
                            || "random"
                    })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {
        throw new Error(
            data.error
            || "This thought could not be saved."
        );
    }


    return data.thought;
}


async function requestRemoveThought(
    savedThoughtId
) {
    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        throw new Error(
            "Visitor identity is required."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/api/saved-thoughts/${savedThoughtId}`,
            {
                method:
                    "DELETE",

                headers: {
                    Authorization:
                        `Bearer ${sessionToken}`
                }
            }
        );


    const data =
        await response.json();


    if (!response.ok) {
        throw new Error(
            data.error
            || "This thought could not be removed."
        );
    }


    return data;
}


/* =========================================================
   Saved State
   ========================================================= */

function rememberSavedThought(
    thought
) {
    savedThoughts.set(
        createFingerprint(
            thought
        ),
        thought.id
    );
}


function forgetSavedThought(
    quote
) {
    savedThoughts.delete(
        createFingerprint(
            quote
        )
    );
}


function getSavedThoughtId(
    quote
) {
    return savedThoughts.get(
        createFingerprint(
            quote
        )
    );
}


export function isThoughtSaved(
    quote
) {
    return Boolean(
        getSavedThoughtId(
            quote
        )
    );
}


/* =========================================================
   Button Appearance
   ========================================================= */

function updateSaveButton(
    button,
    quote
) {
    if (
        !button
        || !quote
    ) {
        return;
    }


    const saved =
        isThoughtSaved(
            quote
        );


    button.textContent =
        saved
            ? "SAVED"
            : "SAVE";


    button.dataset.saved =
        saved
            ? "true"
            : "false";


    button.setAttribute(
        "aria-pressed",
        saved
            ? "true"
            : "false"
    );
}


/*
 * Refresh every visible SAVE control.
 */
export function refreshSaveButtons() {

    const featuredButton =
        document.querySelector(
            "#save-featured-button"
        );


    const featuredQuote =
        getLastDisplayedQuote();


    updateSaveButton(
        featuredButton,
        featuredQuote
    );


    document
        .querySelectorAll(
            '[data-quote-action="save"][data-quote-id]'
        )
        .forEach(
            (button) => {

                const quote =
                    getQuoteByRecentId(
                        button.dataset.quoteId
                    );


                updateSaveButton(
                    button,
                    quote
                );
            }
        );
}


/* =========================================================
   Load Saved State
   ========================================================= */

export async function loadSavedThoughtState() {
    /*
     * Visitor initialization happens before this function.
     */
    const visitor =
        getCurrentVisitor();


    if (!visitor) {
        return;
    }


    try {
        const thoughts =
            await requestSavedThoughts();


        savedThoughts.clear();


        thoughts.forEach(
            rememberSavedThought
        );


        refreshSaveButtons();

    } catch (error) {

        console.error(
            "QUOTELY could not load saved state.",
            error
        );
    }
}


/* =========================================================
   Save / Unsave
   ========================================================= */

async function toggleSavedThought(
    button,
    quote
) {
    if (
        !button
        || !quote
    ) {
        return;
    }


    const existingId =
        getSavedThoughtId(
            quote
        );


    button.disabled =
        true;


    const previousText =
        button.textContent;


    button.textContent =
        existingId
            ? "REMOVING..."
            : "SAVING...";


    try {

        /*
         * Already saved → remove it.
         */
        if (existingId) {

            await requestRemoveThought(
                existingId
            );


            forgetSavedThought(
                quote
            );

        } else {

            /*
             * Not saved → persist it in D1.
             */
            const savedThought =
                await requestSaveThought(
                    quote
                );


            rememberSavedThought(
                savedThought
            );
        }


        /*
         * The same quote may exist both as the featured
         * thought and inside Recent Thoughts, so update
         * every visible SAVE control.
         */
        refreshSaveButtons();


    } catch (error) {

        console.error(
            "QUOTELY save action failed.",
            error
        );


        button.textContent =
            "TRY AGAIN";


        window.setTimeout(
            () => {
                refreshSaveButtons();
            },
            1500
        );


    } finally {

        button.disabled =
            false;


        /*
         * If something prevented refreshSaveButtons from
         * resolving the quote, restore a sensible label.
         */
        if (
            button.textContent
            === "SAVING..."
            || button.textContent
            === "REMOVING..."
        ) {
            button.textContent =
                previousText;
        }
    }
}


/* =========================================================
   Event Handling
   ========================================================= */

function handleSaveClick(
    event
) {
    const button =
        event.target.closest(
            '[data-quote-action="save"]'
        );


    if (!button) {
        return;
    }


    /*
     * sharing.js also listens for quote actions.
     *
     * SAVE belongs to this module, so prevent any unrelated
     * handler from interpreting the click.
     */
    event.preventDefault();


    const quote =
        resolveQuoteFromButton(
            button
        );


    if (!quote) {
        console.error(
            "QUOTELY could not identify the thought to save."
        );

        return;
    }


    toggleSavedThought(
        button,
        quote
    );
}


/* =========================================================
   Initialization
   ========================================================= */

export function initializeSavedThoughts() {

    document.addEventListener(
        "click",
        handleSaveClick
    );
}