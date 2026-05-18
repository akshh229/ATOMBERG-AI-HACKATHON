import type { Role } from "@/types/alignhq";

export type DemoAccount = {
  role: Role;
  href: string;
  name: string;
  email: string;
  password: string;
  note: string;
};

export const demoAccounts: DemoAccount[] = [
  {
    role: "Employee",
    href: "/employee",
    name: "Asha Menon",
    email: "asha.menon@alignhq.test",
    password: "AlignHQ-demo-2026!",
    note: "Create goals and submit Q1 updates"
  },
  {
    role: "Manager",
    href: "/manager",
    name: "Isha Rao",
    email: "isha.rao@alignhq.test",
    password: "AlignHQ-demo-2026!",
    note: "Review, return, approve, and comment"
  },
  {
    role: "Admin",
    href: "/admin",
    name: "Priya Nair",
    email: "priya.nair@alignhq.test",
    password: "AlignHQ-demo-2026!",
    note: "Govern completion, audit, unlock, export"
  }
];
