export const metadata = {
  title: "quiz",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en">
      <body>{children}</body>
    </html>
  );
}
