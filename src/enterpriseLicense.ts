import * as core from "@actions/core";

const CUSTOMER_PORTAL_TOKEN_URL = "https://id.customers.goauthentik.io/application/o/token/";
const CUSTOMER_PORTAL_CLIENT_ID =
  "lq9mHxJPqvTHClDS2zACiCBwhzCk2eiWDs5xgcVvo1aKs4R00Q0QzLyBrwYyhoOq";
const CUSTOMER_PORTAL_SCOPE = "openid profile email";

const LOCAL_AUTHENTIK_URL = "http://localhost:9000";
const CUSTOMER_PORTAL_LICENSE_URL = "https://customers.goauthentik.io/api/v1/license/create/dev/";

interface TokenResponse {
  access_token: string;
}

interface InstallIdResponse {
  install_id: string;
}

interface LicenseCreateResponse {
  license_key: string;
}

export async function getCustomerPortalToken(): Promise<string> {
  const idToken = await core.getIDToken();

  const params = new URLSearchParams();
  params.set("grant_type", "client_credentials");
  params.set("client_id", CUSTOMER_PORTAL_CLIENT_ID);
  params.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
  params.set("client_assertion", idToken);
  params.set("scope", CUSTOMER_PORTAL_SCOPE);

  const resp = await fetch(CUSTOMER_PORTAL_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!resp.ok) {
    throw new Error(`Failed to get customer portal token: ${resp.status} ${await resp.text()}`);
  }
  const body = (await resp.json()) as TokenResponse;
  return body.access_token;
}

export async function getAndInstallEnterpriseLicense(
  adminToken: string,
  customerToken: string,
  usersInternal: string,
  usersExternal: string,
): Promise<string> {
  const installIdResp = await fetch(
    `${LOCAL_AUTHENTIK_URL}/api/v3/enterprise/license/install_id/`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
  );
  if (!installIdResp.ok) {
    throw new Error(`Failed to fetch install_id: ${installIdResp.status}`);
  }
  const { install_id: installId } = (await installIdResp.json()) as InstallIdResponse;

  const createResp = await fetch(CUSTOMER_PORTAL_LICENSE_URL, {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      install_id: installId,
      users_internal: Number(usersInternal),
      users_external: Number(usersExternal),
    }),
  });
  if (!createResp.ok) {
    throw new Error(`Failed to create license: ${createResp.status} ${await createResp.text()}`);
  }
  const { license_key: licenseKey } = (await createResp.json()) as LicenseCreateResponse;
  core.setSecret(licenseKey);

  const installResp = await fetch(`${LOCAL_AUTHENTIK_URL}/api/v3/enterprise/license/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ key: licenseKey }),
  });
  if (!installResp.ok) {
    throw new Error(`Failed to install license: ${installResp.status} ${await installResp.text()}`);
  }

  return licenseKey;
}
