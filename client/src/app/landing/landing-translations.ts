export type LandingLocale = "vi" | "en";

const vi = {
  navHome: "Trang chủ",
  navAbout: "Vấn đề",
  navFeatures: "Tính năng",
  navFaq: "FAQ",
  navContact: "Liên hệ",
  navSignIn: "Đăng nhập",
  navSignUp: "Đăng ký",
  navOpenApp: "Mở ứng dụng",
  navGithubAria: "Tìm mã nguồn trên GitHub",
  navMenuOpen: "Mở menu",
  navLangVi: "Tiếng Việt",
  navLangEn: "English",

  heroBadge: "VALSEA — Realtime + batch speech pipeline",
  heroTitleBefore: "Trợ lý lớp học",
  heroTitleHighlight: "nghe bài giảng trực tiếp",
  heroLead:
    "Cho bài giảng Việt–Anh: transcript chạy live, ghi chú có cấu trúc, giải thích dễ hiểu và ngữ cảnh học tập — qua 6 endpoint VALSEA trên gateway an toàn.",
  heroSub:
    "Speech-first classroom copilot for mixed Vietnamese–English university lectures.",
  heroCtaPrimary: "Mở Classroom Copilot",
  heroCtaSecondary: "Xem luồng tính năng",
  heroMockTranscriptLabel: "Live transcript",
  heroMockListening: "listening",
  heroMockLine1:
    "…thầy nói gradient descent cần chọn learning rate hợp lý…",
  heroMockLine2: "Partial: batch ASR & annotations đồng bộ qua VALSEA…",
  heroMockAssistantLabel: "Learning assistant",
  heroMockAssistantBadge: "Clarifications + Notes",
  heroMockBullet1: "Giải thích lại khái niệm bằng tiếng Việt ngắn gọn, ví dụ minh họa.",
  heroMockBullet2: "Bản dịch / thuật ngữ song ngữ khi cần.",
  heroMockBullet3: "Ghi chú có heading, bullet — export & lưu session.",

  stripIntro:
    "Một pipeline học tập: từ giọng nói trong lớp tới transcript, tag ngữ nghĩa, giải thích và ghi chú — qua các capability VALSEA mà app gọi qua backend.",

  capRealtimeAsr: "Realtime ASR",
  capBatch: "Batch transcription",
  capAnnotations: "Annotations",
  capClarifications: "Clarifications",
  capTranslations: "Translations",
  capFormatting: "Formatting → structured notes",

  statEndpointsMainLabel: "VALSEA endpoints",
  statEndpointsDesc: "Realtime + batch & học tập",
  statPcmLabel: "PCM mono",
  statPcmDesc: "Chuẩn hóa audio trước gateway",
  statGatewayValue: "Gateway",
  statGatewayLabel: "API key tách biệt",
  statGatewayDesc: "Không lộ key ở trình duyệt",
  statAssistValue: "Live assist",
  statAssistLabel: "Clarify + format",
  statAssistDesc: "Giải thích & ghi chú có cấu trúc",

  aboutBadge: "Vấn đề & cách tiếp cận",
  aboutTitle: "Từ giọng nói trong lớp tới ghi chú và quiz — trong một màn hình",
  aboutLead:
    "Classroom Copilot nhắm tới sinh viên Việt Nam trong các môn dùng nhiều thuật ngữ tiếng Anh. Ứng dụng kết hợp ASR realtime, xử lý batch khi cần, và các bước học tập (làm rõ, dịch, format) để bạn không phải tự lắp nhiều công cụ rời.",
  aboutCard1Title: "Đúng bài toán lớp Việt–Anh",
  aboutCard1Body:
    "Giảng viên nói tiếng Việt xen thuật ngữ tiếng Anh; sinh viên vừa nghe vừa dịch trong đầu dễ hụt ý — copilot gom lại thành chữ và ngữ cảnh học.",
  aboutCard2Title: "Speech-first, không cần gõ lại",
  aboutCard2Body:
    "Bắt luồng âm thanh hoặc file backup, transcript realtime song song với trợ lý phải: giải thích, dịch, định dạng ghi chú.",
  aboutCard3Title: "Tích hợp sâu nhưng an toàn",
  aboutCard3Body:
    "Frontend nói chuyện với gateway của bạn; VALSEA được gọi phía server để API key không nằm trên trình duyệt.",
  aboutCta: "Thử luồng demo",

  featBadge: "Tính năng & VALSEA",
  featTitle: "Sáu endpoint — một trải nghiệm lớp học liền mạch",
  featLead:
    "Mỗi bước có thể bật khi cần; app ghép chúng thành luồng: nghe → hiểu → ghi chú, thay vì xoay qua nhiều tab công cụ.",
  featRealtimeDesc:
    "Stream audio (ví dụ 16 kHz PCM mono) qua WebSocket tới gateway; transcript hiện dần bên trái khi bạn nghe bài.",
  featBatchDesc:
    "Upload file âm thanh khi mic không ổn định — vẫn có transcript đầy đủ để tiếp tục pipeline học tập.",
  featAnnotDesc:
    "Gắn tag ngữ nghĩa lên đoạn nói để phân tách chủ đề, thuật ngữ và mạch bài dễ theo dõi.",
  featClarifyDesc:
    "Giải thích lại bằng tiếng Việt dễ hiểu — hữu ích khi thầy cô vừa nhắc khái niệm tiếng Anh vừa giảng nhanh.",
  featTranslateDesc:
    "Song ngữ khi cần: giữ ngữ cảnh bài, không chỉ dịch từng câu rời rạc.",
  featFormatDesc:
    "Biến transcript thành ghi chú có heading và bullet — sẵn sàng ôn hoặc export.",
  featFlowTitle: "Luồng sử dụng gợi ý trong demo",
  featWf1Title: "Start listening hoặc upload",
  featWf1Body:
    "Cấp quyền mic hoặc chọn file; trạng thái kết nối và ASR hiển thị rõ trên header.",
  featWf2Title: "Bật Live Assist",
  featWf2Body:
    "Trợ lý đọc transcript và các tag từ VALSEA để đề xuất giải thích, dịch và bullet ghi chú.",
  featWf3Title: "Session & export",
  featWf3Body:
    "Lưu phiên, mở lại sau; hỗ trợ các thao tác demo như “I’m confused” và xuất nội dung.",
  featOpenApp: "Vào ứng dụng",

  faqBadge: "FAQ",
  faqTitle: "Câu hỏi thường gặp",
  faqSubtitle:
    "Một vài điểm hay được hỏi khi demo Classroom Copilot và tích hợp VALSEA.",
  faq1q: "Classroom Copilot khác gì với ghi chú tay hoặc chỉ dùng dict?",
  faq1a:
    "App nghe hoặc nhận file âm thanh, chạy ASR qua VALSEA và giữ transcript cạnh trợ lý học tập. Bạn có làm rõ (clarifications), dịch, tag ngữ nghĩa và format ghi chú trong cùng phiên — không phải tự gõ lại từ đầu.",
  faq2q: "API key VALSEA có nằm trong trình duyệt không?",
  faq2a:
    "Trong kiến trúc demo, trình duyệt nói chuyện với gateway/backend của bạn; VALSEA được gọi phía server để khóa API không lộ ở frontend.",
  faq3q: "Realtime và batch transcription dùng khi nào?",
  faq3a:
    "Realtime phù hợp khi bạn đang trong lớp và muốn chữ chạy theo thời gian. Batch hữu ích khi mic lỗi hoặc bạn chỉ có file ghi âm — vẫn đủ transcript để chạy các bước annotations, clarifications, formatting sau đó.",
  faq4q: "Ứng dụng nhắm tới loại bài giảng nào?",
  faq4a:
    "Đặc biệt phù hợp bài giảng tiếng Việt xen nhiều thuật ngữ tiếng Anh (CS, STEM, kinh tế…). Luồng vẫn dùng được cho tiếng Anh thuần nếu cấu hình ASR hỗ trợ.",
  faq5q: "Tôi có cần đăng nhập để thử demo không?",
  faq5a:
    "Tùy cách bạn triển khai auth trong repo. Trên landing, nút “Mở Classroom Copilot” dẫn thẳng tới /classroom-copilot; nếu route yêu cầu session, hãy dùng Đăng nhập / Đăng ký trên thanh điều hướng.",
  faq6q: "Dữ liệu session được lưu ở đâu?",
  faq6a:
    "Theo triển khai backend của dự án (ví dụ danh sách session tại /session). Landing chỉ giới thiệu sản phẩm; chi tiết lưu trữ xem tài liệu hoặc API server trong repo.",
  faqSupport: "Vẫn cần hỗ trợ triển khai?",
  faqContact: "Liên hệ",

  ctaBadge: "Classroom Copilot",
  ctaPillAsr: "Realtime ASR",
  ctaPillEndpoints: "6 VALSEA endpoints",
  ctaPillGateway: "Gateway bảo vệ API key",
  ctaTitleBefore: "Sẵn sàng",
  ctaTitleHighlight: "vào tiết học",
  ctaTitleAfter: "thử?",
  ctaLead:
    "Mở Classroom Copilot, bật mic hoặc upload bản ghi — transcript và trợ lý chạy trên cùng một layout hai cột như trong kịch bản demo.",
  ctaPrimary: "Mở Classroom Copilot",
  ctaSecondary: "Đọc lại tính năng",

  contactBadge: "Liên hệ",
  contactTitle: "Phản hồi, hợp tác hoặc triển khai",
  contactLead:
    "Form mẫu để demo UI — kết nối backend thật khi bạn sẵn sàng. Hoặc mở thẳng ứng dụng để thử luồng VALSEA.",
  contactCard1Title: "Mở ứng dụng",
  contactCard1Body:
    "Vào giao diện hai cột: transcript và trợ lý học tập như trong kịch bản demo.",
  contactCard1Btn: "Classroom Copilot",
  contactCard2Title: "Tài liệu trong repo",
  contactCard2Body:
    "Xem README và script demo live để nắm thời gian và thao tác trên sân khấu.",
  contactCard2Btn: "Tóm tắt tính năng",
  contactCard3Title: "Email (gợi ý)",
  contactCard3Body:
    "Gắn địa chỉ team của bạn vào footer hoặc xử lý form submit qua API.",
  contactCard3Btn: "Form bên cạnh →",
  contactFormTitle: "Gửi tin nhắn",
  contactLabelFirst: "Tên",
  contactLabelLast: "Họ",
  contactLabelEmail: "Email",
  contactLabelSubject: "Chủ đề",
  contactLabelMessage: "Nội dung",
  contactPhFirst: "Travis",
  contactPhLast: "Nguyễn",
  contactPhSubject: "Triển khai VALSEA, bug, góp ý UX…",
  contactPhMessage: "Mô tả ngắn nhu cầu hoặc môi trường triển khai…",
  contactSubmit: "Gửi (demo)",
  contactErrFirst: "Ít nhất 2 ký tự.",
  contactErrLast: "Ít nhất 2 ký tự.",
  contactErrEmail: "Email không hợp lệ.",
  contactErrSubject: "Chủ đề quá ngắn.",
  contactErrMessage: "Nội dung quá ngắn.",

  footNewsTitle: "Nhận cập nhật (demo)",
  footNewsLead:
    "Form newsletter mẫu — nối tới dịch vụ email khi bạn publish sản phẩm.",
  footEmailPh: "Email của bạn",
  footSubscribe: "Đăng ký",
  footErrEmail: "Email không hợp lệ.",
  footTagline:
    "Trợ lý lớp học ưu tiên giọng nói, tích hợp VALSEA cho transcript, làm rõ, dịch và ghi chú có cấu trúc — dành cho bài giảng Việt–Anh.",
  footColProduct: "Sản phẩm",
  footLinkFeatures: "Tính năng",
  footLinkAbout: "Vấn đề & sứ mệnh",
  footLinkFaq: "FAQ",
  footLinkContact: "Liên hệ",
  footColApp: "Ứng dụng",
  footLinkCopilot: "Classroom Copilot",
  footColPages: "Trang",
  footLinkHome: "Trang chủ landing",
  footLinkLandingPath: "Landing /landing",
  footColLegal: "Pháp lý",
  footLinkPrivacy: "Privacy",
  footLinkTerms: "Terms",
  footLinkSecurity: "Security",
  footMadeWith: "Made with",
  footForLearners: "for learners by trahoangdev",
  footCopyright: "© {year} Classroom Copilot",
} as const;

const en: { [K in keyof typeof vi]: string } = {
  navHome: "Home",
  navAbout: "Problem",
  navFeatures: "Features",
  navFaq: "FAQ",
  navContact: "Contact",
  navSignIn: "Sign in",
  navSignUp: "Sign up",
  navOpenApp: "Open app",
  navGithubAria: "Find source on GitHub",
  navMenuOpen: "Open menu",
  navLangVi: "Tiếng Việt",
  navLangEn: "English",

  heroBadge: "VALSEA — Realtime + batch speech pipeline",
  heroTitleBefore: "A classroom copilot that",
  heroTitleHighlight: "listens to lectures live",
  heroLead:
    "For Vietnamese–English classes: live transcript, structured notes, plain-language explanations, and learning context — via 6 VALSEA endpoints behind a secure gateway.",
  heroSub:
    "Speech-first classroom copilot for mixed Vietnamese–English university lectures.",
  heroCtaPrimary: "Open Classroom Copilot",
  heroCtaSecondary: "See feature flow",
  heroMockTranscriptLabel: "Live transcript",
  heroMockListening: "listening",
  heroMockLine1:
    "…the lecturer says gradient descent needs a reasonable learning rate…",
  heroMockLine2: "Partial: batch ASR & annotations in sync via VALSEA…",
  heroMockAssistantLabel: "Learning assistant",
  heroMockAssistantBadge: "Clarifications + Notes",
  heroMockBullet1:
    "Short Vietnamese explanations with examples when concepts fly by.",
  heroMockBullet2: "Bilingual glosses and translations when you need them.",
  heroMockBullet3: "Structured notes with headings and bullets — export & sessions.",

  stripIntro:
    "One learning pipeline: from in-class speech to transcript, semantic tags, explanations, and notes — VALSEA capabilities your app calls through the backend.",

  capRealtimeAsr: "Realtime ASR",
  capBatch: "Batch transcription",
  capAnnotations: "Annotations",
  capClarifications: "Clarifications",
  capTranslations: "Translations",
  capFormatting: "Formatting → structured notes",

  statEndpointsMainLabel: "VALSEA endpoints",
  statEndpointsDesc: "Realtime + batch & learning",
  statPcmLabel: "PCM mono",
  statPcmDesc: "Normalized audio before the gateway",
  statGatewayValue: "Gateway",
  statGatewayLabel: "Keys off the client",
  statGatewayDesc: "API keys stay on the server",
  statAssistValue: "Live assist",
  statAssistLabel: "Clarify + format",
  statAssistDesc: "Explanations & structured notes",

  aboutBadge: "Problem & approach",
  aboutTitle: "From lecture audio to notes and quizzes — in one screen",
  aboutLead:
    "Classroom Copilot targets students in courses heavy on English terminology. It combines realtime ASR, batch fallback, and learning steps (clarify, translate, format) so you do not juggle a dozen separate tools.",
  aboutCard1Title: "The Vietnamese–English lecture problem",
  aboutCard1Body:
    "Instructors mix Vietnamese with English terms; students listen, mentally translate, and miss beats — the copilot turns speech into text and learning context.",
  aboutCard2Title: "Speech-first, less typing",
  aboutCard2Body:
    "Capture live audio or a backup file; realtime transcript sits next to an assistant for explanations, translation, and formatted notes.",
  aboutCard3Title: "Deep integration, safer keys",
  aboutCard3Body:
    "The browser talks to your gateway; VALSEA is called server-side so secrets never ship to the client.",
  aboutCta: "Try the demo flow",

  featBadge: "Features & VALSEA",
  featTitle: "Six endpoints — one seamless classroom flow",
  featLead:
    "Enable each step as needed; the app chains them into listen → understand → note instead of tab-hopping across tools.",
  featRealtimeDesc:
    "Stream audio (e.g. 16 kHz PCM mono) over WebSocket to your gateway; transcript grows on the left while you listen.",
  featBatchDesc:
    "Upload audio when the mic is unreliable — still get a full transcript for the rest of the learning pipeline.",
  featAnnotDesc:
    "Semantic tags on spans help separate topics, terms, and narrative flow.",
  featClarifyDesc:
    "Plain-language clarification — useful when English terms drop in fast during Vietnamese explanations.",
  featTranslateDesc:
    "Bilingual support with lecture context, not isolated sentence swaps.",
  featFormatDesc:
    "Turn transcript into structured notes with headings and bullets — ready to review or export.",
  featFlowTitle: "Suggested flow in the demo",
  featWf1Title: "Start listening or upload",
  featWf1Body:
    "Grant mic access or pick a file; connection and ASR status stay visible in the header.",
  featWf2Title: "Turn on Live Assist",
  featWf2Body:
    "The assistant reads transcript and VALSEA tags to suggest explanations, translations, and note bullets.",
  featWf3Title: "Session & export",
  featWf3Body:
    "Save sessions and reopen later; demo flows include “I’m confused” and exporting content.",
  featOpenApp: "Open the app",

  faqBadge: "FAQ",
  faqTitle: "Frequently asked questions",
  faqSubtitle: "Common questions when demoing Classroom Copilot and VALSEA.",
  faq1q: "How is Classroom Copilot different from manual notes or a dictionary?",
  faq1a:
    "The app listens or accepts audio, runs ASR through VALSEA, and keeps transcript beside the learning assistant. Clarifications, translation, semantic tags, and formatted notes stay in one session — no retyping from scratch.",
  faq2q: "Does the VALSEA API key live in the browser?",
  faq2a:
    "In the demo architecture, the browser talks to your gateway/backend; VALSEA is invoked server-side so keys are not exposed on the client.",
  faq3q: "When do I use realtime vs batch transcription?",
  faq3a:
    "Realtime fits live class when you want text to follow the lecture. Batch helps when the mic fails or you only have a recording — you still get a transcript for annotations, clarifications, and formatting.",
  faq4q: "What lecture styles does this target?",
  faq4a:
    "Especially Vietnamese lectures with lots of English terms (CS, STEM, economics…). Pure English works too if your ASR setup supports it.",
  faq5q: "Do I need to sign in to try the demo?",
  faq5a:
    "Depends on how you deploy auth in this repo. The landing “Open Classroom Copilot” button goes to /classroom-copilot; if that route requires a session, use Sign in / Sign up in the nav.",
  faq6q: "Where are sessions stored?",
  faq6a:
    "Per your backend (e.g. session list at /session). The landing is marketing only; see repo docs or server APIs for storage details.",
  faqSupport: "Need deployment help?",
  faqContact: "Contact",

  ctaBadge: "Classroom Copilot",
  ctaPillAsr: "Realtime ASR",
  ctaPillEndpoints: "6 VALSEA endpoints",
  ctaPillGateway: "Gateway-protected API keys",
  ctaTitleBefore: "Ready to try it",
  ctaTitleHighlight: "in class",
  ctaTitleAfter: "?",
  ctaLead:
    "Open Classroom Copilot, use the mic or upload a recording — transcript and assistant share the same two-column layout as in the demo script.",
  ctaPrimary: "Open Classroom Copilot",
  ctaSecondary: "Review features",

  contactBadge: "Contact",
  contactTitle: "Feedback, partnerships, or rollout",
  contactLead:
    "Sample form for the UI — wire it to a real backend when you ship. Or jump into the app to try the VALSEA flow.",
  contactCard1Title: "Open the app",
  contactCard1Body:
    "Two-column UI: transcript and learning assistant, as in the live demo script.",
  contactCard1Btn: "Classroom Copilot",
  contactCard2Title: "Docs in the repo",
  contactCard2Body:
    "Read the README and live demo script for timing and on-stage actions.",
  contactCard2Btn: "Feature summary",
  contactCard3Title: "Email (placeholder)",
  contactCard3Body:
    "Add your team address in the footer or handle submits via API.",
  contactCard3Btn: "Form beside this →",
  contactFormTitle: "Send a message",
  contactLabelFirst: "First name",
  contactLabelLast: "Last name",
  contactLabelEmail: "Email",
  contactLabelSubject: "Subject",
  contactLabelMessage: "Message",
  contactPhFirst: "Alex",
  contactPhLast: "Nguyen",
  contactPhSubject: "VALSEA rollout, bug, UX feedback…",
  contactPhMessage: "Brief needs or environment…",
  contactSubmit: "Send (demo)",
  contactErrFirst: "At least 2 characters.",
  contactErrLast: "At least 2 characters.",
  contactErrEmail: "Invalid email.",
  contactErrSubject: "Subject too short.",
  contactErrMessage: "Message too short.",

  footNewsTitle: "Get updates (demo)",
  footNewsLead:
    "Sample newsletter form — connect an email provider when you launch.",
  footEmailPh: "Your email",
  footSubscribe: "Subscribe",
  footErrEmail: "Invalid email.",
  footTagline:
    "Speech-first classroom copilot with VALSEA for transcript, clarification, translation, and structured notes — built for Vietnamese–English lectures.",
  footColProduct: "Product",
  footLinkFeatures: "Features",
  footLinkAbout: "Problem & mission",
  footLinkFaq: "FAQ",
  footLinkContact: "Contact",
  footColApp: "App",
  footLinkCopilot: "Classroom Copilot",
  footColPages: "Pages",
  footLinkHome: "Landing home",
  footLinkLandingPath: "Landing /landing",
  footColLegal: "Legal",
  footLinkPrivacy: "Privacy",
  footLinkTerms: "Terms",
  footLinkSecurity: "Security",
  footMadeWith: "Made with",
  footForLearners: "for learners by trahoangdev",
  footCopyright: "© {year} Classroom Copilot",
};

export type LandingKey = keyof typeof vi;

export const landingTranslations: Record<LandingLocale, Record<LandingKey, string>> = {
  vi: vi,
  en: en,
};

export function pickT(locale: LandingLocale) {
  const table = landingTranslations[locale];
  return (key: LandingKey) => table[key];
}
