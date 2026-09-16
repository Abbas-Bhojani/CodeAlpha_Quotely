/**
 * QUOTELY — Discover Entry Point
 *
 * Starts the systems used by the Discover page.
 */

import {
    displayFeaturedQuote,
    resolveInitialQuote,
    renderRecentThoughts,
    updateRecentThoughtTimers
} from "./quotes.js";

import {
    initializeSharing
} from "./sharing.js";

import {
    initializeVisitorDialog,
    initializeVisitorIdentity
} from "./visitors.js";

import {
    initializeSavedThoughts,
    loadSavedThoughtState
} from "./saved-thoughts.js";

import {
    initializeQuoteGeneration
} from "./generation.js";


/* =========================================================
   Startup
   ========================================================= */

async function initializeDiscover() {

    /*
     * Restore the last displayed thought or use the
     * curated default thought.
     *
     * This never generates a new quote.
     */
    const initialQuote =
        resolveInitialQuote();


    displayFeaturedQuote(
        initialQuote
    );


    /*
     * Frontend systems that do not depend on the visitor
     * backend can start immediately.
     */
    initializeCategoryMenu();

    initializeSharing();

    initializeVisitorDialog();

    renderRecentThoughts();

    startRecentThoughtTimerUpdates();

    initializeSavedThoughts();


    /*
     * Resolve the visitor identity/session.
     */
    await initializeVisitorIdentity();


    /*
     * Load this visitor's persistent Saved Thoughts state.
     */
    await loadSavedThoughtState();


    /*
     * New Quote generation requires a valid visitor session.
     */
    initializeQuoteGeneration();
}


/* =========================================================
   Date & Time
   ========================================================= */

document.querySelectorAll(".edition-date").forEach((element) => {
    element.textContent = new Date()
        .toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric"
        })
        .toUpperCase();
});


/* =========================================================
   Category Menu
   ========================================================= */

function initializeCategoryMenu() {
    const menu =
        document.querySelector(
            "#category-menu"
        );

    const trigger =
        document.querySelector(
            "#category-menu-trigger"
        );

    const panel =
        document.querySelector(
            "#category-menu-list"
        );

    const value =
        document.querySelector(
            "#category-menu-value"
        );

    const options =
        Array.from(
            document.querySelectorAll(
                ".category-menu__option"
            )
        );


    if (
        !menu
        || !trigger
        || !panel
        || !value
        || options.length === 0
    ) {
        return;
    }


    function getSelectedOption() {
        return options.find(
            (option) => {
                return (
                    option.getAttribute(
                        "aria-selected"
                    )
                    === "true"
                );
            }
        );
    }


    function openMenu() {
        panel.hidden =
            false;

        trigger.setAttribute(
            "aria-expanded",
            "true"
        );

        menu.classList.add(
            "category-menu--open"
        );
    }


    function closeMenu() {
        panel.hidden =
            true;

        trigger.setAttribute(
            "aria-expanded",
            "false"
        );

        menu.classList.remove(
            "category-menu--open"
        );
    }


    function toggleMenu() {
        const isOpen =
            trigger.getAttribute(
                "aria-expanded"
            )
            === "true";


        if (isOpen) {
            closeMenu();

        } else {

            openMenu();
        }
    }


    function selectCategory(
        option
    ) {
        options.forEach(
            (currentOption) => {
                currentOption.setAttribute(
                    "aria-selected",
                    currentOption === option
                        ? "true"
                        : "false"
                );
            }
        );


        value.textContent =
            option.textContent.trim();


        trigger.dataset.category =
            option.dataset.category;


        closeMenu();

        trigger.focus();
    }


    function moveOptionFocus(
        currentOption,
        direction
    ) {
        const currentIndex =
            options.indexOf(
                currentOption
            );

        let nextIndex =
            currentIndex
            + direction;


        if (
            nextIndex < 0
        ) {
            nextIndex =
                options.length - 1;
        }


        if (
            nextIndex
            >= options.length
        ) {
            nextIndex =
                0;
        }


        options[
            nextIndex
        ].focus();
    }


    trigger.addEventListener(
        "click",
        toggleMenu
    );


    trigger.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "ArrowDown"
                || event.key === "ArrowUp"
            ) {
                event.preventDefault();

                openMenu();

                getSelectedOption()
                    ?.focus();
            }
        }
    );


    options.forEach(
        (option) => {

            option.addEventListener(
                "click",
                () => {
                    selectCategory(
                        option
                    );
                }
            );


            option.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key
                        === "ArrowDown"
                    ) {
                        event.preventDefault();

                        moveOptionFocus(
                            option,
                            1
                        );
                    }


                    if (
                        event.key
                        === "ArrowUp"
                    ) {
                        event.preventDefault();

                        moveOptionFocus(
                            option,
                            -1
                        );
                    }


                    if (
                        event.key
                        === "Enter"
                        || event.key
                        === " "
                    ) {
                        event.preventDefault();

                        selectCategory(
                            option
                        );
                    }


                    if (
                        event.key
                        === "Escape"
                    ) {
                        event.preventDefault();

                        closeMenu();

                        trigger.focus();
                    }


                    if (
                        event.key
                        === "Home"
                    ) {
                        event.preventDefault();

                        options[0]
                            .focus();
                    }


                    if (
                        event.key
                        === "End"
                    ) {
                        event.preventDefault();

                        options[
                            options.length - 1
                        ].focus();
                    }
                }
            );
        }
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                !menu.contains(
                    event.target
                )
            ) {
                closeMenu();
            }
        }
    );


    const selectedOption =
        getSelectedOption();


    if (
        selectedOption
    ) {
        trigger.dataset.category =
            selectedOption.dataset.category;
    }
}


/* =========================================================
   Recent Thoughts Timer
   ========================================================= */

function startRecentThoughtTimerUpdates() {
    updateRecentThoughtTimers();


    window.setInterval(
        () => {
            renderRecentThoughts();

            updateRecentThoughtTimers();
        },
        60_000
    );
}


document.addEventListener(
    "DOMContentLoaded",
    initializeDiscover
);