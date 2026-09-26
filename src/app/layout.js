import { Noto_Serif, Roboto } from "next/font/google";
import "./globals.css";
import "./bluebook.css";
import MathJaxProvider from "@/components/MathJaxProvider";

// Bluebook sets its interface in Roboto and test content in Noto Serif.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--mk-sans",
});

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--mk-serif",
});

const themeScript = `(() => {
  try {
    const saved = localStorage.getItem("sat-practice-theme");
    const theme = saved === "light" || saved === "dark"
      ? saved
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();`;

export const metadata = {
  title: "SAT + PSAT Reading & Writing Practice",
  description:
    "Bluebook-style practice for SAT and PSAT Reading and Writing, with optional instant answer checking and per-question timing.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`h-full ${roboto.variable} ${notoSerif.variable}`}>
        <MathJaxProvider>{children}</MathJaxProvider>
      </body>
    </html>
  );
}
