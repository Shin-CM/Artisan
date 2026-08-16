import { Navigate, useLocation } from "react-router-dom";

const PREFIX = "/settings/marketplace";

/** Ancres signets : /settings/marketplace → /marketplace */
export function LegacyMarketplaceRedirect() {
  const { pathname, search, hash } = useLocation();
  const tail = pathname.slice(PREFIX.length);
  const pathnameTo =
    "/marketplace" + (tail.startsWith("/") ? tail : tail ? `/${tail}` : "");
  return <Navigate to={{ pathname: pathnameTo, search, hash }} replace />;
}
