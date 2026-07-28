"use client";

import { User } from "@/lib/context/auth-context";
import { VisitorEntryForm, type Host } from "./VisitorEntryForm";

function userToHost(user: User): Host {
  return {
    id: user.id,
    names: user.names,
    contact_phonenumber: user.phonenumber,
    phonenumber: user.phonenumber,
  };
}

export function StaffSelfRegisterForm({ currentUser }: { currentUser: User }) {
  return <VisitorEntryForm heading="Register a Visit" />;
}
