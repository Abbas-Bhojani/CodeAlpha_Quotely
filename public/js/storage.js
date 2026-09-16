/**
 * QUOTELY — Browser Storage
 *
 * This module owns the local browser state used by Discover.
 *
 * Keeping storage logic in one place prevents localStorage
 * calls from becoming scattered throughout the application.
 */

const LAST_DISPLAYED_QUOTE_KEY = "quotely:lastDisplayedQuote";
const RECENT_THOUGHTS_KEY = "quotely:recentThoughts";

const RECENT_THOUGHT_LIFETIME_MS = 24 * 60 * 60 * 1000;


/* ---------------------------------------------------------
   Safe localStorage helpers
   --------------------------------------------------------- */

/**
 * Reads JSON from localStorage.
 *
 * If stored data is missing or damaged, the provided fallback
 * is returned instead of allowing the application to crash.
 */
function readStorage(key, fallback) {
    try {
        const storedValue = localStorage.getItem(key);

        if (!storedValue) {
            return fallback;
        }

        return JSON.parse(storedValue);
    } catch (error) {
        console.warn(`QUOTELY could not read ${key}.`, error);

        return fallback;
    }
}


/**
 * Writes JSON to localStorage.
 */
function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));

        return true;
    } catch (error) {
        console.warn(`QUOTELY could not save ${key}.`, error);

        return false;
    }
}


/* ---------------------------------------------------------
   Last displayed quote
   --------------------------------------------------------- */

/**
 * Returns the quote that was last shown in the featured area.
 */
export function getLastDisplayedQuote() {
    return readStorage(LAST_DISPLAYED_QUOTE_KEY, null);
}


/**
 * Remembers the quote currently shown in the featured area.
 *
 * Restoring this quote later does not involve the external
 * quote API.
 */
export function saveLastDisplayedQuote(quote) {
    if (!quote) {
        return false;
    }

    return writeStorage(LAST_DISPLAYED_QUOTE_KEY, quote);
}


/* ---------------------------------------------------------
   Recent Thoughts
   --------------------------------------------------------- */

/**
 * Removes Recent Thoughts whose individual 24-hour expiry
 * time has already passed.
 */
export function removeExpiredRecentThoughts() {
    const now = Date.now();

    const recentThoughts = readStorage(
        RECENT_THOUGHTS_KEY,
        []
    );

    const activeThoughts = recentThoughts.filter((thought) => {
        return Number(thought.expiresAt) > now;
    });

    if (activeThoughts.length !== recentThoughts.length) {
        writeStorage(RECENT_THOUGHTS_KEY, activeThoughts);
    }

    return activeThoughts;
}


/**
 * Returns only Recent Thoughts that are still inside their
 * individual 24-hour window.
 */
export function getRecentThoughts() {
    return removeExpiredRecentThoughts();
}


/**
 * Adds a newly discovered external quote to Recent Thoughts.
 *
 * This function itself does not request a quote. Later, the
 * successful New Quote flow will call it after receiving one.
 */
export function addRecentThought(quote) {
    if (!quote) {
        return null;
    }

    const now = Date.now();

    const recentThought = {
        ...quote,
        discoveredAt: now,
        expiresAt: now + RECENT_THOUGHT_LIFETIME_MS
    };

    const currentThoughts = getRecentThoughts();

    /*
     * Keep the newest thought first.
     *
     * Duplicate IDs are removed so the same discovered quote
     * cannot accidentally appear twice.
     */
    const withoutDuplicate = currentThoughts.filter((thought) => {
        return thought.id !== recentThought.id;
    });

    const updatedThoughts = [
        recentThought,
        ...withoutDuplicate
    ];

    writeStorage(
        RECENT_THOUGHTS_KEY,
        updatedThoughts
    );

    return recentThought;
}