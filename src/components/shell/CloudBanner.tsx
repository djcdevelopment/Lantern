/* A persistent strip shown only in the hosted (cloud) build,
   explaining that it is read-only. */

import { CLOUD_MODE } from "@/api";

export function CloudBanner() {
  if (!CLOUD_MODE) return null;
  return (
    <div className="cloud-banner" role="note">
      <span className="cb-dot" />
      <span>
        Hosted chronicle · <strong>read-only</strong>. Notebook, observations, and the
        Workshop run in the local Lantern app.
      </span>
    </div>
  );
}
