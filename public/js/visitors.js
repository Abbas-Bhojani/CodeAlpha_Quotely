/**
 * QUOTELY — Visitor Identity
 *
 * Handles:
 * - returning visitor sessions
 * - new visitor creation
 * - visitor display names
 * - recovery using Visitor ID + recovery code
 * - one-time recovery credential display
 */


/* =========================================================
   Backend
   ========================================================= */

const API_BASE_URL =
    "https://worker.quotelysite.workers.dev";


/* =========================================================
   Local Storage
   ========================================================= */

const STORAGE_KEYS = {

    visitorId:
        "quotely:visitorId",

    sessionToken:
        "quotely:visitorSession",

    displayName:
        "quotely:visitorName"
};


/* =========================================================
   Runtime State
   ========================================================= */

let currentVisitor =
    null;


/*
 * Tells the name dialog what it is currently doing.
 *
 * "create"  → new visitor
 * "upgrade" → existing visitor without a name
 */
let nameDialogMode =
    "create";


export function getCurrentVisitor() {
    return currentVisitor;
}


/* =========================================================
   Local Identity
   ========================================================= */

function getStoredIdentity() {
    const visitorId =
        localStorage.getItem(
            STORAGE_KEYS.visitorId
        );


    const sessionToken =
        localStorage.getItem(
            STORAGE_KEYS.sessionToken
        );


    if (
        !visitorId
        || !sessionToken
    ) {
        return null;
    }


    return {
        visitorId,
        sessionToken
    };
}


function saveIdentity(
    visitorId,
    sessionToken,
    displayName = null
) {
    localStorage.setItem(
        STORAGE_KEYS.visitorId,
        visitorId
    );


    localStorage.setItem(
        STORAGE_KEYS.sessionToken,
        sessionToken
    );


    if (displayName) {
        localStorage.setItem(
            STORAGE_KEYS.displayName,
            displayName
        );
    }
}


function saveDisplayName(
    displayName
) {
    localStorage.setItem(
        STORAGE_KEYS.displayName,
        displayName
    );
}


/* =========================================================
   Backend — Session Verification
   ========================================================= */

async function verifyStoredVisitor(
    identity
) {
    const response =
        await fetch(
            `${API_BASE_URL}/api/visitors/me`,
            {
                headers: {
                    Authorization:
                        `Bearer ${identity.sessionToken}`
                }
            }
        );


    if (!response.ok) {
        return null;
    }


    const data =
        await response.json();


    return {

        visitorId:
            data.visitor.visitorId,

        displayName:
            data.visitor.displayName
            || null,

        sessionToken:
            identity.sessionToken
    };
}


/* =========================================================
   Backend — New Visitor
   ========================================================= */

async function createVisitor(
    displayName
) {
    const response =
        await fetch(
            `${API_BASE_URL}/api/visitors`,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        displayName
                    })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {
        throw new Error(
            data.error
            || "QUOTELY could not create a visitor."
        );
    }


    return data.visitor;
}


/* =========================================================
   Backend — Save Name
   ========================================================= */

async function saveVisitorName(
    displayName
) {
    const sessionToken =
        localStorage.getItem(
            STORAGE_KEYS.sessionToken
        );


    if (!sessionToken) {
        throw new Error(
            "Visitor identity is unavailable."
        );
    }


    const response =
        await fetch(
            `${API_BASE_URL}/api/visitors/name`,
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
                        displayName
                    })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {
        throw new Error(
            data.error
            || "QUOTELY could not save your name."
        );
    }


    return data.visitor;
}


/* =========================================================
   Backend — Recovery
   ========================================================= */

async function recoverVisitor(
    visitorId,
    recoveryCode
) {
    const response =
        await fetch(
            `${API_BASE_URL}/api/recovery`,
            {
                method:
                    "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({
                        visitorId,
                        recoveryCode
                    })
            }
        );


    const data =
        await response.json();


    if (!response.ok) {
        throw new Error(
            data.error
            || "QUOTELY could not recover this visitor."
        );
    }


    return data.visitor;
}


/* =========================================================
   Identity Initialization
   ========================================================= */

export async function initializeVisitorIdentity() {
    const storedIdentity =
        getStoredIdentity();


    /*
     * Returning browser.
     */
    if (storedIdentity) {

        try {

            const visitor =
                await verifyStoredVisitor(
                    storedIdentity
                );


            if (visitor) {

                currentVisitor =
                    visitor;


                saveIdentity(
                    visitor.visitorId,
                    visitor.sessionToken,
                    visitor.displayName
                );


                updateVisitorInterface(
                    visitor.visitorId
                );


                /*
                 * Older QUOTELY visitors were created before
                 * display names existed.
                 *
                 * Ask once and upgrade the same identity.
                 */
                if (!visitor.displayName) {

                    nameDialogMode =
                        "upgrade";


                    openNameDialog(
                        false
                    );
                }


                return visitor;
            }


            updateVisitorStatus(
                "SESSION NEEDS RECOVERY"
            );


            openRecoveryDialog();


            return null;


        } catch (error) {

            console.error(
                "QUOTELY could not verify the visitor.",
                error
            );


            updateVisitorStatus(
                "IDENTITY UNAVAILABLE"
            );


            return null;
        }
    }


    /*
     * Completely new browser.
     */
    openIdentityChoiceDialog();


    return null;
}


/* =========================================================
   Name Dialog
   ========================================================= */

function openNameDialog(
    allowBack = true
) {
    const input =
        document.querySelector(
            "#visitor-display-name"
        );


    const backButton =
        document.querySelector(
            "#visitor-name-back"
        );


    const errorElement =
        document.querySelector(
            "#visitor-name-error"
        );


    if (input) {
        input.value = "";
    }


    if (errorElement) {
        errorElement.textContent = "";
    }


    /*
     * Existing nameless visitors cannot simply skip this
     * because share attribution depends on it.
     */
    if (backButton) {
        backButton.hidden =
            !allowBack;
    }


    openDialog(
        "#visitor-name-dialog"
    );


    window.setTimeout(
        () => {
            input?.focus();
        },
        50
    );
}


async function handleNameSubmit(
    event
) {
    event.preventDefault();


    const input =
        document.querySelector(
            "#visitor-display-name"
        );


    const button =
        document.querySelector(
            "#visitor-name-submit"
        );


    const errorElement =
        document.querySelector(
            "#visitor-name-error"
        );


    const displayName =
        input
            ?.value
            .trim()
        || "";


    if (!displayName) {

        if (errorElement) {
            errorElement.textContent =
                "Enter the name you want QUOTELY to use.";
        }


        return;
    }


    setButtonBusy(
        button,
        true,
        "SAVING..."
    );


    if (errorElement) {
        errorElement.textContent = "";
    }


    try {

        /*
         * Brand-new visitor.
         */
        if (
            nameDialogMode === "create"
        ) {

            const visitor =
                await createVisitor(
                    displayName
                );


            saveIdentity(
                visitor.visitorId,
                visitor.sessionToken,
                visitor.displayName
            );


            currentVisitor = {

                visitorId:
                    visitor.visitorId,

                displayName:
                    visitor.displayName,

                sessionToken:
                    visitor.sessionToken
            };


            updateVisitorInterface(
                visitor.visitorId
            );


            closeDialog(
                "#visitor-name-dialog"
            );


            showVisitorCredentials(
                visitor
            );


            return;
        }


        /*
         * Existing visitor created before display names.
         */
        const updatedVisitor =
            await saveVisitorName(
                displayName
            );


        saveDisplayName(
            updatedVisitor.displayName
        );


        if (currentVisitor) {
            currentVisitor.displayName =
                updatedVisitor.displayName;
        }


        closeDialog(
            "#visitor-name-dialog"
        );


    } catch (error) {

        if (errorElement) {
            errorElement.textContent =
                error.message;
        }


    } finally {

        setButtonBusy(
            button,
            false,
            "CONTINUE"
        );
    }
}


/* =========================================================
   Create New Identity
   ========================================================= */

function handleCreateVisitor() {

    showChoiceError("");


    /*
     * Do not consume a Visitor ID yet.
     *
     * First ask for the display name.
     */
    closeDialog(
        "#identity-choice-dialog"
    );


    nameDialogMode =
        "create";


    openNameDialog(
        true
    );
}


/* =========================================================
   Recover Identity
   ========================================================= */

async function handleRecoverySubmit(
    event
) {
    event.preventDefault();


    const visitorIdInput =
        document.querySelector(
            "#recovery-visitor-id"
        );


    const recoveryCodeInput =
        document.querySelector(
            "#recovery-code"
        );


    const errorElement =
        document.querySelector(
            "#recovery-error"
        );


    const button =
        document.querySelector(
            "#recovery-submit"
        );


    const visitorId =
        visitorIdInput
            ?.value
            .trim();


    const recoveryCode =
        recoveryCodeInput
            ?.value
            .trim();


    if (
        !visitorId
        || !recoveryCode
    ) {

        showRecoveryError(
            "Enter your Visitor ID and recovery code."
        );


        return;
    }


    showRecoveryError("");


    setButtonBusy(
        button,
        true,
        "RECOVERING..."
    );


    try {

        const visitor =
            await recoverVisitor(
                visitorId,
                recoveryCode
            );


        saveIdentity(
            visitor.visitorId,
            visitor.sessionToken,
            visitor.displayName
        );


        currentVisitor = {

            visitorId:
                visitor.visitorId,

            displayName:
                visitor.displayName
                || null,

            sessionToken:
                visitor.sessionToken
        };


        updateVisitorInterface(
            visitor.visitorId
        );


        closeDialog(
            "#recovery-dialog"
        );


        if (visitorIdInput) {
            visitorIdInput.value = "";
        }


        if (recoveryCodeInput) {
            recoveryCodeInput.value = "";
        }


        /*
         * Old identities may still need a display name.
         */
        if (!visitor.displayName) {

            nameDialogMode =
                "upgrade";


            openNameDialog(
                false
            );


            return;
        }


        showRecoverySuccess(
            visitor.visitorId,
            visitor.displayName
        );


    } catch (error) {

        if (errorElement) {
            errorElement.textContent =
                error.message;
        }


    } finally {

        setButtonBusy(
            button,
            false,
            "RECOVER VISITOR"
        );
    }
}


/* =========================================================
   Masthead
   ========================================================= */

function updateVisitorInterface(
    visitorId
) {
    const display =
        document.querySelector(
            "#visitor-id-display"
        );


    const status =
        document.querySelector(
            "#visitor-status"
        );


    if (display) {
        display.textContent =
            visitorId;
    }


    if (status) {
        status.classList.remove(
            "visitor-status--warning"
        );
    }
}


function updateVisitorStatus(
    message
) {
    const status =
        document.querySelector(
            "#visitor-status"
        );


    if (!status) {
        return;
    }


    status.textContent =
        message;


    status.classList.add(
        "visitor-status--warning"
    );
}


/* =========================================================
   Identity Choice Dialog
   ========================================================= */

function openIdentityChoiceDialog() {

    openDialog(
        "#identity-choice-dialog"
    );
}


function showChoiceError(
    message
) {
    const element =
        document.querySelector(
            "#identity-choice-error"
        );


    if (element) {
        element.textContent =
            message;
    }
}


/* =========================================================
   Recovery Dialog
   ========================================================= */

function openRecoveryDialog() {

    showRecoveryError("");


    openDialog(
        "#recovery-dialog"
    );
}


function showRecoveryError(
    message
) {
    const element =
        document.querySelector(
            "#recovery-error"
        );


    if (element) {
        element.textContent =
            message;
    }
}


/* =========================================================
   Credential Reveal
   ========================================================= */

function showVisitorCredentials(
    visitor
) {
    const dialog =
        document.querySelector(
            "#visitor-dialog"
        );


    const idElement =
        document.querySelector(
            "#visitor-dialog-id"
        );


    const recoveryElement =
        document.querySelector(
            "#visitor-dialog-recovery"
        );


    if (
        !dialog
        || !idElement
        || !recoveryElement
    ) {
        return;
    }


    idElement.textContent =
        visitor.visitorId;


    recoveryElement.textContent =
        visitor.recoveryCode;


    dialog.dataset.visitorId =
        visitor.visitorId;


    dialog.dataset.displayName =
        visitor.displayName;


    dialog.dataset.recoveryCode =
        visitor.recoveryCode;


    openDialog(
        "#visitor-dialog"
    );
}


/* =========================================================
   Recovery Success
   ========================================================= */

function showRecoverySuccess(
    visitorId,
    displayName
) {
    const idElement =
        document.querySelector(
            "#recovery-success-id"
        );


    if (idElement) {
        idElement.textContent =
            visitorId;
    }


    openDialog(
        "#recovery-success-dialog"
    );
}


/* =========================================================
   Recovery File
   ========================================================= */

function downloadRecoveryFile(
    displayName,
    visitorId,
    recoveryCode
) {
    const text =
        [
            "QUOTELY — Visitor Recovery",
            "",
            `Name: ${displayName}`,
            `Visitor ID: ${visitorId}`,
            `Recovery Code: ${recoveryCode}`,
            "",
            "Keep this file private.",
            "",
            "Use these details to recover your QUOTELY identity on another device.",
            "",
            "QUOTELY"
        ].join("\n");


    const blob =
        new Blob(
            [text],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `quotely-recovery-${visitorId}.txt`;


    document.body.append(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );
}


/* =========================================================
   Dialog Helpers
   ========================================================= */

function openDialog(
    selector
) {
    const dialog =
        document.querySelector(
            selector
        );


    if (!dialog) {
        return;
    }


    if (
        typeof dialog.showModal
        === "function"
    ) {
        dialog.showModal();

    } else {

        dialog.setAttribute(
            "open",
            ""
        );
    }
}


function closeDialog(
    selector
) {
    const dialog =
        document.querySelector(
            selector
        );


    if (!dialog) {
        return;
    }


    if (
        typeof dialog.close
        === "function"
    ) {
        dialog.close();

    } else {

        dialog.removeAttribute(
            "open"
        );
    }
}


function setButtonBusy(
    button,
    busy,
    label
) {
    if (!button) {
        return;
    }


    button.disabled =
        busy;


    button.textContent =
        label;
}


/* =========================================================
   UI Initialization
   ========================================================= */

export function initializeVisitorDialog() {

    /* New visitor */

    document
        .querySelector(
            "#create-visitor-button"
        )
        ?.addEventListener(
            "click",
            handleCreateVisitor
        );


    /* Name */

    document
        .querySelector(
            "#visitor-name-form"
        )
        ?.addEventListener(
            "submit",
            handleNameSubmit
        );


    document
        .querySelector(
            "#visitor-name-back"
        )
        ?.addEventListener(
            "click",
            () => {

                closeDialog(
                    "#visitor-name-dialog"
                );


                if (
                    nameDialogMode
                    === "create"
                ) {
                    openIdentityChoiceDialog();
                }
            }
        );


    /* Recover existing visitor */

    document
        .querySelector(
            "#recover-existing-button"
        )
        ?.addEventListener(
            "click",
            () => {

                closeDialog(
                    "#identity-choice-dialog"
                );


                openRecoveryDialog();
            }
        );


    /* Recovery */

    document
        .querySelector(
            "#recovery-form"
        )
        ?.addEventListener(
            "submit",
            handleRecoverySubmit
        );


    document
        .querySelector(
            "#recovery-back"
        )
        ?.addEventListener(
            "click",
            () => {

                closeDialog(
                    "#recovery-dialog"
                );


                if (!getStoredIdentity()) {
                    openIdentityChoiceDialog();
                }
            }
        );


    /* Credential reveal */

    document
        .querySelector(
            "#visitor-dialog-close"
        )
        ?.addEventListener(
            "click",
            () => {

                closeDialog(
                    "#visitor-dialog"
                );
            }
        );


    document
        .querySelector(
            "#visitor-dialog-close-secondary"
        )
        ?.addEventListener(
            "click",
            () => {

                closeDialog(
                    "#visitor-dialog"
                );
            }
        );


    document
        .querySelector(
            "#visitor-recovery-download"
        )
        ?.addEventListener(
            "click",
            () => {

                const dialog =
                    document.querySelector(
                        "#visitor-dialog"
                    );


                const visitorId =
                    dialog
                        ?.dataset
                        .visitorId;


                const displayName =
                    dialog
                        ?.dataset
                        .displayName;


                const recoveryCode =
                    dialog
                        ?.dataset
                        .recoveryCode;


                if (
                    !visitorId
                    || !displayName
                    || !recoveryCode
                ) {
                    return;
                }


                downloadRecoveryFile(
                    displayName,
                    visitorId,
                    recoveryCode
                );
            }
        );


    /* Recovery success */

    document
        .querySelector(
            "#recovery-success-close"
        )
        ?.addEventListener(
            "click",
            () => {

                closeDialog(
                    "#recovery-success-dialog"
                );
            }
        );
}