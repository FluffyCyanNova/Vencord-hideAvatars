/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { ImageIcon } from "@components/Icons";
import { Paragraph } from "@components/Paragraph";
import definePlugin, { OptionType } from "@utils/types";
import type { User } from "@vencord/discord-types";
import { IconUtils, Menu, Modal, openModal, React, TextInput, UserProfileStore, UserStore, useStateFromStores } from "@webpack/common";

type AvatarMode = "keep" | "default" | "custom";
type BannerMode = "keep" | "hide" | "custom";

interface Entry {
    id: string;
    avatarMode: AvatarMode;
    avatar: string;
    bannerMode: BannerMode;
    banner: string;
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

/** Returns a plain Entry; also upgrades rows saved by older versions. */
function normalize(e: any): Entry {
    const avatar: string = e.avatar ?? "";
    const banner: string = e.banner ?? "";
    return {
        id: e.id ?? "",
        avatar,
        banner,
        avatarMode: e.avatarMode ?? (avatar ? "custom" : "default"),
        bannerMode: e.bannerMode ?? (e.hideBanner ? "hide" : banner ? "custom" : "keep"),
    };
}

function getEntries(): Entry[] {
    return (settings.store.entries ?? []).map(normalize);
}

function saveEntries(entries: Entry[]) {
    settings.store.entries = entries.map(normalize);
    updateStyles();
}

// ─── Components ────────────────────────────────────────────────────────────

function ModeButtons<T extends string>({ value, options, onChange }: {
    value: T;
    options: [T, string][];
    onChange: (v: T) => void;
}) {
    return (
        <Flex gap={8} style={{ flexWrap: "wrap" }}>
            {options.map(([v, label]) => (
                <Button
                    key={v}
                    size="small"
                    variant={value === v ? "primary" : "secondary"}
                    onClick={() => onChange(v)}
                >
                    {label}
                </Button>
            ))}
        </Flex>
    );
}

function ImagePicker({ value, placeholder, onChange }: {
    value: string;
    placeholder: string;
    onChange: (v: string) => void;
}) {
    const fileRef = React.useRef<HTMLInputElement>(null);

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onChange(reader.result as string);
        reader.readAsDataURL(file);
        e.target.value = "";
    }

    return (
        <Flex flexDirection="column" gap={8}>
            <TextInput
                placeholder={placeholder}
                value={value.startsWith("data:image/") ? "(local file loaded)" : value}
                onChange={(v: string) => onChange(v.trim())}
            />
            <div>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleFile} />
                <Button size="small" variant="secondary" onClick={() => fileRef.current?.click()}>
                    Choose file from PC...
                </Button>
            </div>
        </Flex>
    );
}

function UserRow({ entry, onChange, onRemove, removeLabel, lockId, isNew }: {
    entry: Entry;
    onChange: (e: Entry) => void;
    onRemove: () => void;
    removeLabel: string;
    lockId?: boolean;
    isNew?: boolean;
}) {
    const defaultUrl = isValidId(entry.id) ? getDefaultAvatarUrl(entry.id) : "https://cdn.discordapp.com/embed/avatars/0.png";

    const realAvatar = useStateFromStores([UserStore], () => {
        const user = UserStore.getUser(entry.id);
        return user ? IconUtils.getUserAvatarURL(user, false, 160) : null;
    }, [entry.id]);
    const realBanner = useStateFromStores([UserStore, UserProfileStore], () => {
        const banner = UserProfileStore.getUserProfile(entry.id)?.banner ?? UserStore.getUser(entry.id)?.banner;
        return banner ? IconUtils.getUserBannerURL({ id: entry.id, banner, canAnimate: false, size: 600 }) ?? null : null;
    }, [entry.id]);

    const avatarPreview =
        entry.avatarMode === "keep" ? realAvatar ?? defaultUrl
            : entry.avatarMode === "custom" && entry.avatar ? entry.avatar
                : defaultUrl;

    const bannerPreview =
        entry.bannerMode === "keep" ? realBanner
            : entry.bannerMode === "custom" && entry.banner ? entry.banner
                : null;
    const bannerPlaceholder =
        entry.bannerMode === "hide" ? "Banner hidden"
            : entry.bannerMode === "custom" ? "Choose a banner image"
                : "No banner";

    return (
        <Flex
            flexDirection="column"
            gap={16}
            style={{ padding: 12, border: "1px solid var(--background-modifier-accent)", borderRadius: 8, boxSizing: "border-box" }}
        >
            {!lockId && (
                <TextInput
                    placeholder="User ID (e.g. 123456789012345678)"
                    value={entry.id}
                    onChange={(v: string) => onChange({ ...entry, id: v.trim() })}
                />
            )}

            <Flex gap={12} alignItems="flex-start">
                <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        objectFit: "cover",
                        backgroundColor: "var(--background-secondary)",
                        flexShrink: 0,
                    }}
                />
                <Flex flexDirection="column" gap={8} style={{ flexGrow: 1, minWidth: 0 }}>
                    <Heading tag="h5">Profile picture</Heading>
                    <ModeButtons<AvatarMode>
                        value={entry.avatarMode}
                        options={[["keep", "Keep original"], ["default", "Discord default"], ["custom", "Custom image"]]}
                        onChange={avatarMode => onChange({ ...entry, avatarMode })}
                    />
                    {entry.avatarMode === "custom" && (
                        <ImagePicker
                            value={entry.avatar}
                            placeholder="Image URL (https://... or data:image/...)"
                            onChange={avatar => onChange({ ...entry, avatar })}
                        />
                    )}
                </Flex>
            </Flex>

            <Flex flexDirection="column" gap={8}>
                <Heading tag="h5">Banner</Heading>
                {bannerPreview ? (
                    <img
                        src={bannerPreview}
                        alt="Banner preview"
                        style={{
                            width: "100%",
                            height: 120,
                            borderRadius: 8,
                            objectFit: "cover",
                            backgroundColor: "var(--background-secondary)",
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: 120,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "var(--background-secondary)",
                            color: "var(--text-muted)",
                            fontSize: 14,
                        }}
                    >
                        {bannerPlaceholder}
                    </div>
                )}
                <ModeButtons<BannerMode>
                    value={entry.bannerMode}
                    options={[["keep", "Keep original"], ["hide", "Hide banner"], ["custom", "Custom image"]]}
                    onChange={bannerMode => onChange({ ...entry, bannerMode })}
                />
                {entry.bannerMode === "custom" && (
                    <ImagePicker
                        value={entry.banner}
                        placeholder="Banner image URL (https://... or data:image/...)"
                        onChange={banner => onChange({ ...entry, banner })}
                    />
                )}
            </Flex>

            {!isNew && (
                <div>
                    <Button size="small" variant="dangerSecondary" onClick={onRemove}>
                        {removeLabel}
                    </Button>
                </div>
            )}
        </Flex>
    );
}

function UserModalContent({ userId, onClose }: { userId: string; onClose(): void; }) {
    settings.use(["entries"]);
    const list = getEntries();
    const idx = list.findIndex(e => e.id === userId);
    const entry: Entry = idx >= 0
        ? list[idx]
        : { id: userId, avatarMode: "keep", avatar: "", bannerMode: "keep", banner: "" };

    return (
        <div style={{ padding: "4px 4px 20px", overflowX: "hidden" }}>
            {idx < 0 && (
                <Paragraph style={{ marginBottom: 12, opacity: 0.8 }}>
                    Nothing is changed for this user yet. Choose an option below to start.
                </Paragraph>
            )}
            <UserRow
                lockId
                isNew={idx < 0}
                entry={entry}
                removeLabel="Restore original avatar & banner"
                onChange={e => saveEntries(idx >= 0 ? list.map((x, j) => (j === idx ? e : x)) : [...list, e])}
                onRemove={() => {
                    saveEntries(list.filter(x => x.id !== userId));
                    onClose();
                }}
            />
        </div>
    );
}

function openUserModal(user: User) {
    openModal(modalProps => (
        <Modal {...modalProps} title={`HideAvatars: ${user.username}`}>
            <UserModalContent userId={user.id} onClose={modalProps.onClose} />
        </Modal>
    ));
}

const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: { user?: User; }) => {
    if (!user) return;

    children.push(
        <Menu.MenuItem
            id="vc-hide-avatars"
            label="Hide/Replace Avatar..."
            action={() => openUserModal(user)}
            icon={ImageIcon}
            leadingAccessory={{ type: "icon", icon: ImageIcon }}
        />
    );
};

function UserListComponent() {
    settings.use(["entries"]);
    const list = getEntries();

    return (
        <Flex flexDirection="column" gap={12} style={{ marginTop: 8, marginBottom: 8 }}>
            <Heading tag="h5">Replaced Users</Heading>
            <Paragraph>
                Add a row per user. For each user, choose what happens to their profile picture and banner independently: keep it, replace it, or (banner) hide it.
            </Paragraph>
            {list.map((entry, i) => (
                <UserRow
                    key={i}
                    entry={entry}
                    removeLabel="Remove User"
                    onChange={e => saveEntries(list.map((x, j) => (j === i ? e : x)))}
                    onRemove={() => saveEntries(list.filter((_, j) => j !== i))}
                />
            ))}
            <div>
                <Button
                    size="small"
                    onClick={() => saveEntries([...list, { id: "", avatarMode: "default", avatar: "", bannerMode: "keep", banner: "" }])}
                >
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

function avatarRules(id: string, url: string): string {
    return `
img[src*="/avatars/${id}/"],
img[src*="/users/${id}/avatars/"],
[data-user-id="${id}"] img:not([class*="avatarDecoration"]) {
    content: url("${url}") !important;
    object-fit: cover !important;
}

[style*="/avatars/${id}/"],
[style*="/users/${id}/avatars/"],
[data-user-id="${id}"] [style*="background-image"] {
    background-image: url("${url}") !important;
    background-size: cover !important;
}
`;
}

function bannerRules(id: string, url: string | null): string {
    if (url === null) {
        return `
img[src*="/banners/${id}/"],
img[src*="/users/${id}/banners/"] {
    display: none !important;
}

[style*="/banners/${id}/"],
[style*="/users/${id}/banners/"] {
    background-image: none !important;
}
`;
    }
    return `
img[src*="/banners/${id}/"],
img[src*="/users/${id}/banners/"] {
    content: url("${url}") !important;
    object-fit: cover !important;
}

[style*="/banners/${id}/"],
[style*="/users/${id}/banners/"] {
    background-image: url("${url}") !important;
    background-size: cover !important;
}
`;
}

function buildCSS(entries: Entry[]): string {
    return entries
        .filter(e => isValidId(e.id))
        .map(e => {
            let css = `/* User ${e.id} */`;

            if (e.avatarMode === "default") {
                css += avatarRules(e.id, getDefaultAvatarUrl(e.id));
            } else if (e.avatarMode === "custom" && e.avatar.trim()) {
                css += avatarRules(e.id, cssUrl(e.avatar.trim()));
            }

            if (e.bannerMode === "hide") {
                css += bannerRules(e.id, null);
            } else if (e.bannerMode === "custom" && e.banner.trim()) {
                css += bannerRules(e.id, cssUrl(e.banner.trim()));
            }

            return css;
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
    getOrCreateStyleTag().textContent = buildCSS(getEntries());
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
    const existing = getEntries();
    const fresh = legacyIds.filter(id => !existing.some(e => e.id === id));
    saveEntries([
        ...existing,
        ...fresh.map(id => normalize({ id, avatar }))
    ]);
    settings.store.hiddenUserIds = "";
    settings.store.customAvatar = "";
}

// ─── Plugin definition ────────────────────────────────────────────────────────

export default definePlugin({
    name: "HideAvatars",
    description:
        "Replaces profile pictures of specified users, each with its own custom image or Discord default avatar, and can replace or hide their profile banner. " +
        "Configure in plugin settings or via the user right-click menu.",
    authors: [{ name: "you", id: 0n }],
    settings,

    contextMenus: {
        "user-context": UserContextMenuPatch
    },

    start() {
        migrateLegacySettings();
        updateStyles();
    },

    stop() {
        removeStyles();
    },
});
