import {
	INITIAL_BOMBS_MAX,
	INITIAL_BOMB_RANGE,
	INITIAL_SPEED,
	CELL_POWERUP_OWL,
	CELL_POWERUP_TURTLE,
} from "./constants"

export const DEBUG = true

export const DEBUG_STARTING_PETS = {
	P1: CELL_POWERUP_OWL as
		| typeof CELL_POWERUP_OWL
		| typeof CELL_POWERUP_TURTLE
		| null,
	P2: CELL_POWERUP_TURTLE as
		| typeof CELL_POWERUP_OWL
		| typeof CELL_POWERUP_TURTLE
		| null,
}

export const DEBUG_STARTING_POWERUPS = {
	P1: {
		speed: INITIAL_SPEED + 1,
		bombRange: INITIAL_BOMB_RANGE + 2,
		maxBombs: INITIAL_BOMBS_MAX + 1,
		pet: DEBUG_STARTING_PETS.P1,
	},
	P2: {
		speed: INITIAL_SPEED + 1,
		bombRange: INITIAL_BOMB_RANGE + 1,
		maxBombs: INITIAL_BOMBS_MAX + 2,
		pet: DEBUG_STARTING_PETS.P2,
	},
}
