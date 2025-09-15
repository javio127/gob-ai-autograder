import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Goblins Auto-Grader (Vision-Only)',
  description: 'Whiteboard-based auto-grading with rubric-guided vision model',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </body>
    </html>
  );
}


