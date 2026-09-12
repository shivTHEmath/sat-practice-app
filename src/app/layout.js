import "./globals.css";

export const metadata = {
  title: "SAT Reading & Writing Practice",
  description:
    "Bluebook-style practice for SAT Reading and Writing, with optional instant answer checking and per-question timing.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
