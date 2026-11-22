# HideAvatars (Vencord Plugin)

A [Vencord](https://github.com/Vendicated/Vencord) userplugin that hides or replaces profile pictures of specified Discord users with a custom image or Discord's default profile picture.

## Features

- **Set Avatar Option:**
  - **Online Image URL:** Paste any direct image link (`.png`, `.jpg`, `.webp`, `.gif`, etc.).
  - **Local File Upload:** Click *Choose Local Image...* to select any image from your computer; it is automatically loaded and saved as a Base64 data URL.
  - **Live Preview:** See what the avatar looks like directly in the settings UI.
  - **Discord Default Fallback:** If left empty or reset, it automatically assigns each user their official Discord default avatar color (`0` to `5`) using their snowflake ID `(snowflake >> 22) % 6`.
- **Everywhere in Discord:** Works across messages, member lists, DMs, voice channels, and profile popouts.
- **Instant Live Updates:** Settings changes apply immediately via dynamic CSS injection without needing to reload.

## Installation

### Method 1: Clone into Vencord userplugins (Recommended)

1. Open your Vencord root folder in a terminal.
2. Clone this repository into `src/userplugins/hideAvatars`:
   ```bash
   git clone <REPO_URL> src/userplugins/hideAvatars
   ```
3. Build Vencord:
   ```bash
   pnpm build
   ```
4. Restart Discord (<kbd>Ctrl</kbd> + <kbd>R</kbd> or relaunch).

### Method 2: Manual Copy

Copy the `hideAvatars` directory into your Vencord `src/userplugins/` folder and run `pnpm build`.

## Usage & Configuration

1. In Discord, go to **User Settings** → **Vencord** → **Plugins**.
2. Find **HideAvatars** and enable it.
3. Click the ⚙️ gear icon to open settings:
   - Click **Add User** to add a row per user. Each row has:
     - **User ID** (e.g. `123456789012345678`).
     - **Profile picture:** *Keep original*, *Discord default*, or *Custom image* (an image URL, or a file from your PC).
     - **Banner:** *Keep original*, *Hide banner*, or *Custom image* (an image URL, or a file from your PC).
     - Live previews show the result (or the user's real picture/banner when kept).
     - **Remove User** to delete the row.

   Avatar and banner are independent, so you can hide just the banner without touching the profile picture.

> **Quick access:** right-click any user and choose **Hide/Replace Avatar...** to edit that user's avatar and banner in a popup, without opening plugin settings.

> **Tip:** To copy a Discord User ID, turn on **Developer Mode** (*Settings → Advanced → Developer Mode*), then right-click any user and select **Copy User ID**.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0-or-later) to maintain compatibility with Vencord. See [LICENSE](LICENSE) for details.
