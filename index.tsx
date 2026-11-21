/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// ─── Settings ───────────────────────────────────────────────────────────────

const settings = definePluginSettings({
    hiddenUserIds: {
        type: OptionType.STRING,
        description:
            "Comma-separated list of Discord User IDs whose profile pictures should be replaced with default Discord avatars. " +
            "Example: 123456789012345678, 987654321098765432",
        default: "",
        onChange: updateStyles,
    },
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const STYLE_ID = "vencord-hide-avatars";

/**
 * Computes Discord's official default avatar index (0-5) based on the user's snowflake ID:
 *   (snowflake >> 22) % 6
 */
function getDefaultAvatarUrl(id: string): string {
    try {
        const snowflake = BigInt(id);
        const index = Number((snowflake >> 22n) % 6n);
        return `https://cdn.discordapp.com/embed/avatars/${Math.abs(index)}.png`;
    } catch {
        return "https://cdn.discordapp.com/embed/avatars/0.png";
    }
}

/**
 * Parses the settings string into a trimmed array of non-empty user IDs.
 */
function parseIds(raw: string): string[] {
    return raw
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
}

/**
 * Builds CSS rules replacing target users' avatars with the default Discord profile picture
 * and hiding any avatar decorations they might have.
 */
function buildCSS(ids: string[]): string {
    if (ids.length === 0) return "";

    return ids
        .map(id => {
            const defaultAvatar = getDefaultAvatarUrl(id);
            return `
/* User ${id} -> default avatar */
img[src*="/avatars/${id}/"],
img[src*="/users/${id}/avatars/"],
[data-user-id="${id}"] img:not([class*="avatarDecoration"]) {
    content: url("${defaultAvatar}") !important;
    object-fit: cover !important;
}

[data-user-id="${id}"] [class*="avatarDecoration"] {
    display: none !important;
}
`;
        })
        .join("\n");
}

function getOrCreateStyleTag(): HTMLStyleElement {
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    return el;
}

function updateStyles() {
    const ids = parseIds(settings.store.hiddenUserIds ?? "");
    const el = getOrCreateStyleTag();
    el.textContent = buildCSS(ids);
}

function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
}

// ─── Plugin definition ────────────────────────────────────────────────────────

export default definePlugin({
    name: "HideAvatars",
    description:
        "Replaces profile pictures of specified users with Discord's default profile picture. " +
        "Configure user IDs in plugin settings.",
    authors: [{ name: "you", id: 0n }],
    settings,

    start() {
        updateStyles();
    },

    stop() {
        removeStyles();
    },
});
