import '@/app/ui/global.css'
import { inter } from './ui/font';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Acme Dashboard',
    template: '%s | Acme Dashboard'
  },
  description: 'The official Next.js Course Dashboard, built with App Router,',
  metadataBase: new URL('https://next-test-9r36.vercel.app')
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* <body>{children}</body> */}
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
