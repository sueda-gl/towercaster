// Game State Management
// Central state for the battle system

const gameState = {
    currentActiveAttack: null,  // {concept: string, team: 'blue'|'red', visual: THREE.Object3D}
    blueHealth: 100,
    redHealth: 100,
    battleHistory: [],
    isProcessing: false,
    activeProjectiles: [],
    gameStarted: false,
    aiAttacking: false,
    playerResponseTimer: null,
    responseTimeRemaining: 0,
    aiWalkingCharacter: null,
    battleCount: 0  // Track total battles for onboarding detection
};

