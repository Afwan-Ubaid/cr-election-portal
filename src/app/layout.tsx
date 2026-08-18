import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class Representative (CR) Election Portal",
  description: "Cast your vote securely in a wobbly, hand-drawn 3D classroom corridor.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col paper-texture">
        {children}
        
        {/* Hidden SVG filters for the hand-drawn 'rough edge' effect */}
        <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none', width: 0, height: 0 }}>
          <defs>
            <filter id="rough-edge">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="very-rough-edge">
              <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
