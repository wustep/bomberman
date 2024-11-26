import {
	INITIAL_BOMBS_MAX,
	INITIAL_BOMB_RANGE,
	INITIAL_SPEED,
	PET_OWL,
	PET_TURTLE,
	Pet,
} from "./constants"

export const DEBUG = false

export const DEBUG_STARTING_PETS: {
	P1: Pet | null
	P2: Pet | null
} = {
	P1: PET_OWL,
	P2: PET_TURTLE,
}

export const DEBUG_STARTING_POWERUPS = {
	P1: {
		speed: INITIAL_SPEED + 1,
		bombRange: INITIAL_BOMB_RANGE + 1,
		maxBombs: INITIAL_BOMBS_MAX + 3,
	},
	P2: {
		speed: INITIAL_SPEED + 1,
		bombRange: INITIAL_BOMB_RANGE + 1,
		maxBombs: INITIAL_BOMBS_MAX + 3,
	},
}
