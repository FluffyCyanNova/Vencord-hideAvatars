# HideAvatars (Vencord Plugin)

A [Vencord](https://github.com/Vendicated/Vencord) userplugin that replaces profile pictures and hides avatar decorations of specified Discord users with Discord's default profile picture.

## Features

- **Replaces Avatars:** Replaces user avatars with Discord's official default avatars across messages, member lists, DMs, voice channels, and profile popouts.
- **Accurate Default Colors:** Automatically calculates the exact default avatar color (`0` to `5`) assigned to the user using Discord's snowflake formula `(snowflake >> 22) % 6`.
- **Hides Avatar Decorations:** Automatically suppresses animated avatar decorations / borders for those users.
- **Live Updates:** Changes in the settings apply immediately via CSS injection without restarting Discord.

## Installation

### Method 1: Clone into Vencord userplugins (Recommended)

1. Open your Vencord root folder in a terminal.
2. Clone this repository directly into `src/userplugins/hideAvatars`:
   ```bash
   git clone <REPO_URL> src/userplugins/hideAvatars
   ```
3. Build and deploy Vencord:
   ```bash
   pnpm build
   ```
4. Restart Discord (<kbd>Ctrl</kbd> + <kbd>R</kbd> or relaunch).

### Method 2: Manual Copy

Copy the `hideAvatars` directory into your Vencord `src/userplugins/` folder and run `pnpm build`.

## Usage & Configuration

1. In Discord, navigate to **User Settings** → **Vencord** → **Plugins**.
2. Find **HideAvatars** and toggle it **On**.
3. Click the ⚙️ gear icon to open settings.
4. In **Hidden User IDs**, enter one or more comma-separated Discord user IDs:
   ```
   123456789012345678, 987654321098765432
   ```

> **Tip:** To copy a Discord User ID, turn on **Developer Mode** in Discord (*Settings → Advanced → Developer Mode*), then right-click any user and select **Copy User ID**.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0-or-later) to maintain compatibility with Vencord. See [LICENSE](LICENSE) for details.
