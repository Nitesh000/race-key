"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { submitInquiry } from "./advertise-action";

export function AdvertiseForm() {
  const [state, action, pending] = useActionState(submitInquiry, null);
  if (state?.ok) {
    return <p className="text-success">Thanks! We&apos;ll reply by email within a few days.</p>;
  }
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" autoComplete="organization" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="budget">Monthly budget</Label>
          <Input id="budget" name="budget" placeholder="e.g. $200" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="message">What would you like to run?</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        Send
      </Button>
    </form>
  );
}
