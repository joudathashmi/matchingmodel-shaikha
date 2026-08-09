import { Prisma } from "@prisma/client";
import { prisma } from "./../../lib/prisma";
import {
  IDENTITY_SETTING_KEY,
  IdentityProviderConfig,
  IdentityProviderPublicConfig,
  defaultIdentityConfig,
} from "./identity-provider.types";


const SECRET_PLACEHOLDER = "••••••••";

function asConfig(value: unknown): IdentityProviderConfig {
  const base = defaultIdentityConfig();
  if (!value || typeof value !== "object") return base;
  return { ...base, ...(value as Partial<IdentityProviderConfig>) };
}

function toPublic(cfg: IdentityProviderConfig): IdentityProviderPublicConfig {
  const { clientSecret, ldapBindPassword, ...rest } = cfg;
  return {
    ...rest,
    hasClientSecret: Boolean(clientSecret && clientSecret.trim()),
    hasLdapBindPassword: Boolean(ldapBindPassword && ldapBindPassword.trim()),
  };
}

export async function getIdentityProviderConfig(): Promise<IdentityProviderPublicConfig> {
  const row = await prisma.appSetting.findUnique({
    where: { key: IDENTITY_SETTING_KEY },
  });
  return toPublic(asConfig(row?.value));
}

export async function saveIdentityProviderConfig(
  input: Partial<IdentityProviderConfig>,
  updatedBy: string
): Promise<IdentityProviderPublicConfig> {
  const existingRow = await prisma.appSetting.findUnique({
    where: { key: IDENTITY_SETTING_KEY },
  });
  const current = asConfig(existingRow?.value);

  const next: IdentityProviderConfig = {
    ...current,
    ...input,
  };

  // Keep previous secrets when the admin leaves the masked field untouched
  if (
    input.clientSecret === undefined ||
    input.clientSecret === "" ||
    input.clientSecret === SECRET_PLACEHOLDER
  ) {
    next.clientSecret = current.clientSecret;
  }
  if (
    input.ldapBindPassword === undefined ||
    input.ldapBindPassword === "" ||
    input.ldapBindPassword === SECRET_PLACEHOLDER
  ) {
    next.ldapBindPassword = current.ldapBindPassword;
  }

  await prisma.appSetting.upsert({
    where: { key: IDENTITY_SETTING_KEY },
    create: {
      key: IDENTITY_SETTING_KEY,
      value: next as unknown as Prisma.InputJsonValue,
      updatedBy,
    },
    update: {
      value: next as unknown as Prisma.InputJsonValue,
      updatedBy,
    },
  });

  return toPublic(next);
}
