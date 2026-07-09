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
- `blueprints_path`: Optional path to a folder containing blueprints, which are mounted into the authentik containers.
- `cache`: bool, if set to true the action caches the required container images using the GitHub Actions cache, to speed up subsequent runs. Defaults to `true`.
- `enterprise_license`: bool, if set to true the action will automatically retrieve and install a dev enterprise license from the goauthentik customer portal. Defaults to `false`. Requires the calling workflow to grant `permissions: id-token: write`, and is only usable from contexts the customer portal's OIDC trust recognizes (primarily goauthentik's own repos/CI).
- `enterprise_license_users_internal`: Number of internal users to request for the enterprise license. Defaults to `1`.
- `enterprise_license_users_external`: Number of external users to request for the enterprise license. Defaults to `1`.

## Outputs:

- `admin_token`: Auto-generated token for the akadmin user
- `admin_password`: Auto-generated password for the akadmin user
- `http_url`: http URL to access authentik
- `https_url`: https URL to access authentik
- `enterprise_license_key`: The enterprise license key retrieved and installed, if `enterprise_license` is set to true

## Development

This action is written in TypeScript (`src/`) and bundled to `dist/index.js` / `dist/post.js`
with esbuild. The bundled output is committed so consumers don't need a build step.

```bash
npm install
npm run build       # regenerate dist/index.js and dist/post.js
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run format      # prettier --write
```

If you change anything under `src/`, run `npm run build` and commit the updated `dist/`
output — CI (the `check-dist` job) fails the build if `dist/` doesn't match what
`npm run build` produces from the current `src/`.
