"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const GRID_SIZE = 15
const INITIAL_BOMBS_MAX = 1
const INITIAL_BOMB_RANGE = 1
const INITIAL_SPEED = 1

const CELL_EMPTY = "⬜"
const CELL_WALL = "🟫"
const CELL_EXPLOSION = "🌸"
const CELL_BOMB = "💣"

const CELL_POWERUP_SPEED = "⚡️"
const CELL_POWERUP_RANGE = "💪"
const CELL_POWERUP_BOMB = "➕"
const POWERUPS = [CELL_POWERUP_SPEED, CELL_POWERUP_RANGE, CELL_POWERUP_BOMB]

const POWERUP_SPAWN_CHANCE = 0.8
const POWERUP_SPAWN_INTERVAL = 6000

const PLAYER_1 = "😀"
const PLAYER_2 = "😎"
const PLAYER_DEAD = "💀"

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
}

type Bomb = {
	x: number
	y: number
	timer: number
	range: number
	startTime: number
}

type PowerUp = "⚡️" | "💪" | "➕"

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
			if (targetCell === CELL_WALL || targetCell === CELL_BOMB) return

			if (isPowerUp(targetCell)) {
				setPlayers((prev) => {
					const upgrade =
						targetCell === CELL_POWERUP_SPEED
							? { speed: prev[player].speed + 0.5 }
							: targetCell === CELL_POWERUP_RANGE
							? { bombRange: prev[player].bombRange + 1 }
							: { maxBombs: prev[player].maxBombs + 1 }

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
				const { x, y, range } = bomb
				const explosionCoords: Array<[number, number]> = []

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

				// Find all bombs that will be triggered by this explosion
				const triggeredBombs: { player: "p1" | "p2"; bomb: Bomb }[] = []

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

							// Check if there's a bomb at this coordinate
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
						newPlayers.p1.alive = false
						someoneKilled = true
					}
					if (
						playersRef.current.p2.x === ex &&
						playersRef.current.p2.y === ey &&
						playersRef.current.p2.alive
					) {
						newPlayers.p2.alive = false
						someoneKilled = true
					}
				})

				if (someoneKilled) {
					setPlayers(newPlayers)
					setGameOver(true)
				} else {
					// Trigger chain explosions with a small delay
					triggeredBombs.forEach(({ player, bomb }, index) => {
						setTimeout(() => {
							explodeBomb(player, bomb)
						}, 100 * (index + 1))
					})
				}

				setTimeout(() => {
					setGrid((prev) => {
						const clearedGrid = prev.map((row) =>
							row.map((cell) => (cell === CELL_EXPLOSION ? CELL_EMPTY : cell))
						)
						return clearedGrid
					})
				}, 300)
			}

			setTimeout(() => {
				explodeBomb(player, newBomb)
			}, 2000)
		},
		[setGrid, setPlayers, setGameOver]
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
			if (keys["q"]) placeBomb("p1")
			if (keys["rightshift"]) placeBomb("p2")
		}, 16) // 60fps target

		return () => clearInterval(gameLoop)
	}, [keys, gameOver, placeBomb, movePlayer])

	const resetGame = useCallback(() => {
		const newGrid = Array(GRID_SIZE)
			.fill(null)
			.map(() => Array(GRID_SIZE).fill(CELL_EMPTY))

		for (let i = 0; i < GRID_SIZE; i++) {
			for (let j = 0; j < GRID_SIZE; j++) {
				if (i % 2 === 0 && j % 2 === 0) {
					newGrid[i][j] = CELL_WALL
				}
			}
		}

		newGrid[1][1] = CELL_EMPTY
		newGrid[GRID_SIZE - 2][GRID_SIZE - 2] = CELL_EMPTY

		setGrid(newGrid)
		setPlayers({
			p1: {
				x: 1,
				y: 1,
				bombs: [],
				maxBombs: INITIAL_BOMBS_MAX,
				bombRange: INITIAL_BOMB_RANGE,
				speed: INITIAL_SPEED,
				alive: true,
				lastMove: 0,
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
			},
		})
		setGameOver(false)
	}, [setGrid, setPlayers])

	useEffect(() => {
		resetGame()
	}, [resetGame])

	// Spawn powerups
	// TODO: make this spawn during a frame
	useEffect(() => {
		const spawnPowerup = setInterval(() => {
			console.log("spawn powerup attempt")
			if (Math.random() <= POWERUP_SPAWN_CHANCE) {
				const x = Math.floor(Math.random() * GRID_SIZE)
				const y = Math.floor(Math.random() * GRID_SIZE)
				setGrid((prev) => {
					const newGrid = [...prev]
					console.log(newGrid[y][x])
					if (newGrid[y][x] === CELL_EMPTY) {
						newGrid[y][x] =
							POWERUPS[Math.floor(Math.random() * POWERUPS.length)]
					}
					return newGrid
				})
			}
		}, POWERUP_SPAWN_INTERVAL)
		return () => clearInterval(spawnPowerup)
	}, [setGrid])

	return (
		<div className="space-y-4">
			<div className="flex justify-between mb-4">
				<div className="space-y-2">
					<Badge variant={players.p1.alive ? "default" : "destructive"}>
						Player 1: WASD + Q (bomb)
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
				<GameGrid
					grid={grid}
					players={players}
					CELL_WALL={CELL_WALL}
					CELL_EMPTY={CELL_EMPTY}
					CELL_BOMB={CELL_BOMB}
					CELL_EXPLOSION={CELL_EXPLOSION}
					PLAYER_1={PLAYER_1}
					PLAYER_2={PLAYER_2}
					PLAYER_DEAD={PLAYER_DEAD}
				/>
			</div>

			{gameOver && (
				<div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
					<div className="max-w-md w-full mx-4">
						<Alert className="border-2">
							<AlertDescription className="flex flex-col items-center gap-4 py-4">
								<span className="text-2xl font-semibold">
									<WinnerText
										p1Alive={players.p1.alive}
										p2Alive={players.p2.alive}
									/>
								</span>
								<Button size="lg" onClick={resetGame}>
									Play Again
								</Button>
							</AlertDescription>
						</Alert>
					</div>
				</div>
			)}
		</div>
	)
}

const isPowerUp = (cell: string | PowerUp): cell is PowerUp => {
	return POWERUPS.includes(cell)
}

type WinnerTextProps = {
	p1Alive: boolean
	p2Alive: boolean
}

function WinnerText({ p1Alive, p2Alive }: WinnerTextProps) {
	if (!p1Alive && !p2Alive) return "It's a draw!"
	if (!p1Alive) return "Player 2 wins! 🎉"
	if (!p2Alive) return "Player 1 wins! 🎉"
	return ""
}

type PlayerStatsProps = {
	speed: number
	bombRange: number
}

function PlayerStats({ speed, bombRange }: PlayerStatsProps) {
	return `Speed: ${speed.toFixed(1)}x | Bomb Range: ${bombRange}x1`
}

type GameGridProps = {
	grid: (string | PowerUp)[][]
	players: {
		p1: Player
		p2: Player
	}
	CELL_WALL: string
	CELL_EMPTY: string
	CELL_BOMB: string
	CELL_EXPLOSION: string
	PLAYER_1: string
	PLAYER_2: string
	PLAYER_DEAD: string
}

function GameGrid({
	grid,
	players,
	CELL_WALL,
	CELL_EMPTY,
	CELL_BOMB,
	CELL_EXPLOSION,
	PLAYER_1,
	PLAYER_2,
	PLAYER_DEAD,
}: GameGridProps) {
	return (
		<div className="grid grid-cols-1 gap-0 bg-secondary p-4 rounded-lg overflow-auto max-h-[80vh]">
			{grid.map((row, y) => (
				<div key={y} className="flex">
					{row.map((cell, x) => (
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
											const bomb = [
												...players.p1.bombs,
												...players.p2.bombs,
											].find((b) => b.x === x && b.y === y)
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
								className={`z-10 ${
									cell === CELL_EXPLOSION ? "text-3xl" : "text-2xl"
								} absolute`}
							>
								{players.p1.x === x && players.p1.y === y
									? players.p1.alive
										? PLAYER_1
										: PLAYER_DEAD
									: players.p2.x === x && players.p2.y === y
									? players.p2.alive
										? PLAYER_2
										: PLAYER_DEAD
									: cell !== CELL_BOMB &&
									  cell !== CELL_WALL &&
									  cell !== CELL_EMPTY
									? cell
									: null}
							</div>
						</div>
					))}
				</div>
			))}
		</div>
	)
}
