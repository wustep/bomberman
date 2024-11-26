import { Pet } from "./constants"

export type Orientation = "left" | "right"

export type Player = {
	x: number
	y: number
	bombs: Bomb[]
	maxBombs: number
	bombRange: number
	speed: number
	alive: boolean
	lastMove: number
	kills: number
	pet: Pet | null
	baseSpeed: number
	orientation: Orientation
	invulnerableUntil: number
}

export type Bomb = {
	x: number
	y: number
	timer: number
	range: number
	startTime: number
}
