import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submissions",
  robots: { index: false, follow: false },
};

export default function AdminSubmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
