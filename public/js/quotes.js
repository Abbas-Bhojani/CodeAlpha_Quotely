/**
 * QUOTELY — Quote Presentation
 *
 * Controls featured quote presentation and Recent Thoughts.
 *
 * This module never calls the external quote API.
 */

import {
    defaultCuratedQuote
} from "../assets/data/curated-quotes.js";

import {
    getLastDisplayedQuote,
    saveLastDisplayedQuote,
    getRecentThoughts
} from "./storage.js";

import {
    refreshSaveButtons
} from "./saved-thoughts.js";


/* ---------------------------------------------------------
   Featured quote
   --------------------------------------------------------- */

export function displayFeaturedQuote(quote) {
    if (!quote) {
        return;
    }

    const quoteElement =
        document.querySelector(
            "#featured-quote-text"
        );

    const authorElement =
        document.querySelector(
            "#featured-quote-author"
        );

    const categoryValue =
        document.querySelector(
            "#category-menu-value"
        );

    const categoryTrigger =
        document.querySelector(
            "#category-menu-trigger"
        );

    const categoryOptions =
        document.querySelectorAll(
            ".category-menu__option"
        );


    if (
        !quoteElement
        || !authorElement
    ) {
        return;
    }


    quoteElement.textContent =
        quote.quote;

    authorElement.textContent =
        `— ${quote.author}`;


    /*
     * Restoring a quote should also reflect its category in
     * the custom category selector.
     */
    if (quote.category) {
        const normalizedCategory =
            quote.category.toLowerCase();

        const matchingOption =
            Array
                .from(categoryOptions)
                .find((option) => {
                    return (
                        option.dataset.category
                        === normalizedCategory
                    );
                });


        if (
            matchingOption
            && categoryValue
            && categoryTrigger
        ) {
            categoryOptions.forEach(
                (option) => {
                    option.setAttribute(
                        "aria-selected",
                        option === matchingOption
                            ? "true"
                            : "false"
                    );
                }
            );

            categoryValue.textContent =
                matchingOption.textContent.trim();

            categoryTrigger.dataset.category =
                normalizedCategory;
        }
    }


    saveLastDisplayedQuote(
        quote
    );


    /*
     * The featured quote may already exist in the visitor's
     * persistent Saved Thoughts collection.
     *
     * Refreshing here makes sure the SAVE/SAVED label follows
     * the quote whenever a Recent Thought is restored.
     */
    refreshSaveButtons();
}


export function resolveInitialQuote() {
    const restoredQuote =
        getLastDisplayedQuote();


    if (
        restoredQuote
        && restoredQuote.quote
        && restoredQuote.author
    ) {
        return restoredQuote;
    }


    return defaultCuratedQuote;
}


/* ---------------------------------------------------------
   Remaining time
   --------------------------------------------------------- */

export function formatRemainingTime(
    expiresAt
) {
    const remainingMilliseconds =
        Math.max(
            0,
            Number(expiresAt)
            - Date.now()
        );

    const totalMinutes =
        Math.floor(
            remainingMilliseconds
            / 60000
        );

    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;


    return (
        `${hours}h `
        + `${String(minutes).padStart(2, "0")}m left`
    );
}


/* ---------------------------------------------------------
   Recent Thought element
   --------------------------------------------------------- */

function createRecentThoughtElement(
    thought,
    index
) {
    const article =
        document.createElement(
            "article"
        );

    article.className =
        "recent-thought";

    article.dataset.quoteId =
        thought.id;


    /* Top */

    const topRow =
        document.createElement(
            "div"
        );

    topRow.className =
        "recent-thought__top";


    const number =
        document.createElement(
            "p"
        );

    number.className =
        "recent-thought__number";

    number.textContent =
        String(index + 1)
            .padStart(2, "0");


    const category =
        document.createElement(
            "p"
        );

    category.className =
        "recent-thought__category";

    category.textContent =
        thought.category
            ?.toUpperCase()
        || "RANDOM";


    topRow.append(
        number,
        category
    );


    /* Quote restoration */

    const restoreButton =
        document.createElement(
            "button"
        );

    restoreButton.className =
        "recent-thought__restore";

    restoreButton.type =
        "button";

    restoreButton.setAttribute(
        "aria-label",
        `Restore quote by ${thought.author}`
    );


    const blockquote =
        document.createElement(
            "blockquote"
        );

    blockquote.className =
        "recent-thought__blockquote";


    const quote =
        document.createElement(
            "p"
        );

    quote.className =
        "recent-thought__quote";

    quote.textContent =
        thought.quote;


    const author =
        document.createElement(
            "footer"
        );

    author.className =
        "recent-thought__author";

    author.textContent =
        `— ${thought.author}`;


    blockquote.append(
        quote,
        author
    );

    restoreButton.append(
        blockquote
    );


    /* Bottom */

    const bottomRow =
        document.createElement(
            "div"
        );

    bottomRow.className =
        "recent-thought__bottom";


    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "recent-thought__actions";


    /*
     * SAVE receives the quote ID directly.
     *
     * This allows saved-thoughts.js to identify exactly which
     * Recent Thought should be persisted in D1.
     */
    const saveButton =
        createActionButton(
            "SAVE",
            "save",
            thought.id
        );

    const copyButton =
        createActionButton(
            "COPY",
            "copy"
        );

    const shareButton =
        createActionButton(
            "SHARE",
            "share"
        );


    actions.append(
        saveButton,
        copyButton,
        shareButton
    );


    const timer =
        document.createElement(
            "time"
        );

    timer.className =
        "recent-thought__timer";

    timer.dataset.expiresAt =
        thought.expiresAt;

    timer.textContent =
        formatRemainingTime(
            thought.expiresAt
        );


    bottomRow.append(
        actions,
        timer
    );


    restoreButton.addEventListener(
        "click",
        () => {
            displayFeaturedQuote(
                thought
            );

            document
                .querySelector(
                    ".featured-quote"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
        }
    );


    article.append(
        topRow,
        restoreButton,
        bottomRow
    );


    return article;
}


/**
 * Creates a Recent Thought action button.
 *
 * quoteId is only needed by actions that must identify the
 * exact Recent Thought, such as SAVE.
 */
function createActionButton(
    label,
    action,
    quoteId = null
) {
    const button =
        document.createElement(
            "button"
        );

    button.className =
        "quote-action";

    button.type =
        "button";

    button.textContent =
        label;

    button.dataset.quoteAction =
        action;


    if (quoteId !== null) {
        button.dataset.quoteId =
            quoteId;
    }


    return button;
}


/* ---------------------------------------------------------
   Recent Thoughts rendering
   --------------------------------------------------------- */

export function renderRecentThoughts() {
    const grid =
        document.querySelector(
            "#recent-thoughts-grid"
        );

    const emptyState =
        document.querySelector(
            "#recent-thoughts-empty"
        );


    if (!grid) {
        return;
    }


    const thoughts =
        getRecentThoughts();


    grid.replaceChildren();


    thoughts.forEach(
        (thought, index) => {
            grid.append(
                createRecentThoughtElement(
                    thought,
                    index
                )
            );
        }
    );


    if (emptyState) {
        emptyState.hidden =
            thoughts.length > 0;
    }


    /*
     * Recent Thoughts have just been rebuilt in the DOM.
     * Apply their current persistent SAVE/SAVED states.
     */
    refreshSaveButtons();
}


export function updateRecentThoughtTimers() {
    const timers =
        document.querySelectorAll(
            ".recent-thought__timer"
        );


    timers.forEach(
        (timer) => {
            timer.textContent =
                formatRemainingTime(
                    Number(
                        timer.dataset.expiresAt
                    )
                );
        }
    );
}