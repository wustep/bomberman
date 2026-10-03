import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
})
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
})

const SITE_URL = "https://wustep-bomberman.vercel.app"
const title = "Bomberman"
const description =
	"A two-player Bomberman clone with emojis, pets and power-ups. Inspired by Crazy Arcade."
const image = {
	url: `${SITE_URL}/og.png`,
	width: 1200,
	height: 630,
	alt: "An emoji Bomberman board mid-game: one player drops a bomb while a blossom of explosions just misses the other, riding a turtle.",
}

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title,
	description,
	alternates: { canonical: SITE_URL },
	openGraph: {
		type: "website",
		siteName: title,
		title,
		description,
		url: SITE_URL,
		images: [image],
	},
	twitter: {
		card: "summary_large_image",
		title,
		description,
		images: [image],
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{children}
			</body>
		</html>
	)
}
