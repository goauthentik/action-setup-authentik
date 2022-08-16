<p align="center">
    <img src="https://goauthentik.io/img/icon_top_brand_colour.svg" height="150" alt="authentik logo">
</p>

---

[![](https://img.shields.io/discord/809154715984199690?label=Discord&style=for-the-badge)](https://discord.gg/jg33eMhnj6)

# setup-authentik action

This action deploys a local authentik instance in Docker using compose.

## Inputs:

- `version`: can be set to `stable`, `beta` or any valid verison. Defaults to `stable`.
- `wait`: bool, if set to true the action will wait for authentik to be available (waits 600 seconds)
- `sentry_env`: Optionally set an environment for sentry reports

## Outputs:

- `admin_token`: Auto-generated token for the akadmin user
- `admin_password`: Auto-generated password for the akadmin user
- `http_url`: http URL to access authentik
- `https_url`: https URL to access authentik
