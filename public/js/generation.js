/**
 * QUOTELY — Quote Generation
 *
 * This is the only frontend module that requests
 * a new thought.
 *
 * The browser never contacts external quote providers.
 * Every quote comes from QUOTELY's Cloudflare Worker,
 * which serves the existing D1 catalogue.
 */

import {
    displayFeaturedQuote,
    renderRecentThoughts
} from "./quotes.js";

import {
    addRecentThought
} from "./storage.js";


const API_BASE_URL =
    "https://worker.quotelysite.workers.dev";


/* =========================================================
   Session
   ========================================================= */

function getSessionToken() {
    return localStorage.getItem(
        "quotely:visitorSession"
    );
}


/* =========================================================
   Category
   ========================================================= */

function getSelectedCategory() {
    const trigger =
        document.querySelector(
            "#category-menu-trigger"
        );


    return (
        trigger?.dataset.category
        || "random"
    );
}


/* =========================================================
   New Quote
   ========================================================= */

async function generateNewThought(
    button
) {
    const token =
        getSessionToken();


    if (!token) {
        return;
    }


    const category =
        getSelectedCategory();


    button.disabled =
        true;

    button.textContent =
        "FINDING A THOUGHT...";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/quotes/generate`,
                {
                    method:
                        "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            category
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {
            throw new Error(
                data.error
                || "QUOTELY could not find a new thought."
            );
        }


        /*
         * Recent Thoughts are intentionally temporary
         * browser history.
         */
        addRecentThought(
            data.thought
        );


        /*
         * Show the newly discovered quote.
         */
        displayFeaturedQuote(
            data.thought
        );


        /*
         * Immediately rebuild Recent Thoughts.
         */
        renderRecentThoughts();


        button.textContent =
            "NEW QUOTE";


    } catch (error) {

        console.error(
            "QUOTELY generation failed.",
            error
        );


        button.textContent =
            "TRY AGAIN";


        window.setTimeout(
            () => {
                button.textContent =
                    "NEW QUOTE";
            },
            1500
        );


    } finally {

        button.disabled =
            false;
    }
}



/* =========================================================
   Initialization
   ========================================================= */

export function initializeQuoteGeneration() {
    const button =
        document.querySelector(
            "#new-quote-button"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {
            generateNewThought(
                button
            );
        }
    );
}