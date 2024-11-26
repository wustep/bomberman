export const GRID_SIZE = 15
export const INITIAL_BOMBS_MAX = 1
export const INITIAL_BOMB_RANGE = 1
export const INITIAL_SPEED = 1

export const CELL_EMPTY = "⬜"
export const CELL_WALL = "🟫"
export const CELL_EXPLOSION = "🌸"
export const CELL_BOMB = "💣"
export const CELL_GRASS = "🟩"

export const CELL_POWERUP_SPEED = "⚡️"
export const CELL_POWERUP_RANGE = "💪"
export const CELL_POWERUP_BOMB = "➕"
export const CELL_POWERUP_OWL = "🦉"
export const CELL_POWERUP_TURTLE = "🐢"
export const POWERUPS = [
	CELL_POWERUP_SPEED,
	CELL_POWERUP_RANGE,
	CELL_POWERUP_BOMB,
	CELL_POWERUP_OWL,
	CELL_POWERUP_TURTLE,
]

export const POWERUP_SPAWN_CHANCE = 0.2
export const POWERUP_SPAWN_INTERVAL = 10000

export const POWERUP_SPAWN_PET_CHANCE = 0.2

export const POWERUP_SPAWN_GRASS_CHANCE = 0.35
export const GRASS_SPAWN_CHANCE = 0.35

export const PLAYER_1 = "😀"
export const PLAYER_2 = "😎"
export const PLAYER_DEAD = "💀"

export const BOMB_DELAY_DURATION = 2000
export const EXPLOSION_DURATION = 500 // Duration in milliseconds
