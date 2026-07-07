import type { Role } from "@/types/alignhq";

export type DemoAccount = {
  role: Role;
  href: string;
  name: string;
  email: string;
  password: string;
  note: string;
};

const demoAuthPassword = process.env.NEXT_PUBLIC_ALIGNHQ_DEMO_PASSWORD ?? "";

export const demoAccounts: DemoAccount[] = [
  {
    role: "Employee",
    href: "/employee",
    name: "Asha Menon",
    email: "asha.menon@alignhq.test",
    password: demoAuthPassword,
    note: "Create goals and submit Q1 updates"
  },
  {
    role: "Manager",
    href: "/manager",
    name: "Isha Rao",
    email: "isha.rao@alignhq.test",
    password: demoAuthPassword,
    note: "Review, return, approve, and comment"
  },
  {
    role: "Admin",
    href: "/admin",
    name: "Priya Nair",
    email: "priya.nair@alignhq.test",
    password: demoAuthPassword,
    note: "Govern completion, audit, unlock, export"
  }
];
