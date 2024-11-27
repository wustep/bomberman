import { cn } from "@/lib/utils"
import { Orientation, Pet, Player } from "./types"
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
	POWERUPS,
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

	return (
		<div className="w-8 h-8 flex items-center justify-center relative">
			<BaseCell cell={cell} />
			<Bomb players={players} x={x} y={y} />
			<div
				className={cn(
					"z-10 absolute transition-all",
					cell === CELL_EXPLOSION
						? "text-3xl animate-[explosion_256ms_ease-out_forwards]"
						: "text-2xl"
				)}
			>
				{isP1Here && players.p1.x === x && players.p1.y === y ? (
					<PlayerAvatar
						player={PLAYER_1}
						pet={players.p1.pet}
						alive={players.p1.alive}
						orientation={players.p1.orientation}
						isInvulnerable={Date.now() < players.p1.invulnerableUntil}
					/>
				) : isP2Here && players.p2.x === x && players.p2.y === y ? (
					<PlayerAvatar
						player={PLAYER_2}
						pet={players.p2.pet}
						alive={players.p2.alive}
						orientation={players.p2.orientation}
						isInvulnerable={Date.now() < players.p2.invulnerableUntil}
					/>
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

function BaseCell({ cell }: { cell: string }) {
	if (cell === CELL_GRASS_BREAKING) {
		return (
			<>
				<div
					className={cn(
						"absolute inset-0 flex items-center justify-center text-3xl",
						`z-[${zIndices.baseCell}]`
					)}
				>
					{CELL_EMPTY}
				</div>
				<div
					className={cn(
						"absolute inset-0 flex items-center justify-center text-3xl animate-grassBreak",
						`z-[${zIndices.breakingGlass}]`
					)}
				>
					{CELL_GRASS}
				</div>
			</>
		)
	}

	return (
		<div
			className={cn(
				"absolute inset-0 flex items-center justify-center text-3xl",
				`z-[${zIndices.baseCell}]`
			)}
		>
			{cell === CELL_WALL
				? CELL_WALL
				: cell === CELL_GRASS
				? CELL_GRASS
				: CELL_EMPTY}
		</div>
	)
}

function Bomb({
	players,
	x,
	y,
}: {
	players: GameCellProps["players"]
	x: number
	y: number
}) {
	const bomb = [...players.p1.bombs, ...players.p2.bombs].find(
		(b) => b.x === x && b.y === y
	)
	if (!bomb) return null

	const elapsed = (Date.now() - bomb.startTime) / 1000
	const progress = Math.min(elapsed / 2, 1)
	const filter = `
		sepia(${progress * 100}%)
		saturate(${100 + progress * 700}%)
		hue-rotate(${-progress * 130}deg)
		brightness(${100 + progress * 150}%)
	`

	return (
		<div
			className={cn(
				"absolute text-3xl transition-all duration-75",
				`z-[${zIndices.bomb}]`
			)}
			style={{ filter }}
		>
			💣
		</div>
	)
}

function PlayerAvatar({
	player,
	pet,
	alive,
	orientation,
	isInvulnerable,
}: {
	player: typeof PLAYER_1 | typeof PLAYER_2
	pet: Pet | null
	alive: boolean
	orientation: Orientation
	isInvulnerable: boolean
}) {
	/**
	 * Owl faces right (🦉), turtle faces left (🐢),
	 * so we flip the pet if the player is facing the opposite direction.
	 */
	const shouldFlip =
		(orientation === "left" && pet?.emoji === POWERUPS.OWL.emoji) ||
		(orientation === "right" && pet?.emoji === POWERUPS.TURTLE.emoji)

	return (
		<div
			className={cn(
				"relative flex flex-col items-center",
				isInvulnerable ? "animate-[flash_400ms_ease-in-out_infinite]" : ""
			)}
		>
			<span
				className={cn(
					"relative",
					`z-[${zIndices.player}]`,
					pet ? "text-xl mb-[-1rem]" : ""
				)}
			>
				{alive ? player : PLAYER_DEAD}
			</span>
			{pet && (
				<span
					className={cn(
						"text-2xl relative",
						`z-[${zIndices.pet}]`,
						shouldFlip ? "scale-x-[-1]" : ""
					)}
				>
					{pet.emoji}
				</span>
			)}
		</div>
	)
}

/**
 * z-index values for the game cells, for when multiple objects are on top of each other.
 */
const zIndices = {
	baseCell: 0,
	breakingGlass: 1,
	bomb: 2,
	player: 3,
	pet: 4,
}
