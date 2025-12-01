// Event Handlers and Control Functions
// Depends on: scene-setup.js, character-animations.js

// Background Music Manager
let backgroundMusic = null;

function initBackgroundMusic() {
    if (!backgroundMusic) {
        backgroundMusic = new Audio('audio/battle-theme.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.8;
    }
    backgroundMusic.play().catch(err => {
        console.warn('Audio playback failed:', err);
    });
}

function toggleMusic() {
    if (backgroundMusic) {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(err => {
                console.warn('Audio playback failed:', err);
            });
            document.getElementById('music-icon').textContent = '🔊';
        } else {
            backgroundMusic.pause();
            document.getElementById('music-icon').textContent = '🔇';
        }
    } else {
        console.warn('Music not initialized yet. Click splash screen to start.');
    }
}

function toggleRotation() {
    isRotating = !isRotating;
    console.log('Camera rotation:', isRotating ? 'ENABLED' : 'DISABLED');
}

function resetCamera() {
    // Reset to centered elevated view
    camera.position.set(-19.58, 13.37, 56.24);
    camera.lookAt(-3.54, 2.42, 10.17);
}

// Log current camera position (press 'C' key)
document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
        console.log('=== CURRENT CAMERA POSITION ===');
        console.log(`Position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})`);
        
        // Calculate what the camera is looking at
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const lookAtPoint = camera.position.clone().add(direction.multiplyScalar(50));
        console.log(`Looking at approximately: (${lookAtPoint.x.toFixed(2)}, ${lookAtPoint.y.toFixed(2)}, ${lookAtPoint.z.toFixed(2)})`);
        console.log('Copy this for the default camera position!');
    }
});

// Show splash screen and start game with lightning intro
async function showSplashScreen() {
    const splash = document.getElementById('splash-screen');
    
    // Play lightning intro first
    await playLightningIntro();
    
    if (splash) {
        splash.style.display = 'flex';
        splash.style.opacity = '1';
        
        // Wait for user click to start game and audio
        splash.addEventListener('click', function startGame() {
            // Initialize and start background music
            initBackgroundMusic();
            
            // Hide splash screen with fade
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                gameState.gameStarted = true;
                initiateAIAttack();
            }, 500); // Wait for fade out
        }, { once: true }); // 'once' ensures single execution
    } else {
        // Fallback if splash screen not found
        setTimeout(() => {
            gameState.gameStarted = true;
            initiateAIAttack();
        }, 1000);
    }
}

// Mouse controls
let mouseX = 0, mouseY = 0;
let isMouseDown = false;

document.addEventListener('mousedown', () => isMouseDown = true);
document.addEventListener('mouseup', () => isMouseDown = false);

document.addEventListener('mousemove', (event) => {
    if (isMouseDown && isRotating) {
        const deltaX = event.movementX * 0.5;
        const deltaY = event.movementY * 0.5;
        
        // Rotate camera based on mouse movement
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);
    }
});

// Add keyboard support for inputs
document.addEventListener('DOMContentLoaded', () => {
    const blueInput = document.getElementById('blue-input');
    const redInput = document.getElementById('red-input');

    if (blueInput) {
        blueInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAttackInput(blueInput.value, 'blue');
            }
        });
    }

    if (redInput) {
        redInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleAttackInput(redInput.value, 'red');
            }
        });
    }
});

