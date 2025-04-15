import type { Metadata } from 'next';

export const metadata: Metadata = {};

export default function ShortsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 