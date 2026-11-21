# HideAvatars (Vencord Plugin)

A [Vencord](https://github.com/Vendicated/Vencord) userplugin that hides or replaces profile pictures and avatar decorations of specified Discord users with a custom image or Discord's default profile picture.

## Features

- **Set Avatar Option:**
  - **Online Image URL:** Paste any direct image link (`.png`, `.jpg`, `.webp`, `.gif`, etc.).
  - **Local File Upload:** Click *Choose Local Image...* to select any image from your computer; it is automatically loaded and saved as a Base64 data URL.
  - **Live Preview:** See what the avatar looks like directly in the settings UI.
  - **Discord Default Fallback:** If left empty or reset, it automatically assigns each user their official Discord default avatar color (`0` to `5`) using their snowflake ID `(snowflake >> 22) % 6`.
- **Hides Avatar Decorations:** Automatically suppresses animated avatar decorations and frames for target users.
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
   - **Hidden User IDs:** Enter comma-separated Discord user IDs (e.g. `123456789012345678, 987654321098765432`).
   - **Set Avatar:**
     - Paste an image URL in the input box, **OR**
     - Click **Choose Local Image...** to pick any image from your PC.
     - Click **Reset to Discord Default** at any time to return to Discord's default avatars.

> **Tip:** To copy a Discord User ID, turn on **Developer Mode** (*Settings → Advanced → Developer Mode*), then right-click any user and select **Copy User ID**.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0-or-later) to maintain compatibility with Vencord. See [LICENSE](LICENSE) for details.
