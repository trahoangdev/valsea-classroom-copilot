import type { Metadata } from "next";
import { LandingPageContent } from "./landing/landing-page-content";

export const metadata: Metadata = {
  title: "Classroom Copilot — Trợ lý lớp học Việt–Anh với VALSEA",
  description:
    "Nghe bài giảng trực tiếp, transcript realtime, ghi chú có cấu trúc, giải thích và quiz — tích hợp sâu 6 endpoint VALSEA cho lớp đại học song ngữ.",
  keywords: [
    "VALSEA",
    "classroom copilot",
    "ASR",
    "transcript",
    "Vietnamese English",
    "lecture assistant",
  ],
  openGraph: {
    title: "Classroom Copilot — VALSEA",
    description:
      "Speech-first classroom copilot: realtime ASR, clarifications, translations, structured notes.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Classroom Copilot — VALSEA",
    description:
      "Trợ lý học tập nghe bài giảng trực tiếp cho sinh viên Việt Nam — tích hợp VALSEA.",
  },
};

export default function HomePage() {
  return <LandingPageContent />;
}
