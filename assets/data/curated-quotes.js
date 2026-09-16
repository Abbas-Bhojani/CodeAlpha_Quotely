/**
 * QUOTELY — Curated Quotes
 *
 * These quotes belong to QUOTELY's built-in collection.
 * They allow a visitor to see a thoughtful quote without
 * making an external API request.
 *
 * Curated quotes do not count against the daily API allowance.
 */

export const curatedQuotes = [
    {
        id: "curated-wisdom-aristotle-001",
        quote: "Knowing yourself is the beginning of all wisdom.",
        author: "Aristotle",
        category: "Wisdom",
        source: "curated"
    },
    {
        id: "curated-life-confucius-001",
        quote: "Life is really simple, but we insist on making it complicated.",
        author: "Confucius",
        category: "Life",
        source: "curated"
    },
    {
        id: "curated-courage-seneca-001",
        quote: "We suffer more often in imagination than in reality.",
        author: "Seneca",
        category: "Courage",
        source: "curated"
    },
    {
        id: "curated-success-epictetus-001",
        quote: "First say to yourself what you would be; and then do what you have to do.",
        author: "Epictetus",
        category: "Success",
        source: "curated"
    },
    {
        id: "curated-happiness-marcus-aurelius-001",
        quote: "The happiness of your life depends upon the quality of your thoughts.",
        author: "Marcus Aurelius",
        category: "Happiness",
        source: "curated"
    }
];

/**
 * The first curated quote is QUOTELY's current default.
 *
 * Later, we may deliberately choose a different default,
 * but page load must never request an external quote.
 */
export const defaultCuratedQuote = curatedQuotes[0];