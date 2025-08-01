import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'User Management Foundation',
  description: 'A comprehensive user management system built with Next.js and Cosmic CMS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}