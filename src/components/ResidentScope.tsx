import { Fragment, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOperationalContext } from "@/hooks/useOperationalContext";

// Reset every resident form and request owner synchronously when identity/context changes.
export function ResidentScope({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { activeOrg, activeRole } = useOperationalContext();
  return (
    <Fragment key={[user?.id, activeOrg?.id, activeRole].join(":")}>
      {children}
    </Fragment>
  );
}
