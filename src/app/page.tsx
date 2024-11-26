import Game from "@/components/game/game"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
	return (
		<main className="container mx-auto p-4 min-h-screen flex justify-center">
			<Card className="w-full max-w-3xl">
				<CardHeader>
					<CardTitle className="text-center">Bomberman</CardTitle>
				</CardHeader>
				<CardContent>
					<Game />
				</CardContent>
			</Card>
		</main>
	)
}
