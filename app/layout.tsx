export const metadata = {
  title: "FX Volume",
  description: "نظام تحليل وتداول ذكي",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          background: "#09090b",
          color: "white",
          fontFamily: "system-ui",
          margin: 0,
          padding: "20px",
        }}
      >
        {children}
      </body>
    </html>
  );
}
