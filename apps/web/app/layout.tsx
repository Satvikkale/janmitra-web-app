import Navbar from '../navbar/navbar';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';
import Footer from '../footer/footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>JanMirta</title>
      </head>
      <body>
        <AuthProvider>
          <Navbar />
          <main suppressHydrationWarning>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}