import Game from "@/components/game/Game"

export default function Home() {
	return (
		<main className="container mx-auto p-4 gap-6 flex flex-col justify-center max-w-2xl">
			<h1 className="h-1 text-2xl font-bold text-center mb-4">Bomberman</h1>
			<Game />
		</main>
	)
}
