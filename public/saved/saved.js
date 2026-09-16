/**
 * QUOTELY — Saved Thoughts
 *
 * Displays the authenticated visitor's permanent collection.
 *
 * This page never generates or requests a new quote.
 */


/* =========================================================
   Configuration
   ========================================================= */

const API_BASE_URL =
    "https://worker.quotelysite.workers.dev";


const STORAGE_KEYS = {

    session:
        "quotely:visitorSession",

    visitorId:
        "quotely:visitorId",

    visitorName:
        "quotely:visitorName"
};


const SHARE_WIDTH =
    1080;

const SHARE_HEIGHT =
    1350;


/* =========================================================
   Runtime State
   ========================================================= */

let savedThoughts =
    [];

let activeShareThought =
    null;


/* =========================================================
   Visitor Identity
   ========================================================= */

function getSessionToken() {
    return localStorage.getItem(
        STORAGE_KEYS.session
    );
}


function getVisitorId() {
    return localStorage.getItem(
        STORAGE_KEYS.visitorId
    );
}


function getVisitorName() {
    return localStorage.getItem(
        STORAGE_KEYS.visitorName
    );
}


function renderVisitorId() {
    const element =
        document.querySelector(
            "#saved-visitor-id"
        );


    const visitorId =
        getVisitorId();


    if (
        element
        && visitorId
    ) {
        element.textContent =
            visitorId;
    }
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
   Daily Edition Date
   ========================================================= */

function renderEditionDate() {
    const element =
        document.querySelector(
            "#saved-edition-date"
        );


    if (!element) {
        return;
    }


    element.textContent =
        new Date()
            .toLocaleDateString(
                "en-US",
                {
                    month:
                        "short",

                    day:
                        "2-digit",

                    year:
                        "numeric"
                }
            )
            .toUpperCase();
}


/* =========================================================
   Backend
   ========================================================= */

async function loadSavedThoughts() {
    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        throw new Error(
            "Your Visitor identity is not available on this browser."
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


    if (
        response.status === 401
    ) {
        throw new Error(
            "Your Visitor session needs recovery. Return to Discover to recover it."
        );
    }


    if (!response.ok) {
        throw new Error(
            "QUOTELY could not open your collection."
        );
    }


    const data =
        await response.json();


    return Array.isArray(
        data.thoughts
    )
        ? data.thoughts
        : [];
}


async function removeSavedThought(
    thoughtId
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
            `${API_BASE_URL}/api/saved-thoughts/${thoughtId}`,
            {
                method:
                    "DELETE",

                headers: {
                    Authorization:
                        `Bearer ${sessionToken}`
                }
            }
        );


    let data =
        {};


    try {
        data =
            await response.json();

    } catch {
        data =
            {};
    }


    if (!response.ok) {
        throw new Error(
            data.error
            || "This thought could not be removed."
        );
    }


    return data;
}


/* =========================================================
   Page State Controller

   Only one application state is visible at a time.

   loading
   error
   empty
   ready
   ========================================================= */

function setPageState(
    state
) {
    const loading =
        document.querySelector(
            "#saved-loading"
        );


    const error =
        document.querySelector(
            "#saved-error"
        );


    const empty =
        document.querySelector(
            "#saved-empty"
        );


    const grid =
        document.querySelector(
            "#saved-grid"
        );


    if (loading) {
        loading.hidden =
            state !== "loading";
    }


    if (error) {
        error.hidden =
            state !== "error";
    }


    if (empty) {
        empty.hidden =
            state !== "empty";
    }


    if (grid) {
        grid.hidden =
            state !== "ready";
    }
}


function showError(
    message
) {
    const messageElement =
        document.querySelector(
            "#saved-error-message"
        );


    if (messageElement) {
        messageElement.textContent =
            message;
    }


    setPageState(
        "error"
    );
}


/* =========================================================
   Saved Count
   ========================================================= */

function updateCount() {
    const element =
        document.querySelector(
            "#saved-count"
        );


    if (!element) {
        return;
    }


    const count =
        savedThoughts.length;


    element.textContent =
        `${count} ${
            count === 1
                ? "SAVED THOUGHT"
                : "SAVED THOUGHTS"
        }`;
}


/* =========================================================
   Rendering
   ========================================================= */

function renderSavedThoughts() {
    const grid =
        document.querySelector(
            "#saved-grid"
        );


    if (!grid) {
        return;
    }


    grid.replaceChildren();


    updateCount();


    if (
        savedThoughts.length === 0
    ) {

        setPageState(
            "empty"
        );


        return;
    }


    savedThoughts.forEach(
        (thought, index) => {

            grid.append(
                createSavedThoughtElement(
                    thought,
                    index
                )
            );
        }
    );


    setPageState(
        "ready"
    );
}


/* =========================================================
   Thought Element
   ========================================================= */

function createSavedThoughtElement(
    thought,
    index
) {
    const article =
        document.createElement(
            "article"
        );


    article.className =
        "saved-thought";


    article.dataset.savedId =
        String(
            thought.id
        );


    /* ---------------------------------------------
       Metadata
       --------------------------------------------- */

    const top =
        document.createElement(
            "div"
        );


    top.className =
        "saved-thought__top";


    const number =
        document.createElement(
            "p"
        );


    number.className =
        "saved-thought__number";


    number.textContent =
        String(
            index + 1
        ).padStart(
            2,
            "0"
        );


    const category =
        document.createElement(
            "p"
        );


    category.className =
        "saved-thought__category";


    category.textContent =
        (
            thought.category
            || "random"
        ).toUpperCase();


    top.append(
        number,
        category
    );


    /* ---------------------------------------------
       Quote
       --------------------------------------------- */

    const blockquote =
        document.createElement(
            "blockquote"
        );


    const quoteText =
        document.createElement(
            "p"
        );


    quoteText.className =
        "saved-thought__quote";


    quoteText.textContent =
        thought.quote
        || "";


    const author =
        document.createElement(
            "footer"
        );


    author.className =
        "saved-thought__author";


    author.textContent =
        `— ${thought.author || "Unknown"}`;


    blockquote.append(
        quoteText,
        author
    );


    /* ---------------------------------------------
       Footer
       --------------------------------------------- */

    const bottom =
        document.createElement(
            "div"
        );


    bottom.className =
        "saved-thought__bottom";


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "saved-thought__actions";


    actions.append(
        createActionButton(
            "UNSAVE",
            "unsave"
        ),

        createActionButton(
            "COPY",
            "copy"
        ),

        createActionButton(
            "SHARE",
            "share"
        )
    );


    const date =
        document.createElement(
            "p"
        );


    date.className =
        "saved-thought__date";


    date.textContent =
        formatSavedDate(
            thought.savedAt
        );


    bottom.append(
        actions,
        date
    );


    article.append(
        top,
        blockquote,
        bottom
    );


    return article;
}


function createActionButton(
    label,
    action
) {
    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "saved-thought__action";


    button.dataset.savedAction =
        action;


    button.textContent =
        label;


    return button;
}


/* =========================================================
   Dates
   ========================================================= */

function formatSavedDate(
    value
) {
    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


    return (
        `SAVED ${
            date
                .toLocaleDateString(
                    "en-US",
                    {
                        month:
                            "short",

                        day:
                            "2-digit",

                        year:
                            "numeric"
                    }
                )
                .toUpperCase()
        }`
    );
}


/* =========================================================
   Unsave
   ========================================================= */

async function handleUnsave(
    thought,
    button
) {
    if (
        button.disabled
    ) {
        return;
    }


    button.disabled =
        true;


    button.textContent =
        "REMOVING...";


    try {

        await removeSavedThought(
            thought.id
        );


        savedThoughts =
            savedThoughts.filter(
                (item) =>
                    String(
                        item.id
                    )
                    !== String(
                        thought.id
                    )
            );


        renderSavedThoughts();


    } catch (error) {

        console.error(
            "QUOTELY could not remove the thought.",
            error
        );


        button.textContent =
            "TRY AGAIN";


        button.disabled =
            false;
    }
}


/* =========================================================
   Copy
   ========================================================= */

function formatQuoteText(
    thought
) {
    return (
        `${thought.quote}\n`
        + `- ${thought.author}`
    );
}


async function handleCopy(
    thought,
    button
) {
    try {

        await navigator.clipboard
            .writeText(
                formatQuoteText(
                    thought
                )
            );


        const originalLabel =
            button.textContent;


        button.textContent =
            "COPIED";


        window.setTimeout(
            () => {

                if (
                    document.body.contains(
                        button
                    )
                ) {
                    button.textContent =
                        originalLabel;
                }
            },
            1400
        );


    } catch (error) {

        console.warn(
            "QUOTELY could not copy the thought.",
            error
        );
    }
}


/* =========================================================
   Share Canvas
   ========================================================= */

async function createShareCanvas(
    thought
) {
    if (
        document.fonts
        && document.fonts.ready
    ) {
        await document.fonts.ready;
    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        SHARE_WIDTH;


    canvas.height =
        SHARE_HEIGHT;


    const context =
        canvas.getContext(
            "2d"
        );


    if (!context) {
        return null;
    }


    /* Paper */

    context.fillStyle =
        "#f2f6f8";


    context.fillRect(
        0,
        0,
        SHARE_WIDTH,
        SHARE_HEIGHT
    );


    /* Upper Rule */

    context.strokeStyle =
        "#8297a3";


    context.lineWidth =
        2;


    context.beginPath();


    context.moveTo(
        90,
        150
    );


    context.lineTo(
        990,
        150
    );


    context.stroke();


    /* Category */

    context.fillStyle =
        "#344754";


    context.font =
        '600 26px "Inter", Arial, sans-serif';


    context.textAlign =
        "left";


    context.fillText(
        (
            thought.category
            || "random"
        ).toUpperCase(),
        90,
        110
    );


    /* Masthead */

    context.fillStyle =
        "#101c24";


    context.font =
        '700 29px "Inter", Arial, sans-serif';


    context.textAlign =
        "right";


    context.fillText(
        "QUOTELY",
        990,
        110
    );


    /* Quote */

    drawShareQuote(
        context,
        thought.quote || "",
        thought.author || "Unknown"
    );


    /* Lower Rule */

    context.strokeStyle =
        "#becbd2";


    context.beginPath();


    context.moveTo(
        90,
        1195
    );


    context.lineTo(
        990,
        1195
    );


    context.stroke();


    /* Attribution */

    const visitorName =
        getVisitorName();


    context.fillStyle =
        "#6b7c87";


    context.font =
        '500 23px "Inter", Arial, sans-serif';


    context.textAlign =
        "center";


    context.fillText(
        visitorName
            ? `Generated by ${visitorName}`
            : "Generated by QUOTELY",
        SHARE_WIDTH / 2,
        1245
    );


    return canvas;
}


/* =========================================================
   Share Quote Typography
   ========================================================= */

function drawShareQuote(
    context,
    text,
    author
) {
    const maxWidth =
        820;


    const minimumFontSize =
        42;


    let fontSize =
        74;


    let lines =
        [];


    while (
        fontSize >= minimumFontSize
    ) {

        context.font =
            `500 ${fontSize}px "Cormorant Garamond", Georgia, serif`;


        lines =
            wrapCanvasText(
                context,
                text,
                maxWidth
            );


        const quoteHeight =
            lines.length
            * fontSize
            * 1.08;


        if (
            lines.length <= 7
            && quoteHeight <= 620
        ) {
            break;
        }


        fontSize -=
            4;
    }


    const lineHeight =
        fontSize * 1.08;


    const totalHeight =
        (
            lines.length
            * lineHeight
        )
        + 87;


    let y =
        (
            SHARE_HEIGHT
            - totalHeight
        )
        / 2
        + fontSize;


    context.fillStyle =
        "#101c24";


    context.font =
        `500 ${fontSize}px "Cormorant Garamond", Georgia, serif`;


    context.textAlign =
        "center";


    lines.forEach(
        (line) => {

            context.fillText(
                line,
                SHARE_WIDTH / 2,
                y
            );


            y +=
                lineHeight;
        }
    );


    y +=
        55;


    context.fillStyle =
        "#344754";


    context.font =
        '500 30px "Inter", Arial, sans-serif';


    context.fillText(
        `— ${author}`,
        SHARE_WIDTH / 2,
        y
    );
}


function wrapCanvasText(
    context,
    text,
    maxWidth
) {
    const words =
        String(
            text || ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    const lines =
        [];


    let line =
        "";


    words.forEach(
        (word) => {

            const candidate =
                line
                    ? `${line} ${word}`
                    : word;


            if (
                context
                    .measureText(
                        candidate
                    )
                    .width
                > maxWidth
                && line
            ) {

                lines.push(
                    line
                );


                line =
                    word;


            } else {

                line =
                    candidate;
            }
        }
    );


    if (line) {
        lines.push(
            line
        );
    }


    return lines;
}


/* =========================================================
   Share Dialog
   ========================================================= */

async function openShareDialog(
    thought
) {
    const dialog =
        document.querySelector(
            "#saved-share-dialog"
        );


    const preview =
        document.querySelector(
            "#saved-share-preview"
        );


    if (
        !dialog
        || !preview
    ) {
        return;
    }


    activeShareThought =
        thought;


    const canvas =
        await createShareCanvas(
            thought
        );


    if (!canvas) {
        return;
    }


    const context =
        preview.getContext(
            "2d"
        );


    if (!context) {
        return;
    }


    preview.width =
        canvas.width;


    preview.height =
        canvas.height;


    context.clearRect(
        0,
        0,
        preview.width,
        preview.height
    );


    context.drawImage(
        canvas,
        0,
        0
    );


    await updateNativeShareButton(
        canvas,
        thought
    );


    if (
        !dialog.open
    ) {
        dialog.showModal();
    }
}


/* =========================================================
   PNG Filename
   ========================================================= */

function normalizeFilenamePart(
    value
) {
    return String(
        value || ""
    )
        .toLowerCase()
        .trim()
        .normalize(
            "NFKD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );
}


function createShortThoughtId(
    thought
) {
    if (
        thought.id !== undefined
        && thought.id !== null
    ) {

        const normalizedId =
            normalizeFilenamePart(
                String(
                    thought.id
                )
            );


        if (normalizedId) {
            return normalizedId.slice(
                -8
            );
        }
    }


    const source =
        `${thought.quote || ""}|${thought.author || ""}`;


    let hash =
        0;


    for (
        let index = 0;
        index < source.length;
        index += 1
    ) {

        hash =
            (
                (
                    hash << 5
                )
                - hash
                + source.charCodeAt(
                    index
                )
            )
            | 0;
    }


    return Math
        .abs(
            hash
        )
        .toString(
            36
        )
        .slice(
            0,
            8
        )
        || "thought";
}


function createFilename(
    thought
) {
    const author =
        normalizeFilenamePart(
            thought.author
        )
        || "unknown";


    const shortId =
        createShortThoughtId(
            thought
        );


    return (
        `quotely-${author}-${shortId}.png`
    );
}


/* =========================================================
   Download
   ========================================================= */

async function downloadImage(
    thought
) {
    const canvas =
        await createShareCanvas(
            thought
        );


    if (!canvas) {
        return;
    }


    const link =
        document.createElement(
            "a"
        );


    link.download =
        createFilename(
            thought
        );


    link.href =
        canvas.toDataURL(
            "image/png"
        );


    document.body.append(
        link
    );


    link.click();


    link.remove();
}


/* =========================================================
   Native Sharing
   ========================================================= */

async function canvasToFile(
    canvas,
    thought
) {
    const blob =
        await new Promise(
            (resolve) => {

                canvas.toBlob(
                    resolve,
                    "image/png"
                );
            }
        );


    if (!blob) {
        return null;
    }


    return new File(
        [blob],
        createFilename(
            thought
        ),
        {
            type:
                "image/png"
        }
    );
}


async function updateNativeShareButton(
    canvas,
    thought
) {
    const button =
        document.querySelector(
            "#saved-native-share"
        );


    if (!button) {
        return;
    }


    button.hidden =
        true;


    if (
        typeof navigator.share
        !== "function"
        || typeof navigator.canShare
        !== "function"
    ) {
        return;
    }


    const file =
        await canvasToFile(
            canvas,
            thought
        );


    if (
        file
        && navigator.canShare({
            files: [
                file
            ]
        })
    ) {
        button.hidden =
            false;
    }
}


async function shareNatively(
    thought
) {
    const canvas =
        await createShareCanvas(
            thought
        );


    if (!canvas) {
        return;
    }


    const file =
        await canvasToFile(
            canvas,
            thought
        );


    if (!file) {
        return;
    }


    try {

        await navigator.share({
            files: [
                file
            ],

            title:
                "QUOTELY",

            text:
                formatQuoteText(
                    thought
                )
        });


    } catch (error) {

        if (
            error.name
            !== "AbortError"
        ) {

            console.warn(
                "QUOTELY sharing failed.",
                error
            );
        }
    }
}


/* =========================================================
   WhatsApp
   ========================================================= */

function shareWhatsApp(
    thought
) {
    const text =
        encodeURIComponent(
            formatQuoteText(
                thought
            )
        );


    window.open(
        `https://wa.me/?text=${text}`,
        "_blank",
        "noopener,noreferrer"
    );
}


/* =========================================================
   Events
   ========================================================= */

function initializeEvents() {
    const grid =
        document.querySelector(
            "#saved-grid"
        );


    const dialog =
        document.querySelector(
            "#saved-share-dialog"
        );


    grid?.addEventListener(
        "click",
        async (event) => {

            const target =
                event.target;


            if (
                !(target instanceof Element)
            ) {
                return;
            }


            const button =
                target.closest(
                    "[data-saved-action]"
                );


            if (!button) {
                return;
            }


            const article =
                button.closest(
                    ".saved-thought"
                );


            if (!article) {
                return;
            }


            const thought =
                savedThoughts.find(
                    (item) =>
                        String(
                            item.id
                        )
                        === String(
                            article.dataset.savedId
                        )
                );


            if (!thought) {
                return;
            }


            const action =
                button.dataset.savedAction;


            if (
                action === "unsave"
            ) {

                await handleUnsave(
                    thought,
                    button
                );


                return;
            }


            if (
                action === "copy"
            ) {

                await handleCopy(
                    thought,
                    button
                );


                return;
            }


            if (
                action === "share"
            ) {

                await openShareDialog(
                    thought
                );
            }
        }
    );


    document
        .querySelector(
            "#saved-share-close"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    dialog?.open
                ) {
                    dialog.close();
                }
            }
        );


    document
        .querySelector(
            "#saved-download-share"
        )
        ?.addEventListener(
            "click",
            async () => {

                if (
                    activeShareThought
                ) {

                    await downloadImage(
                        activeShareThought
                    );
                }
            }
        );


    document
        .querySelector(
            "#saved-whatsapp-share"
        )
        ?.addEventListener(
            "click",
            () => {

                if (
                    activeShareThought
                ) {

                    shareWhatsApp(
                        activeShareThought
                    );
                }
            }
        );


    document
        .querySelector(
            "#saved-native-share"
        )
        ?.addEventListener(
            "click",
            async () => {

                if (
                    activeShareThought
                ) {

                    await shareNatively(
                        activeShareThought
                    );
                }
            }
        );


    dialog?.addEventListener(
        "click",
        (event) => {

            if (
                event.target
                === dialog
                && dialog.open
            ) {
                dialog.close();
            }
        }
    );


    dialog?.addEventListener(
        "close",
        () => {

            activeShareThought =
                null;
        }
    );
}


/* =========================================================
   Start Page
   ========================================================= */

async function initializeSavedPage() {
    renderEditionDate();

    renderVisitorId();

    initializeEvents();


    /*
     * Begin with exactly one visible application state.
     */
    setPageState(
        "loading"
    );


    try {

        savedThoughts =
            await loadSavedThoughts();


        renderSavedThoughts();


    } catch (error) {

        console.error(
            "QUOTELY Saved Thoughts failed.",
            error
        );


        updateCount();


        showError(
            error instanceof Error
                ? error.message
                : "QUOTELY could not open your collection."
        );
    }
}


initializeSavedPage();