"use client"

import { cn } from "@/lib/utils"
import React, { useState, useEffect, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import GameOverAlert from "./GameOverAlert"

import {
	GRID_SIZE,
	INITIAL_BOMBS_MAX,
	INITIAL_BOMB_RANGE,
	INITIAL_SPEED,
	CELL_EMPTY,
	CELL_WALL,
	CELL_EXPLOSION,
	CELL_BOMB,
	CELL_GRASS,
	CELL_POWERUP_SPEED,
	CELL_POWERUP_RANGE,
	CELL_POWERUP_BOMB,
	CELL_POWERUP_OWL,
	CELL_POWERUP_TURTLE,
	POWERUPS,
	POWERUP_SPAWN_CHANCE,
	POWERUP_SPAWN_INTERVAL,
	POWERUP_SPAWN_GRASS_CHANCE,
	PLAYER_1,
	PLAYER_2,
	PLAYER_DEAD,
	GRASS_SPAWN_CHANCE,
	POWERUP_SPAWN_PET_CHANCE,
} from "./constants"

type KeyState = {
	[key: string]: boolean
}

type Direction = {
	key: string
	dx: number
	dy: number
}

const PLAYER_1_CONTROLS: Direction[] = [
	{ key: "w", dx: 0, dy: -1 },
	{ key: "s", dx: 0, dy: 1 },
	{ key: "a", dx: -1, dy: 0 },
	{ key: "d", dx: 1, dy: 0 },
]

const PLAYER_2_CONTROLS: Direction[] = [
	{ key: "arrowup", dx: 0, dy: -1 },
	{ key: "arrowdown", dx: 0, dy: 1 },
	{ key: "arrowleft", dx: -1, dy: 0 },
	{ key: "arrowright", dx: 1, dy: 0 },
]

type Player = {
	x: number
	y: number
	bombs: Bomb[]
	maxBombs: number
	bombRange: number
	speed: number
	alive: boolean
	lastMove: number
	kills: number
	pet: typeof PET_OWL | typeof PET_TURTLE | null
	baseSpeed: number
}

type Bomb = {
	x: number
	y: number
	timer: number
	range: number
	startTime: number
}

type PowerUp = "⚡️" | "💪" | "➕" | "🦉" | "🐢"

type Explosion = {
	coords: [number, number][]
	clearTime: number
}

type PowerupSpawn = {
	x: number
	y: number
	spawnTime: number
}

export default function Game() {
	const [keys, setKeys] = useState<KeyState>({})
	const [grid, _setGrid] = useState<(string | PowerUp)[][]>(
		Array(GRID_SIZE)
			.fill(null)
			.map(() => Array(GRID_SIZE).fill(CELL_EMPTY))
	)
	const gridRef = useRef<(string | PowerUp)[][]>(grid)
	const setGrid = useCallback(
		(
			newGrid:
				| (string | PowerUp)[][]
				| ((prev: (string | PowerUp)[][]) => (string | PowerUp)[][])
		) => {
			const updatedGrid =
				typeof newGrid === "function" ? newGrid(gridRef.current) : newGrid
			_setGrid(updatedGrid)
			gridRef.current = updatedGrid
		},
		[]
	)

	const [players, _setPlayers] = useState<{ p1: Player; p2: Player }>({
		p1: {
			x: 1,
			y: 1,
			bombs: [],
			maxBombs: INITIAL_BOMBS_MAX,
			bombRange: INITIAL_BOMB_RANGE,
			speed: INITIAL_SPEED,
			alive: true,
			lastMove: 0,
			kills: 0,
			pet: null,
			baseSpeed: INITIAL_SPEED,
		},
		p2: {
			x: GRID_SIZE - 2,
			y: GRID_SIZE - 2,
			bombs: [],
			maxBombs: INITIAL_BOMBS_MAX,
			bombRange: INITIAL_BOMB_RANGE,
			speed: INITIAL_SPEED,
			alive: true,
			lastMove: 0,
			kills: 0,
			pet: null,
			baseSpeed: INITIAL_SPEED,
		},
	})
	const playersRef = useRef<{ p1: Player; p2: Player }>(players)
	const setPlayers = useCallback(
		(
			newPlayers:
				| { p1: Player; p2: Player }
				| ((prev: { p1: Player; p2: Player }) => { p1: Player; p2: Player })
		) => {
			const updatedPlayers =
				typeof newPlayers === "function"
					? newPlayers(playersRef.current)
					: newPlayers
			_setPlayers(updatedPlayers)
			playersRef.current = updatedPlayers
		},
		[]
	)

	const [gameOver, setGameOver] = useState(false)
	const [, setTick] = useState(0)
	const [, setExplosions] = useState<Explosion[]>([])
	const [, setPendingPowerups] = useState<PowerupSpawn[]>([])
	const [showAlert, setShowAlert] = useState(false)

	// Key state management
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase()
			// Special handling for right shift
			if (
				e.key === "Shift" &&
				e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT
			) {
				setKeys((prev) => ({ ...prev, rightshift: true }))
			} else {
				setKeys((prev) => ({ ...prev, [key]: true }))
			}
			e.preventDefault()
		}

		const handleKeyUp = (e: KeyboardEvent) => {
			const key = e.key.toLowerCase()
			// Special handling for right shift
			if (
				e.key === "Shift" &&
				e.location === KeyboardEvent.DOM_KEY_LOCATION_RIGHT
			) {
				setKeys((prev) => ({ ...prev, rightshift: false }))
			} else {
				setKeys((prev) => ({ ...prev, [key]: false }))
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		window.addEventListener("keyup", handleKeyUp)

		return () => {
			window.removeEventListener("keydown", handleKeyDown)
			window.removeEventListener("keyup", handleKeyUp)
		}
	}, [])

	const movePlayer = useCallback(
		(player: "p1" | "p2", dx: number, dy: number) => {
			const currentTime = Date.now()
			if (!playersRef.current[player].alive) return

			const moveDelay = 200 / playersRef.current[player].speed
			if (currentTime - playersRef.current[player].lastMove < moveDelay) return

			const { x, y } = playersRef.current[player]
			const newX = Math.max(0, Math.min(GRID_SIZE - 1, x + dx))
			const newY = Math.max(0, Math.min(GRID_SIZE - 1, y + dy))

			// Collision handling
			const otherPlayer = player === "p1" ? "p2" : "p1"
			if (
				playersRef.current[otherPlayer].x === newX &&
				playersRef.current[otherPlayer].y === newY
			)
				return

			const targetCell = gridRef.current[newY][newX]
			if (
				targetCell === CELL_WALL ||
				targetCell === CELL_BOMB ||
				targetCell === CELL_GRASS
			)
				return

			if (isPowerUp(targetCell)) {
				setPlayers((prev) => {
					const upgrade =
						targetCell === CELL_POWERUP_SPEED
							? {
									speed: prev[player].speed + 0.5,
									baseSpeed: prev[player].baseSpeed + 0.5,
							  }
							: targetCell === CELL_POWERUP_RANGE
							? { bombRange: prev[player].bombRange + 1 }
							: targetCell === CELL_POWERUP_BOMB
							? { maxBombs: prev[player].maxBombs + 1 }
							: targetCell === CELL_POWERUP_OWL
							? { pet: CELL_POWERUP_OWL, speed: prev[player].baseSpeed * 2 }
							: {
									pet: CELL_POWERUP_TURTLE,
									speed: prev[player].baseSpeed * 0.5,
							  }

					return {
						...prev,
						[player]: {
							...prev[player],
							...upgrade,
						},
					}
				})
			}

			setGrid((prev) => {
				const newGrid = [...prev]
				if (isPowerUp(targetCell)) {
					newGrid[newY][newX] = CELL_EMPTY
				}
				return newGrid
			})

			setPlayers((prev) => ({
				...prev,
				[player]: {
					...prev[player],
					x: newX,
					y: newY,
					lastMove: currentTime,
				},
			}))
		},
		[setGrid, setPlayers]
	)

	const placeBomb = useCallback(
		(player: "p1" | "p2") => {
			const { x, y, bombs, maxBombs, bombRange, alive } =
				playersRef.current[player]
			if (bombs.length >= maxBombs || !alive) return

			if (gridRef.current[y][x] === CELL_BOMB) return

			const newBomb = {
				x,
				y,
				timer: 3,
				range: bombRange,
				startTime: Date.now(),
			}
			setPlayers((prev) => ({
				...prev,
				[player]: { ...prev[player], bombs: [...prev[player].bombs, newBomb] },
			}))

			setGrid((prev) => {
				const newGrid = [...prev]
				newGrid[y][x] = CELL_BOMB
				return newGrid
			})

			const explodeBomb = (player: "p1" | "p2", bomb: Bomb) => {
				// Early return if game is already over
				if (gameOver) return

				const { x, y, range } = bomb
				const explosionCoords: Array<[number, number]> = []
				const triggeredBombs: { player: "p1" | "p2"; bomb: Bomb }[] = []
				const powerupSpawns: Array<{ x: number; y: number }> = []

				setPlayers((prev) => ({
					...prev,
					[player]: {
						...prev[player],
						bombs: prev[player].bombs.filter((b) => b !== bomb),
					},
				}))

				const directions = [
					[0, 1],
					[0, -1],
					[1, 0],
					[-1, 0],
				]

				setGrid((prev) => {
					const newGrid = [...prev]

					if (newGrid[y][x] !== CELL_WALL) {
						newGrid[y][x] = CELL_EXPLOSION
						explosionCoords.push([x, y])
					}

					directions.forEach(([dx, dy]) => {
						for (let i = 1; i <= range; i++) {
							const newX = x + dx * i
							const newY = y + dy * i

							if (
								newX < 0 ||
								newX >= GRID_SIZE ||
								newY < 0 ||
								newY >= GRID_SIZE ||
								newGrid[newY][newX] === CELL_WALL
							) {
								break
							}

							// Check for bombs to trigger chain reaction
							if (newGrid[newY][newX] === CELL_BOMB) {
								const p1Bomb = playersRef.current.p1.bombs.find(
									(b) => b.x === newX && b.y === newY
								)
								const p2Bomb = playersRef.current.p2.bombs.find(
									(b) => b.x === newX && b.y === newY
								)

								if (p1Bomb) {
									triggeredBombs.push({ player: "p1", bomb: p1Bomb })
								} else if (p2Bomb) {
									triggeredBombs.push({ player: "p2", bomb: p2Bomb })
								}
							}

							// Handle grass - if it's grass, stop the explosion in this direction
							if (newGrid[newY][newX] === CELL_GRASS) {
								newGrid[newY][newX] = CELL_EXPLOSION
								explosionCoords.push([newX, newY])
								// Queue this location for potential powerup spawn
								if (Math.random() < POWERUP_SPAWN_GRASS_CHANCE) {
									// 30% chance for powerup
									powerupSpawns.push({ x: newX, y: newY })
								}
								break // Stop the explosion in this direction
							}

							newGrid[newY][newX] = CELL_EXPLOSION
							explosionCoords.push([newX, newY])
						}
					})

					return newGrid
				})

				const newPlayers = { ...playersRef.current }
				let someoneKilled = false

				explosionCoords.forEach(([ex, ey]) => {
					if (
						playersRef.current.p1.x === ex &&
						playersRef.current.p1.y === ey &&
						playersRef.current.p1.alive
					) {
						if (newPlayers.p1.pet) {
							// Remove pet and reset speed
							newPlayers.p1.pet = null
							newPlayers.p1.speed = newPlayers.p1.baseSpeed
						} else {
							newPlayers.p1.alive = false
							if (player === "p2") {
								newPlayers.p2.kills++
							}
							someoneKilled = true
						}
					}
					if (
						playersRef.current.p2.x === ex &&
						playersRef.current.p2.y === ey &&
						playersRef.current.p2.alive
					) {
						if (newPlayers.p2.pet) {
							// Remove pet and reset speed
							newPlayers.p2.pet = null
							newPlayers.p2.speed = newPlayers.p2.baseSpeed
						} else {
							newPlayers.p2.alive = false
							if (player === "p1") {
								newPlayers.p1.kills++
							}
							someoneKilled = true
						}
					}
				})

				if (someoneKilled) {
					setPlayers(newPlayers)
					setGameOver(true)
					// Add delay before showing alert
					setTimeout(() => {
						setShowAlert(true)
					}, 1000)
					return
				}

				// Trigger chain explosions with a small delay
				triggeredBombs.forEach(({ player, bomb }, index) => {
					setTimeout(() => {
						explodeBomb(player, bomb)
					}, 50 * (index + 1))
				})

				// Spawn powerups after explosion clears
				const clearTime = Date.now() + 256
				setExplosions((prev) => [
					...prev,
					{ coords: explosionCoords, clearTime },
				])

				// Queue powerup spawns
				if (powerupSpawns.length > 0) {
					setPendingPowerups((prev) => [
						...prev,
						...powerupSpawns.map((spawn) => ({
							...spawn,
							spawnTime: clearTime,
						})),
					])
				}
			}

			setTimeout(() => {
				explodeBomb(player, newBomb)
			}, 2000)
		},
		[setPlayers, setGrid, gameOver]
	)

	// Game loop for continuous movement
	useEffect(() => {
		if (gameOver) return

		const gameLoop = setInterval(() => {
			// Handle Player 1 movement
			PLAYER_1_CONTROLS.forEach((control) => {
				if (keys[control.key]) {
					movePlayer("p1", control.dx, control.dy)
				}
			})

			// Handle Player 2 movement
			PLAYER_2_CONTROLS.forEach((control) => {
				if (keys[control.key]) {
					movePlayer("p2", control.dx, control.dy)
				}
			})

			// Handle bomb placement
			if (keys["e"]) placeBomb("p1")
			if (keys["rightshift"]) placeBomb("p2")

			// Handle explosions and powerups
			const currentTime = Date.now()

			// Clear expired explosions
			setExplosions((prev) => {
				const expired = prev.filter((e) => currentTime >= e.clearTime)
				if (expired.length > 0) {
					setGrid((grid) => {
						const newGrid = [...grid]
						expired.forEach((explosion) => {
							explosion.coords.forEach(([x, y]) => {
								if (newGrid[y][x] === CELL_EXPLOSION) {
									newGrid[y][x] = CELL_EMPTY
								}
							})
						})
						return newGrid
					})
				}
				return prev.filter((e) => currentTime < e.clearTime)
			})

			// Handle pending powerup spawns
			setPendingPowerups((prev) => {
				const readyToSpawn = prev.filter((p) => currentTime >= p.spawnTime)
				if (readyToSpawn.length > 0) {
					setGrid((grid) => {
						const newGrid = [...grid]
						readyToSpawn.forEach(({ x, y }) => {
							if (newGrid[y][x] === CELL_EMPTY) {
								newGrid[y][x] = getRandomPowerup()
							}
						})
						return newGrid
					})
				}
				return prev.filter((p) => currentTime < p.spawnTime)
			})

			setTick((t) => t + 1)
		}, 16)

		return () => clearInterval(gameLoop)
	}, [keys, gameOver, placeBomb, movePlayer, setGrid])

	const resetGame = useCallback(() => {
		const newGrid = Array(GRID_SIZE)
			.fill(null)
			.map(() => Array(GRID_SIZE).fill(CELL_EMPTY))

		for (let i = 0; i < GRID_SIZE; i++) {
			for (let j = 0; j < GRID_SIZE; j++) {
				if (i % 2 === 0 && j % 2 === 0) {
					newGrid[i][j] = CELL_WALL
				} else if (
					// Don't place grass in player starting positions and adjacent cells
					!(
						(i === 1 && j === 1) ||
						(i === 1 && j === 2) ||
						(i === 2 && j === 1) ||
						(i === GRID_SIZE - 2 && j === GRID_SIZE - 2) ||
						(i === GRID_SIZE - 2 && j === GRID_SIZE - 3) ||
						(i === GRID_SIZE - 3 && j === GRID_SIZE - 2)
					) &&
					Math.random() <= GRASS_SPAWN_CHANCE
				) {
					newGrid[i][j] = CELL_GRASS
				}
			}
		}

		newGrid[1][1] = CELL_EMPTY
		newGrid[GRID_SIZE - 2][GRID_SIZE - 2] = CELL_EMPTY

		setGrid(newGrid)
		setPlayers((players) => ({
			p1: {
				x: 1,
				y: 1,
				bombs: [],
				maxBombs: INITIAL_BOMBS_MAX,
				bombRange: INITIAL_BOMB_RANGE,
				speed: INITIAL_SPEED,
				alive: true,
				lastMove: 0,
				kills: players.p1.kills,
				pet: null,
				baseSpeed: INITIAL_SPEED,
			},
			p2: {
				x: GRID_SIZE - 2,
				y: GRID_SIZE - 2,
				bombs: [],
				maxBombs: INITIAL_BOMBS_MAX,
				bombRange: INITIAL_BOMB_RANGE,
				speed: INITIAL_SPEED,
				alive: true,
				lastMove: 0,
				kills: players.p2.kills,
				pet: null,
				baseSpeed: INITIAL_SPEED,
			},
		}))
		setGameOver(false)
		setShowAlert(false)
	}, [setGrid, setPlayers])

	useEffect(() => {
		// resetGame()
	}, [resetGame])

	// Spawn powerups
	useEffect(() => {
		const spawnPowerup = setInterval(() => {
			if (Math.random() <= POWERUP_SPAWN_CHANCE) {
				const x = Math.floor(Math.random() * GRID_SIZE)
				const y = Math.floor(Math.random() * GRID_SIZE)
				setGrid((prev) => {
					const newGrid = [...prev]
					console.log(newGrid[y][x])
					if (newGrid[y][x] === CELL_EMPTY) {
						newGrid[y][x] = getRandomPowerup()
					}
					return newGrid
				})
			}
			// TODO: make this spawn during a frame instead...
		}, POWERUP_SPAWN_INTERVAL)
		return () => clearInterval(spawnPowerup)
	}, [setGrid])

	return (
		<div className="space-y-4">
			<div className="flex justify-between mb-4">
				<div className="space-y-2">
					<Badge variant={players.p1.alive ? "default" : "destructive"}>
						Player 1: WASD + E (bomb)
					</Badge>
					<div className="text-sm">
						<PlayerStats {...players.p1} />
					</div>
				</div>
				<div className="space-y-2">
					<Badge variant={players.p2.alive ? "default" : "destructive"}>
						Player 2: Arrows + Right Shift (bomb)
					</Badge>
					<div className="text-sm text-right">
						<PlayerStats {...players.p2} />
					</div>
				</div>
			</div>

			<div className="flex justify-center">
				<GameGrid grid={grid} players={players} />
			</div>

			{gameOver && (
				<GameOverAlert
					showAlert={showAlert}
					p1Alive={players.p1.alive}
					p2Alive={players.p2.alive}
					onReset={resetGame}
				/>
			)}
		</div>
	)
}

const isPowerUp = (cell: string | PowerUp): cell is PowerUp => {
	return POWERUPS.includes(cell)
}

type PlayerStatsProps = {
	speed: number
	bombRange: number
	kills: number
	pet: typeof CELL_POWERUP_OWL | typeof CELL_POWERUP_TURTLE | null
}

function PlayerStats({ speed, bombRange, kills, pet }: PlayerStatsProps) {
	return (
		<>
			Speed:{" "}
			<span
				className={
					pet === CELL_POWERUP_OWL
						? "text-amber-700 font-semibold"
						: pet === CELL_POWERUP_TURTLE
						? "text-green-700 font-semibold"
						: ""
				}
			>
				{speed.toFixed(1)}x
			</span>{" "}
			| Bomb Range: {bombRange}x1 | Kills: {kills}
		</>
	)
}

type GameGridProps = {
	grid: (string | PowerUp)[][]
	players: {
		p1: Player
		p2: Player
	}
}

function GameGrid({ grid, players }: GameGridProps) {
	return (
		<div className="grid grid-cols-1 gap-0 bg-secondary p-4 rounded-lg overflow-auto max-h-[80vh]">
			{grid.map((row, y) => (
				<div key={y} className="flex">
					{row.map((cell, x) => (
						<GameCell
							key={`${x}-${y}`}
							cell={cell}
							x={x}
							y={y}
							players={players}
						/>
					))}
				</div>
			))}
		</div>
	)
}

const getRandomPowerup = () => {
	const rand = Math.random()
	if (rand < POWERUP_SPAWN_PET_CHANCE) {
		// Equal chance for owl or turtle
		return Math.random() < 0.5 ? CELL_POWERUP_OWL : CELL_POWERUP_TURTLE
	}
	// Distribute remaining 90% among other powerups
	const otherPowerups = [
		CELL_POWERUP_SPEED,
		CELL_POWERUP_RANGE,
		CELL_POWERUP_BOMB,
	]
	return otherPowerups[Math.floor(Math.random() * otherPowerups.length)]
}

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
	return (
		<div
			key={`${x}-${y}`}
			className="w-8 h-8 flex items-center justify-center relative"
		>
			<div className="absolute inset-0 flex items-center justify-center text-3xl">
				{cell === CELL_WALL ? CELL_WALL : CELL_EMPTY}
			</div>
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
						: "text-2xl"
				)}
			>
				{players.p1.x === x && players.p1.y === y ? (
					<div className="relative flex flex-col items-center">
						<span
							className={cn(
								"relative z-0",
								players.p1.pet ? "text-xl mb-[-1.3rem]" : ""
							)}
						>
							{players.p1.alive ? PLAYER_1 : PLAYER_DEAD}
						</span>
						{players.p1.pet && (
							<span className="text-2xl z-10 relative">{players.p1.pet}</span>
						)}
					</div>
				) : players.p2.x === x && players.p2.y === y ? (
					<div className="relative flex flex-col items-center">
						<span
							className={cn(
								"relative z-0",
								players.p2.pet ? "text-xl mb-[-1rem]" : ""
							)}
						>
							{players.p2.alive ? PLAYER_2 : PLAYER_DEAD}
						</span>
						{players.p2.pet && (
							<span className="text-2xl z-10 relative">{players.p2.pet}</span>
						)}
					</div>
				) : cell !== CELL_BOMB && cell !== CELL_WALL && cell !== CELL_EMPTY ? (
					cell
				) : null}
			</div>
		</div>
	)
}
