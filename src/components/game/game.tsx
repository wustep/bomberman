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

const POWERUP_SPAWN_CHANCE = 0.1
const POWERUP_SPAWN_INTERVAL = 5000

const PLAYER_1 = "😀"
const PLAYER_2 = "😎"
const PLAYER_DEAD = "💀"

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
}

type PowerUp = "⚡️" | "💪"

export default function Game() {
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

	const [players, _setPlayers] = useState<{
		p1: Player
		p2: Player
	}>({
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
	}, [])

	useEffect(() => {
		resetGame()
	}, [resetGame])

	const movePlayer = useCallback(
		(player: "p1" | "p2", direction: string) => {
			const currentTime = Date.now()
			if (!players[player].alive) return

			const moveDelay = 200 / players[player].speed
			if (currentTime - players[player].lastMove < moveDelay) return

			const { x, y } = players[player]
			let newX = x
			let newY = y

			switch (direction) {
				case "w":
					newY = Math.max(0, y - 1)
					break
				case "s":
					newY = Math.min(GRID_SIZE - 1, y + 1)
					break
				case "a":
					newX = Math.max(0, x - 1)
					break
				case "d":
					newX = Math.min(GRID_SIZE - 1, x + 1)
					break
			}

			// Collision handling
			const otherPlayer = player === "p1" ? "p2" : "p1"
			if (players[otherPlayer].x === newX && players[otherPlayer].y === newY)
				return

			const targetCell = gridRef.current[newY][newX]
			if (targetCell === CELL_WALL || targetCell === CELL_BOMB) return

			if (isPowerUp(targetCell)) {
				setPlayers((prev) => ({
					...prev,
					[player]: {
						...prev[player],
						...(targetCell === CELL_POWERUP_SPEED
							? { speed: prev[player].speed + 0.5 }
							: targetCell === CELL_POWERUP_RANGE
							? { bombRange: prev[player].bombRange + 1 }
							: {}),
					},
				}))
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
		[gridRef, players]
	)

	const checkPlayerDeath = useCallback(
		(explosionCoords: Array<[number, number]>) => {
			const newPlayers = { ...players }
			let someoneKilled = false

			explosionCoords.forEach(([x, y]) => {
				if (players.p1.x === x && players.p1.y === y && players.p1.alive) {
					newPlayers.p1.alive = false
					someoneKilled = true
				}
				if (players.p2.x === x && players.p2.y === y && players.p2.alive) {
					newPlayers.p2.alive = false
					someoneKilled = true
				}
			})

			if (someoneKilled) {
				setPlayers(newPlayers)
				if (!newPlayers.p1.alive || !newPlayers.p2.alive) {
					setGameOver(true)
				}
			}
		},
		[players]
	)

	const placeBomb = useCallback(
		(player: "p1" | "p2") => {
			const { x, y, bombs, maxBombs, bombRange, alive } = players[player]
			if (bombs.length >= maxBombs || !alive) return

			if (gridRef.current[y][x] === CELL_BOMB) return

			const newBomb = { x, y, timer: 3, range: bombRange }
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
				}

				setTimeout(() => {
					setGrid((prev) => {
						const clearedGrid = prev.map((row, y) =>
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
		[players]
	)

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (gameOver) return

			e.preventDefault()
			const key = e.key.toLowerCase()

			if (["w", "a", "s", "d"].includes(key)) {
				movePlayer("p1", key)
			} else if (e.key === "q") {
				placeBomb("p1")
			}

			if (["arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
				const dirMap: Record<string, string> = {
					arrowup: "w",
					arrowleft: "a",
					arrowdown: "s",
					arrowright: "d",
				}
				movePlayer("p2", dirMap[key])
			} else if (e.key === "Shift" && e.location === 2) {
				placeBomb("p2")
			}
		}

		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [gameOver, movePlayer, placeBomb])

	const trySpawnPowerUp = (x: number, y: number) => {
		setGrid((prev) => {
			const newGrid = [...prev]
			if (newGrid[y][x] === CELL_EMPTY) {
				newGrid[y][x] = POWERUPS[Math.floor(Math.random() * POWERUPS.length)]
			}
			return newGrid
		})
	}

	useEffect(() => {
		setTimeout(() => {
			if (Math.random() < POWERUP_SPAWN_CHANCE) {
				trySpawnPowerUp(
					Math.floor(Math.random() * GRID_SIZE),
					Math.floor(Math.random() * GRID_SIZE)
				)
			}
		}, POWERUP_SPAWN_INTERVAL)
	}, [])

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
				<div className="grid grid-cols-1 gap-0 bg-secondary p-4 rounded-lg overflow-auto max-h-[80vh]">
					{grid.map((row, y) => (
						<div key={y} className="flex">
							{row.map((cell, x) => (
								<div
									key={`${x}-${y}`}
									className="w-8 h-8 flex items-center justify-center relative"
								>
									{cell === CELL_BOMB && (
										<div className="absolute text-3xl z-0">💣</div>
									)}
									<div className="z-10 text-2xl">
										{players.p1.x === x && players.p1.y === y
											? players.p1.alive
												? PLAYER_1
												: PLAYER_DEAD
											: players.p2.x === x && players.p2.y === y
											? players.p2.alive
												? PLAYER_2
												: PLAYER_DEAD
											: cell !== CELL_BOMB
											? cell
											: null}
									</div>
								</div>
							))}
						</div>
					))}
				</div>
			</div>

			{gameOver && (
				<Alert>
					<AlertDescription className="flex items-center justify-between">
						<WinnerText p1Alive={players.p1.alive} p2Alive={players.p2.alive} />
						<Button onClick={resetGame}>Play Again</Button>
					</AlertDescription>
				</Alert>
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
