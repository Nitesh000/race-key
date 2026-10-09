import { Card } from "@/components/ui/card";

export function AuthUnavailable() {
  return (
    <Card>
      <p className="text-sm text-muted">
        Accounts are not set up on this server yet. You can still practice as a guest.
      </p>
    </Card>
  );
}
