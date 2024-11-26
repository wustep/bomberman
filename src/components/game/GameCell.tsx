import { cn } from "@/lib/utils"

import type { Player } from "./types"
import {
	CELL_WALL,
	CELL_GRASS,
	CELL_EMPTY,
	CELL_BOMB,
	CELL_GRASS_BREAKING,
	CELL_EXPLOSION,
	PLAYER_1,
	PLAYER_2,
	PLAYER_DEAD,
	PET_OWL,
	PET_TURTLE,
} from "./constants"

type GameCellProps = {
	cell: string
	x: number
	y: number
	players: {
		p1: Player
		p2: Player
	}
}

export function GameCell({ cell, x, y, players }: GameCellProps) {
	const isP1Here = players.p1.x === x && players.p1.y === y
	const isP2Here = players.p2.x === x && players.p2.y === y
	const p1Invulnerable = Date.now() < players.p1.invulnerableUntil
	const p2Invulnerable = Date.now() < players.p2.invulnerableUntil

	return (
		<div
			key={`${x}-${y}`}
			className="w-8 h-8 flex items-center justify-center relative"
		>
			<div
				className={cn(
					"absolute inset-0 flex items-center justify-center text-3xl"
				)}
			>
				{cell === CELL_WALL
					? CELL_WALL
					: cell === CELL_GRASS
					? CELL_GRASS
					: CELL_EMPTY}
			</div>
			{cell === CELL_GRASS_BREAKING && (
				<div
					className={cn(
						"absolute inset-0 flex items-center justify-center text-3xl",
						cell === CELL_GRASS_BREAKING && "animate-grassBreak"
					)}
				>
					{CELL_GRASS}
				</div>
			)}
			{cell === CELL_BOMB && (
				<div
					className="absolute text-3xl z-0 transition-all duration-75"
					style={{
						filter: (() => {
							const bomb = [...players.p1.bombs, ...players.p2.bombs].find(
								(b) => b.x === x && b.y === y
							)
							if (!bomb) return "none"
							const elapsed = (Date.now() - bomb.startTime) / 1000
							const progress = Math.min(elapsed / 2, 1)
							return `
												sepia(${progress * 100}%)
												saturate(${100 + progress * 700}%)
												hue-rotate(${-progress * 130}deg)
												brightness(${100 + progress * 150}%)
											`
						})(),
					}}
				>
					💣
				</div>
			)}
			<div
				className={cn(
					"z-10 absolute transition-all",
					cell === CELL_EXPLOSION
						? "text-3xl animate-[explosion_256ms_ease-out_forwards]"
						: "text-2xl",
					(isP1Here && p1Invulnerable) || (isP2Here && p2Invulnerable)
						? "animate-[flash_400ms_ease-in-out_infinite]"
						: ""
				)}
			>
				{players.p1.x === x && players.p1.y === y ? (
					<div className={cn("relative flex flex-col items-center")}>
						<span
							className={cn(
								"relative z-0",
								players.p1.pet ? "text-xl mb-[-1rem]" : ""
							)}
						>
							{players.p1.alive ? PLAYER_1 : PLAYER_DEAD}
						</span>
						{players.p1.pet && (
							<span
								className={cn(
									"text-2xl z-10 relative",
									// Owl faces right (🦉), turtle faces left (🐢)
									(players.p1.orientation === "left" &&
										players.p1.pet === PET_OWL) ||
										(players.p1.orientation === "right" &&
											players.p1.pet === PET_TURTLE)
										? "scale-x-[-1]"
										: ""
								)}
							>
								{players.p1.pet}
							</span>
						)}
					</div>
				) : players.p2.x === x && players.p2.y === y ? (
					<div className={cn("relative flex flex-col items-center")}>
						<span
							className={cn(
								"relative z-0",
								players.p2.pet ? "text-xl mb-[-1rem]" : ""
							)}
						>
							{players.p2.alive ? PLAYER_2 : PLAYER_DEAD}
						</span>
						{players.p2.pet && (
							<span
								className={cn(
									"text-2xl z-10 relative",
									(players.p2.orientation === "left" &&
										players.p2.pet === PET_OWL) ||
										(players.p2.orientation === "right" &&
											players.p2.pet === PET_TURTLE)
										? "scale-x-[-1]"
										: ""
								)}
							>
								{players.p2.pet}
							</span>
						)}
					</div>
				) : cell !== CELL_BOMB &&
				  cell !== CELL_WALL &&
				  cell !== CELL_EMPTY &&
				  cell !== CELL_GRASS &&
				  cell !== CELL_GRASS_BREAKING ? (
					cell
				) : null}
			</div>
		</div>
	)
}
