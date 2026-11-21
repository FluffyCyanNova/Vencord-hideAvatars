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
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { React, TextInput, useRef, useState } from "@webpack/common";

// ─── Settings ───────────────────────────────────────────────────────────────

const settings = definePluginSettings({
    hiddenUserIds: {
        type: OptionType.STRING,
        description:
            "Comma-separated list of Discord User IDs whose profile pictures should be replaced. " +
            "Example: 123456789012345678, 987654321098765432",
        default: "",
        onChange: updateStyles,
    },
    customAvatar: {
        type: OptionType.STRING,
        description: "Custom avatar image URL or Base64 data URL (leave blank for Discord default avatar).",
        default: "",
        onChange: updateStyles,
    },
    setAvatar: {
        type: OptionType.COMPONENT,
        component: SetAvatarComponent,
    },
});

// ─── Component ─────────────────────────────────────────────────────────────

function SetAvatarComponent() {
    const { customAvatar } = settings.use(["customAvatar"]);
    const [inputValue, setInputValue] = useState(customAvatar ?? "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleUrlChange(val: string) {
        setInputValue(val);
        settings.store.customAvatar = val.trim();
        updateStyles();
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setInputValue(result);
            settings.store.customAvatar = result;
            updateStyles();
        };
        reader.readAsDataURL(file);
    }

    function handleReset() {
        setInputValue("");
        settings.store.customAvatar = "";
        updateStyles();
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const previewUrl = customAvatar || "https://cdn.discordapp.com/embed/avatars/0.png";

    return (
        <Flex flexDirection="column" gap={12} style={{ marginTop: 8, marginBottom: 8 }}>
            <Heading tag="h5">Set Avatar</Heading>
            <Paragraph>
                Choose an image to replace target avatars with. You can enter an image URL (.png, .jpg, .webp, .gif) or upload a local image file from your PC. Leave empty to use Discord's default profile picture.
            </Paragraph>

            <Flex alignItems="center" gap={16}>
                <img
                    src={previewUrl}
                    alt="Avatar preview"
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "2px solid var(--background-modifier-accent)",
                        backgroundColor: "var(--background-secondary)",
                        flexShrink: 0,
                    }}
                />
                <Flex flexDirection="column" gap={8} style={{ flexGrow: 1 }}>
                    <TextInput
                        placeholder="Paste image URL (https://... or data:image/...)"
                        value={inputValue}
                        onChange={handleUrlChange}
                    />
                    <Flex gap={8}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleFileSelect}
                        />
                        <Button
                            size="small"
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Choose Local Image...
                        </Button>
                        {customAvatar && (
                            <Button
                                size="small"
                                variant="dangerSecondary"
                                onClick={handleReset}
                            >
                                Reset to Discord Default
                            </Button>
                        )}
                    </Flex>
                </Flex>
            </Flex>
            {customAvatar && customAvatar.startsWith("data:image/") && (
                <Paragraph style={{ fontSize: "12px", opacity: 0.7 }}>
                    ✓ Local file loaded and active.
                </Paragraph>
            )}
        </Flex>
    );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const STYLE_ID = "vencord-hide-avatars";

/**
 * Computes Discord's official default avatar index (0-5) based on user's snowflake ID:
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
 * Builds CSS rules replacing target users' avatars with the custom avatar or
 * the default Discord profile picture, and hiding any avatar decorations they might have.
 */
function buildCSS(ids: string[]): string {
    if (ids.length === 0) return "";

    const custom = settings.store.customAvatar?.trim();

    return ids
        .map(id => {
            const avatarUrl = custom || getDefaultAvatarUrl(id);
            return `
/* User ${id} */
img[src*="/avatars/${id}/"],
img[src*="/users/${id}/avatars/"],
[data-user-id="${id}"] img:not([class*="avatarDecoration"]) {
    content: url("${avatarUrl}") !important;
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
        "Replaces profile pictures and hides avatar decorations of specified users with a custom image or Discord default avatar. " +
        "Configure in plugin settings.",
    authors: [{ name: "you", id: 0n }],
    settings,

    start() {
        updateStyles();
    },

    stop() {
        removeStyles();
    },
});
