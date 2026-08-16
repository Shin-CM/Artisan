/** Champs profil workspace (JSON `profile_json`) alignés sur la création d’espace. */

export type ProfileFormFields = {
  city: string;
  siret: string;
  ideUid: string;
  tvaCh: string;
};

export function parseProfileFields(profileJson: string): ProfileFormFields {
  try {
    const p = JSON.parse(profileJson || "{}") as Record<string, unknown>;
    const addr =
      p.address &&
      typeof p.address === "object" &&
      !Array.isArray(p.address)
        ? (p.address as Record<string, unknown>)
        : {};
    return {
      city: typeof addr.city === "string" ? addr.city : "",
      siret: typeof p.siret === "string" ? p.siret : "",
      ideUid: typeof p.ideUid === "string" ? p.ideUid : "",
      tvaCh: typeof p.tvaSwiss === "string" ? p.tvaSwiss : "",
    };
  } catch {
    return { city: "", siret: "", ideUid: "", tvaCh: "" };
  }
}

export function mergeWorkspaceProfile(
  prevJson: string,
  params: {
    countryCode: string;
    entityType: string;
    city: string;
    siret: string;
    ideUid: string;
    tvaCh: string;
  },
): Record<string, unknown> {
  let prev: Record<string, unknown> = {};
  try {
    prev = JSON.parse(prevJson || "{}") as Record<string, unknown>;
  } catch {
    prev = {};
  }
  const prevAddr =
    prev.address &&
    typeof prev.address === "object" &&
    !Array.isArray(prev.address)
      ? { ...(prev.address as Record<string, unknown>) }
      : {};
  const next: Record<string, unknown> = { ...prev };
  const cc = params.countryCode.toUpperCase();
  next.address = {
    ...prevAddr,
    city: params.city,
    countryCode: cc,
  };
  if (cc === "FR" && params.entityType === "company") {
    const s = params.siret.trim();
    if (s) next.siret = s;
    else delete next.siret;
  } else {
    delete next.siret;
  }
  if (cc === "CH") {
    const ide = params.ideUid.trim();
    const tva = params.tvaCh.trim();
    if (ide) next.ideUid = ide;
    else delete next.ideUid;
    if (tva) next.tvaSwiss = tva;
    else delete next.tvaSwiss;
  } else {
    delete next.ideUid;
    delete next.tvaSwiss;
  }
  return next;
}
