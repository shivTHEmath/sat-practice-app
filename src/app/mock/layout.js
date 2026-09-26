import { Noto_Serif, Roboto } from "next/font/google";
import "./mock.css";

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

export const metadata = {
  title: "PSAT Mock Tests",
  description: "Full-length, timed PSAT mock tests in a Bluebook-style testing interface.",
};

export default function MockLayout({ children }) {
  return <div className={`${roboto.variable} ${notoSerif.variable} mk-fonts`}>{children}</div>;
}
