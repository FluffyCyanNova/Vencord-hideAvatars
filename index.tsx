/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import definePlugin, { OptionType } from "@utils/types";
import { React, TextInput } from "@webpack/common";

interface Entry {
    id: string;
    avatar: string;
}

// ─── Settings ───────────────────────────────────────────────────────────────

const settings = definePluginSettings({
    entries: {
        type: OptionType.CUSTOM,
        default: [] as Entry[],
    },
    hiddenUserIds: {
        type: OptionType.STRING,
        description: "Legacy comma-separated user IDs (migrated into the list below on start).",
        default: "",
        hidden: true,
    },
    customAvatar: {
        type: OptionType.STRING,
        description: "Legacy shared avatar (migrated into the list on start).",
        default: "",
        hidden: true,
    },
    userList: {
        type: OptionType.COMPONENT,
        component: UserListComponent,
    },
});

function saveEntries(entries: Entry[]) {
    settings.store.entries = entries.map(e => ({ id: e.id, avatar: e.avatar }));
    updateStyles();
}

// ─── Component ─────────────────────────────────────────────────────────────

function UserRow({ entry, onChange, onRemove }: {
    entry: Entry;
    onChange: (e: Entry) => void;
    onRemove: () => void;
}) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const previewUrl = entry.avatar || (isValidId(entry.id) ? getDefaultAvatarUrl(entry.id) : "https://cdn.discordapp.com/embed/avatars/0.png");

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onChange({ ...entry, avatar: reader.result as string });
        reader.readAsDataURL(file);
        e.target.value = "";
    }

    return (
        <Flex alignItems="center" gap={12} style={{ padding: 8, border: "1px solid var(--background-modifier-accent)", borderRadius: 8 }}>
            <img
                src={previewUrl}
                alt="Avatar preview"
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    objectFit: "cover",
                    backgroundColor: "var(--background-secondary)",
                    flexShrink: 0,
                }}
            />
            <Flex flexDirection="column" gap={8} style={{ flexGrow: 1 }}>
                <TextInput
                    placeholder="User ID (e.g. 123456789012345678)"
                    value={entry.id}
                    onChange={(v: string) => onChange({ ...entry, id: v.trim() })}
                />
                <TextInput
                    placeholder="Image URL (https://... or data:image/...) - empty = Discord default"
                    value={entry.avatar.startsWith("data:image/") ? "(local file loaded)" : entry.avatar}
                    onChange={(v: string) => onChange({ ...entry, avatar: v.trim() })}
                />
                <Flex gap={8}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleFileSelect}
                    />
                    <Button size="small" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        Choose Local Image...
                    </Button>
                    {entry.avatar && (
                        <Button size="small" variant="secondary" onClick={() => onChange({ ...entry, avatar: "" })}>
                            Use Discord Default
                        </Button>
                    )}
                    <Button size="small" variant="dangerSecondary" onClick={onRemove}>
                        Remove User
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
}

function UserListComponent() {
    const { entries } = settings.use(["entries"]);
    const list: Entry[] = entries ?? [];

    return (
        <Flex flexDirection="column" gap={12} style={{ marginTop: 8, marginBottom: 8 }}>
            <Heading tag="h5">Replaced Users</Heading>
            <Paragraph>
                Add a row per user. Each user gets their own replacement image (URL or local file). Leave the image empty to use that user's Discord default avatar.
            </Paragraph>
            {list.map((entry, i) => (
                <UserRow
                    key={i}
                    entry={entry}
                    onChange={e => saveEntries(list.map((x, j) => (j === i ? e : x)))}
                    onRemove={() => saveEntries(list.filter((_, j) => j !== i))}
                />
            ))}
            <div>
                <Button size="small" onClick={() => saveEntries([...list, { id: "", avatar: "" }])}>
                    Add User
                </Button>
            </div>
        </Flex>
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STYLE_ID = "vencord-hide-avatars";

function isValidId(id: string): boolean {
    return /^\d{5,25}$/.test(id);
}

/**
 * Computes Discord's official default avatar index (0-5) based on user's snowflake ID:
 *   (snowflake >> 22) % 6
 */
function getDefaultAvatarUrl(id: string): string {
    try {
        const index = Number((BigInt(id) >> 22n) % 6n);
        return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    } catch {
        return "https://cdn.discordapp.com/embed/avatars/0.png";
    }
}

function cssUrl(url: string): string {
    return url.replace(/["\\\r\n]/g, c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"));
}

/**
 * Builds CSS rules replacing each listed user's avatar with their own image
 * or, if none is set, the default Discord profile picture.
 */
function buildCSS(entries: Entry[]): string {
    return entries
        .filter(e => isValidId(e.id))
        .map(({ id, avatar }) => {
            const avatarUrl = cssUrl(avatar.trim() || getDefaultAvatarUrl(id));
            return `
/* User ${id} */
img[src*="/avatars/${id}/"],
img[src*="/users/${id}/avatars/"],
[data-user-id="${id}"] img:not([class*="avatarDecoration"]) {
    content: url("${avatarUrl}") !important;
    object-fit: cover !important;
}

[style*="/avatars/${id}/"],
[style*="/users/${id}/avatars/"],
[data-user-id="${id}"] [style*="background-image"] {
    background-image: url("${avatarUrl}") !important;
    background-size: cover !important;
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
    getOrCreateStyleTag().textContent = buildCSS(settings.store.entries ?? []);
}

function removeStyles() {
    document.getElementById(STYLE_ID)?.remove();
}

function migrateLegacySettings() {
    const legacyIds = (settings.store.hiddenUserIds ?? "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    if (legacyIds.length === 0) return;

    const avatar = settings.store.customAvatar?.trim() ?? "";
    const existing = settings.store.entries ?? [];
    const fresh = legacyIds.filter(id => !existing.some(e => e.id === id));
    settings.store.entries = [
        ...existing.map(e => ({ id: e.id, avatar: e.avatar })),
        ...fresh.map(id => ({ id, avatar }))
    ];
    settings.store.hiddenUserIds = "";
    settings.store.customAvatar = "";
}

// ─── Plugin definition ────────────────────────────────────────────────────────

export default definePlugin({
    name: "HideAvatars",
    description:
        "Replaces profile pictures of specified users, each with its own custom image or Discord default avatar. " +
        "Configure in plugin settings.",
    authors: [{ name: "you", id: 0n }],
    settings,

    start() {
        migrateLegacySettings();
        updateStyles();
    },

    stop() {
        removeStyles();
    },
});
