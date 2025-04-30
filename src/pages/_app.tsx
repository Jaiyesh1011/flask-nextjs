// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Doctor Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Manage doctors with a clean interface" />
      </Head>

      {/* Main Layout Wrapper */}
      <div className="layout bg-gray-50 text-gray-900 font-sans min-h-screen">
        <Component {...pageProps} />
      </div>
    </>
  );
}
