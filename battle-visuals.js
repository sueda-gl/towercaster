// Battle Visual System - Attack Visuals, Collisions, Camera Effects
// Depends on: scene-setup.js, visual-effects.js

// Camera shake globals
let cameraShakeActive = false;
let cameraShakeIntensity = 0;
let cameraShakeDuration = 0;
let originalCameraPos = new THREE.Vector3();
let cameraOriginalZ = 45;

// Create 3D visual for attack concept using semantic matching
async function createAttackVisual(concept, team) {
    const teamColor = team === 'blue' ? 0x4444ff : 0xff4444;
    
    // Try semantic matching first
    const match = await semanticMatcher.findBestMatch(concept);
    
    if (match && match.score >= 0.5) {
        console.log(`Using model: ${match.material.file} (score: ${match.score.toFixed(3)})`);
        
        // Create a container for the model
        const container = new THREE.Group();
        
        // Load the GLB model
        try {
            const gltf = await new Promise((resolve, reject) => {
                gltfLoader.load(
                    match.material.file,
                    (gltf) => resolve(gltf),
                    undefined,
                    (error) => reject(error)
                );
            });
            
            const model = gltf.scene;
            
            // Calculate model size and normalize it
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Target size for all models (adjust this to make all characters bigger/smaller)
            const targetSize = 15; // All models will be normalized to this size
            const scale = targetSize / maxDim;
            
            // Apply normalized scale
            model.scale.set(scale, scale, scale);
            
            // Center the model horizontally, but keep it on the ground
            const center = box.getCenter(new THREE.Vector3());
            model.position.x -= center.x * scale;
            model.position.z -= center.z * scale;
            // Keep the bottom of the model at y=0
            const minY = box.min.y;
            model.position.y -= minY * scale;
            
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            container.add(model);
            
            // Add team-colored glow effect (scaled to match model size)
            const glowGeometry = new THREE.SphereGeometry(targetSize * 0.6, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: teamColor,
                transparent: true,
                opacity: 0.1
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            container.add(glow);
            
            // Store material reference for animations (if needed)
            container.userData.glowMaterial = glowMaterial;
            
            return container;
            
        } catch (error) {
            console.error(`Failed to load model ${match.material.file}:`, error);
            // Fall through to procedural generation
        }
    }
    
    // Fallback to procedural generation
    console.log('Using procedural generation for:', concept);
    return createProceduralVisual(concept, team);
}

// Fallback procedural generation (original system)
function createProceduralVisual(concept, team) {
    const lowerConcept = concept.toLowerCase();
    let geometry, material;
    const teamColor = team === 'blue' ? 0x4444ff : 0xff4444;

    // Map concepts to visual representations (sized to match models)
    if (lowerConcept.includes('fire') || lowerConcept.includes('flame') || lowerConcept.includes('heat')) {
        geometry = new THREE.ConeGeometry(3, 6, 8);
        material = new THREE.MeshPhongMaterial({
            color: 0xff4422,
            emissive: 0xff2200,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9
        });
    } else if (lowerConcept.includes('water') || lowerConcept.includes('ice') || lowerConcept.includes('frost')) {
        geometry = new THREE.SphereGeometry(3, 16, 16);
        material = new THREE.MeshPhongMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.7,
            emissive: 0x2244aa,
            emissiveIntensity: 0.4
        });
    } else if (lowerConcept.includes('lightning') || lowerConcept.includes('electric') || lowerConcept.includes('thunder')) {
        geometry = new THREE.OctahedronGeometry(0.6);
        material = new THREE.MeshPhongMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.9
        });
    } else if (lowerConcept.includes('rock') || lowerConcept.includes('stone') || lowerConcept.includes('earth')) {
        geometry = new THREE.DodecahedronGeometry(0.6);
        material = new THREE.MeshPhongMaterial({
            color: 0x888888,
            roughness: 0.9,
            flatShading: true
        });
    } else if (lowerConcept.includes('wind') || lowerConcept.includes('air') || lowerConcept.includes('tornado')) {
        geometry = new THREE.TorusGeometry(0.4, 0.15, 8, 16);
        material = new THREE.MeshPhongMaterial({
            color: 0xccffff,
            transparent: true,
            opacity: 0.5,
            emissive: 0x88ccff,
            emissiveIntensity: 0.3
        });
    } else if (lowerConcept.includes('metal') || lowerConcept.includes('steel') || lowerConcept.includes('iron')) {
        geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        material = new THREE.MeshPhongMaterial({
            color: 0xaaaaaa,
            metalness: 0.9,
            roughness: 0.2
        });
    } else if (lowerConcept.includes('dark') || lowerConcept.includes('shadow') || lowerConcept.includes('void')) {
        geometry = new THREE.SphereGeometry(0.6, 16, 16);
        material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            emissive: 0x220022,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
    } else if (lowerConcept.includes('light') || lowerConcept.includes('sun') || lowerConcept.includes('bright')) {
        geometry = new THREE.SphereGeometry(0.6, 16, 16);
        material = new THREE.MeshPhongMaterial({
            color: 0xffffee,
            emissive: 0xffffaa,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.9
        });
    } else {
        // Default: colored sphere based on team
        geometry = new THREE.SphereGeometry(3, 16, 16);
        material = new THREE.MeshPhongMaterial({
            color: teamColor,
            emissive: teamColor,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
    }

    const visual = new THREE.Mesh(geometry, material);
    visual.castShadow = true;
    
    return visual;
}

// Create projectile trail effect
function createProjectileTrail(team) {
    const color = team === 'blue' ? 0x4444ff : 0xff4444;
    const geometry = new THREE.SphereGeometry(0.15, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.6
    });
    return { geometry, material, particles: [] };
}

// Add trail particle behind projectile
function addTrailParticle(projectile) {
    const particle = new THREE.Mesh(
        projectile.trail.geometry,
        projectile.trail.material.clone()
    );
    particle.position.copy(projectile.mesh.position);
    particle.userData = { life: 1.0, opacity: 0.6 };
    scene.add(particle);
    projectile.particles.push(particle);
    
    // Limit trail length
    if (projectile.particles.length > 20) {
        const old = projectile.particles.shift();
        scene.remove(old);
        if (old.material) old.material.dispose();
    }
}

// Animate character walking on ground to center
function animateAttack(visual, fromTeam, toTeam) {
    return new Promise((resolve) => {
        // Find starting tower position
        const fromTower = towers.find(t => t.userData.team === fromTeam);

        if (!fromTower) {
            console.error('Tower not found for team:', fromTeam);
            resolve();
            return;
        }

        // Set starting position on GROUND near tower
        visual.position.copy(fromTower.position);
        visual.position.y = 0; // Ground level
        scene.add(visual);

        // Walk to CENTER of arena on the ground
        const startPos = visual.position.clone();
        const endPos = new THREE.Vector3(0, 0, 0); // Center on ground
        
        // Set character to face camera for side view
        // Camera is at +Z looking toward -Z, so characters face toward camera (rotation.y = 0)
        // This gives a consistent side profile regardless of model's default orientation
        visual.rotation.y = 0;
        
        // Store base rotation for animation variations
        visual.userData.baseRotation = 0;
        visual.userData.team = fromTeam;
        
        const projectile = {
            mesh: visual,
            startPos: startPos,
            endPos: endPos,
            progress: 0,
            speed: 0.003, // Very slow walking speed for dramatic effect
            team: fromTeam,
            walkCycle: 0, // For bobbing animation
            onComplete: () => {
                resolve();
            }
        };

        gameState.activeProjectiles.push(projectile);
        console.log(`Character spawned from ${fromTeam} team, walking to center. Active characters: ${gameState.activeProjectiles.length}`);
    });
}

// Camera shake effect for impact
function cameraShake(intensity, duration) {
    cameraShakeActive = true;
    cameraShakeIntensity = intensity;
    cameraShakeDuration = duration;
    originalCameraPos.copy(camera.position);
}

// Camera zoom to center for dramatic clash
function cameraZoomToCenter(targetPos, duration) {
    return new Promise((resolve) => {
        const startPos = camera.position.clone();
        const targetCameraPos = new THREE.Vector3(targetPos.x, 25, 25); // Closer and lower
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            camera.position.lerpVectors(startPos, targetCameraPos, eased);
            camera.lookAt(targetPos);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        animate();
    });
}

// Camera preparation for collision (subtle adjustment after standoff)
function cameraPrepareForCollision(duration = 500) {
    return new Promise((resolve) => {
        const startPos = camera.position.clone();
        const centerPos = new THREE.Vector3(0, 0, 0);
        
        // Slightly adjust camera angle for better view of collision
        const targetPos = new THREE.Vector3(-15, 18, 45);
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 2); // Ease out
            
            camera.position.lerpVectors(startPos, targetPos, eased);
            camera.lookAt(centerPos);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        
        animate();
    });
}

// Camera zoom back out
function cameraZoomOut(duration) {
    return new Promise((resolve) => {
        const startPos = camera.position.clone();
        const startLookAt = new THREE.Vector3(0, 0, 0);
        const targetPos = new THREE.Vector3(-19.58, 13.37, 56.24);
        const targetLookAt = new THREE.Vector3(-3.54, 2.42, 10.17);
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Smoother easing - ease in-out cubic for very smooth motion
            const eased = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            camera.position.lerpVectors(startPos, targetPos, eased);
            
            // Smoothly interpolate the look-at point as well
            const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, eased);
            camera.lookAt(currentLookAt);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        animate();
    });
}

// Charge up effect before clash
function createChargeUpEffect(char1, char2, duration) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        // Create energy particles spiraling around characters
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const geo = new THREE.SphereGeometry(0.1, 8, 8);
            const mat = new THREE.MeshBasicMaterial({ 
                color: i < 10 ? 0x4444ff : 0xff4444,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geo, mat);
            const char = i < 10 ? char1 : char2;
            if (char) {
                particle.position.copy(char.position);
                particle.userData.angle = (i % 10) * (Math.PI * 2 / 10);
                particle.userData.radius = 2;
                particle.userData.char = char;
                scene.add(particle);
                particles.push(particle);
            }
        }
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            particles.forEach((p, i) => {
                if (p.userData.char) {
                    p.userData.angle += 0.1;
                    p.userData.radius = 2 - progress * 1.5; // Spiral inward
                    const x = Math.cos(p.userData.angle) * p.userData.radius;
                    const z = Math.sin(p.userData.angle) * p.userData.radius;
                    p.position.set(
                        p.userData.char.position.x + x,
                        p.userData.char.position.y + Math.sin(progress * Math.PI * 4) * 0.5 + 1,
                        p.userData.char.position.z + z
                    );
                    p.material.opacity = 0.8 * (1 - progress);
                }
            });
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Clean up particles
                particles.forEach(p => {
                    scene.remove(p);
                    p.geometry.dispose();
                    p.material.dispose();
                });
                resolve();
            }
        }
        animate();
    });
}

// Animate the actual clash with attack motions
function animateClash(char1, char2, winner, duration) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const char1Start = char1 ? char1.position.clone() : new THREE.Vector3();
        const char2Start = char2 ? char2.position.clone() : new THREE.Vector3();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (char1 && char2) {
                // Both lunge forward
                const lungeAmount = Math.sin(progress * Math.PI * 2) * 0.5;
                char1.position.z = char1Start.z - lungeAmount;
                char2.position.z = char2Start.z + lungeAmount;
                
                // Rotate as if attacking - add variation to base rotation for side view
                const baseRot1 = char1.userData.baseRotation || 0;
                const baseRot2 = char2.userData.baseRotation || 0;
                char1.rotation.y = baseRot1 + Math.sin(progress * Math.PI * 4) * 0.2;
                char2.rotation.y = baseRot2 + Math.sin(progress * Math.PI * 4) * 0.2;
                
                // Jump slightly
                const jump = Math.abs(Math.sin(progress * Math.PI * 3)) * 0.8;
                char1.position.y = char1Start.y + jump;
                char2.position.y = char2Start.y + jump;
                
                // Scale pulse
                const scale = 1 + Math.sin(progress * Math.PI * 6) * 0.1;
                char1.scale.set(scale, scale, scale);
                char2.scale.set(scale, scale, scale);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        animate();
    });
}

// Show winner pushing back loser
function showWinnerAnimation(char1, char2, winner, duration) {
    return new Promise((resolve) => {
        if (winner === 'neutral') {
            resolve({winnerChar: null, loserChar: null});
            return;
        }
        
        // Determine which character won based on their team tags
        let winnerChar, loserChar;
        if (char1 && char1.userData && char1.userData.team === winner) {
            winnerChar = char1;
            loserChar = char2;
            console.log(`Winner is char1 (${winner} team), loser is char2 (${char2.userData?.team} team)`);
        } else if (char2 && char2.userData && char2.userData.team === winner) {
            winnerChar = char2;
            loserChar = char1;
            console.log(`Winner is char2 (${winner} team), loser is char1 (${char1.userData?.team} team)`);
        } else {
            // Fallback to old logic if tags not found
            console.warn('Team tags not found on characters, using fallback logic');
            console.log(`char1 team: ${char1?.userData?.team}, char2 team: ${char2?.userData?.team}, winner: ${winner}`);
            winnerChar = winner === 'blue' ? char1 : char2;
            loserChar = winner === 'blue' ? char2 : char1;
        }
        
        if (!winnerChar || !loserChar) {
            resolve({winnerChar, loserChar});
            return;
        }
        
        const startTime = Date.now();
        const winnerStart = winnerChar.position.clone();
        const loserStart = loserChar.position.clone();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            const eased = 1 - Math.pow(1 - progress, 2); // Ease out
            
            // Winner stands strong and grows
            winnerChar.scale.set(1 + eased * 0.3, 1 + eased * 0.3, 1 + eased * 0.3);
            
            // Loser gets pushed back (direction based on position)
            const pushDirection = loserStart.z > 0 ? 1 : -1; // Push away from center
            loserChar.position.z = loserStart.z + pushDirection * eased * 3;
            loserChar.scale.set(1 - eased * 0.5, 1 - eased * 0.5, 1 - eased * 0.5);
            loserChar.rotation.x = eased * Math.PI * 0.3; // Tilt back
            
            // Fade out loser
            if (loserChar.traverse) {
                loserChar.traverse((child) => {
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity = 1 - eased;
                        child.material.transparent = true;
                    }
                });
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve({winnerChar, loserChar});
            }
        }
        animate();
    });
}

// Create DRAMATIC collision effect when characters clash
async function createCenterCollision(visual1, visual2, winner) {
    const centerPos = new THREE.Vector3(0, 0, 0); // Ground level
    
    console.log('Creating DRAMATIC center collision effect, winner:', winner);
    
    // FREEZE FRAME - pause everything for dramatic effect
    gameState.isProcessing = true;
    
    // SLOW MOTION EFFECT - zoom in camera
    await cameraZoomToCenter(centerPos, 1000); // 1 second zoom
    
    // Keep characters facing camera for side view during collision
    if (visual1 && visual2) {
        // Maintain side profile view - characters should face camera (rotation.y = 0)
        // This ensures we see the collision from the side
        visual1.rotation.y = 0;
        visual2.rotation.y = 0;
    }
    
    // CHARGE UP EFFECT - energy building
    await createChargeUpEffect(visual1, visual2, 800);
    
    // CLASH ANIMATION - characters collide with attacks
    await animateClash(visual1, visual2, winner, 1200);
    
    // MASSIVE IMPACT EFFECT
    cameraShake(1.0, 40); // Strong shake
    createImpactFlash(centerPos);
    createShockwave(centerPos);
    createExplosionBurst(centerPos, winner);
    
    // Screen flash overlay
    createScreenFlash(winner);
    
    // Winner pushes back loser
    const {winnerChar, loserChar} = await showWinnerAnimation(visual1, visual2, winner, 800);
    
    // Zoom back out - slower and smoother
    await cameraZoomOut(2000);
    
    // Remove only the LOSER character - winner stays in arena!
    if (loserChar) {
        scene.remove(loserChar);
        if (loserChar.geometry) loserChar.geometry.dispose();
        if (loserChar.material) loserChar.material.dispose();
    }
    
    // Winner stays and celebrates
    if (winnerChar) {
        // Victory pose - scale up slightly
        const victoryScale = 1.2;
        winnerChar.scale.set(victoryScale, victoryScale, victoryScale);
        
        // Fade out winner after 1 second (shorter delay, faster fade)
        setTimeout(() => {
            let opacity = 1;
            const fadeOut = setInterval(() => {
                opacity -= 0.05; // Faster fade (was 0.02)
                if (winnerChar.traverse) {
                    winnerChar.traverse((child) => {
                        if (child.material) {
                            child.material.opacity = opacity;
                            child.material.transparent = true;
                        }
                    });
                }
                if (opacity <= 0) {
                    clearInterval(fadeOut);
                    scene.remove(winnerChar);
                    if (winnerChar.geometry) winnerChar.geometry.dispose();
                    if (winnerChar.material) winnerChar.material.dispose();
                }
            }, 50);
        }, 1000); // Reduced from 2000ms to 1000ms
    }
    
    // Clear active projectiles array
    gameState.activeProjectiles = [];
    console.log('Cleared projectiles array');
    
    if (winner === 'neutral') {
        // Both explode equally with dramatic effects - remove both characters
        createExplosion(centerPos);
        setTimeout(() => createExplosion(centerPos), 200);
        
        // For neutral, remove both characters
        if (visual1) {
            setTimeout(() => {
                scene.remove(visual1);
                if (visual1.geometry) visual1.geometry.dispose();
                if (visual1.material) visual1.material.dispose();
            }, 500);
        }
        if (visual2) {
            setTimeout(() => {
                scene.remove(visual2);
                if (visual2.geometry) visual2.geometry.dispose();
                if (visual2.material) visual2.material.dispose();
            }, 500);
        }
        setTimeout(() => createExplosion(centerPos), 400);
        
        // Multiple ring effects with delays
        createImpactRing(centerPos, 0x4444ff, 1.5, 0.12);
        setTimeout(() => createImpactRing(centerPos, 0xff4444, 1.5, 0.12), 200);
        setTimeout(() => createImpactRing(centerPos, 0xffff00, 2, 0.08), 400);
        
        // Shockwave
        createShockwave(centerPos, 0xffffff);
    } else {
        // Winner's color dominates with dramatic sequence
        const winColor = winner === 'blue' ? 0x4444ff : 0xff4444;
        const loseColor = winner === 'blue' ? 0xff4444 : 0x4444ff;
        
        // Multiple explosions in sequence
        createExplosion(centerPos);
        setTimeout(() => createExplosion(centerPos), 150);
        setTimeout(() => createExplosion(centerPos), 300);
        setTimeout(() => createExplosion(centerPos), 450);
        
        // Losing color appears first, then gets dominated
        createImpactRing(centerPos, loseColor, 1.2, 0.15);
        setTimeout(() => createImpactRing(centerPos, winColor, 1.8, 0.1), 200);
        setTimeout(() => createImpactRing(centerPos, winColor, 2.5, 0.08), 400);
        
        // Winner's shockwave
        createShockwave(centerPos, winColor);
        
        // Create expanding sphere of winner's color
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: winColor,
            transparent: true,
            opacity: 0.9,
            emissive: winColor,
            emissiveIntensity: 0.5
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(centerPos);
        scene.add(sphere);
        
        // Animate sphere expansion - slower and bigger
        let scale = 1;
        const animateSphere = () => {
            scale += 0.12;
            sphere.scale.set(scale, scale, scale);
            material.opacity -= 0.025;
            material.emissiveIntensity = 0.5 * (material.opacity / 0.9);
            
            if (material.opacity > 0) {
                requestAnimationFrame(animateSphere);
            } else {
                scene.remove(sphere);
                if (geometry) geometry.dispose();
                if (material) material.dispose();
            }
        };
        animateSphere();
        
        // Add spiraling particles
        for (let i = 0; i < 12; i++) {
            setTimeout(() => {
                createSpiralParticle(centerPos, winColor, i);
            }, i * 50);
        }
    }
}

// BACKFIRE collision - explosion happens at DEFENDER'S tower location
async function createBackfireCollision(attackVisual, defendVisual) {
    console.log('Creating BACKFIRE collision - defender\'s concept explodes on them!');
    
    gameState.isProcessing = true;
    
    // Find the defender's tower (blue team)
    const blueTower = towers.find(t => t.userData.team === 'blue');
    const defenderPos = blueTower ? blueTower.position.clone() : new THREE.Vector3(-10, 0, 0);
    defenderPos.y = 5; // Explosion height
    
    // Both characters move toward center initially
    const centerPos = new THREE.Vector3(0, 0, 0);
    
    // Zoom to center
    await cameraZoomToCenter(centerPos, 1000);
    
    // Characters meet at center
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // BACKFIRE! Explosion travels BACK to defender's tower
    console.log('BACKFIRE! Explosion moving to defender tower...');
    
    // Create orange/red backfire explosion effect
    const backfireColor = 0xff6600; // Orange-red
    
    // Create traveling explosion from center to defender
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const explosionPos = new THREE.Vector3().lerpVectors(centerPos, defenderPos, t);
        
        // Create explosion particle
        const explosionGeometry = new THREE.SphereGeometry(2 + i * 0.5, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({ 
            color: backfireColor,
            transparent: true,
            opacity: 0.8 - t * 0.5
        });
        const explosionSphere = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosionSphere.position.copy(explosionPos);
        scene.add(explosionSphere);
        
        // Remove after short delay
        setTimeout(() => {
            scene.remove(explosionSphere);
            explosionGeometry.dispose();
            explosionMaterial.dispose();
        }, 300);
        
        await new Promise(resolve => setTimeout(resolve, 80));
    }
    
    // Big explosion at defender's tower
    cameraShake(1.2, 50);
    createExplosion(defenderPos);
    createExplosionBurst(defenderPos, 'red'); // Red/orange burst
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Zoom out
    await cameraZoomOut(2000);
    
    // Remove both characters
    if (attackVisual) {
        scene.remove(attackVisual);
        if (attackVisual.geometry) attackVisual.geometry.dispose();
        if (attackVisual.material) attackVisual.material.dispose();
    }
    if (defendVisual) {
        scene.remove(defendVisual);
        if (defendVisual.geometry) defendVisual.geometry.dispose();
        if (defendVisual.material) defendVisual.material.dispose();
    }
    
    gameState.activeProjectiles = [];
    gameState.isProcessing = false;
    
    console.log('Backfire collision complete');
}

// PHASE THROUGH effect - no explosion, concepts don't interact
async function createPhaseThroughEffect(visual1, visual2) {
    console.log('Creating PHASE THROUGH effect - no damage, domain mismatch');
    
    gameState.isProcessing = true;
    
    const centerPos = new THREE.Vector3(0, 0, 0);
    
    // Zoom to center
    await cameraZoomToCenter(centerPos, 1000);
    
    // Characters move toward each other
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Make characters semi-transparent as they "phase through"
    if (visual1 && visual1.traverse) {
        visual1.traverse((child) => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = 0.5;
            }
        });
    }
    if (visual2 && visual2.traverse) {
        visual2.traverse((child) => {
            if (child.material) {
                child.material.transparent = true;
                child.material.opacity = 0.5;
            }
        });
    }
    
    // Create sparkle/shimmer effect instead of explosion
    for (let i = 0; i < 20; i++) {
        const sparkleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const sparkleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
        
        // Random position around center
        sparkle.position.set(
            (Math.random() - 0.5) * 4,
            Math.random() * 3,
            (Math.random() - 0.5) * 4
        );
        scene.add(sparkle);
        
        // Float up and fade
        const floatInterval = setInterval(() => {
            sparkle.position.y += 0.1;
            sparkle.material.opacity -= 0.05;
            if (sparkle.material.opacity <= 0) {
                clearInterval(floatInterval);
                scene.remove(sparkle);
                sparkleGeometry.dispose();
                sparkleMaterial.dispose();
            }
        }, 50);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Zoom out
    await cameraZoomOut(2000);
    
    // Fade out both characters peacefully
    const fadeOutChar = (char) => {
        if (!char) return;
        let opacity = 0.5;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            if (char.traverse) {
                char.traverse((child) => {
                    if (child.material) {
                        child.material.opacity = opacity;
                    }
                });
            }
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                scene.remove(char);
                if (char.geometry) char.geometry.dispose();
                if (char.material) char.material.dispose();
            }
        }, 50);
    };
    
    fadeOutChar(visual1);
    fadeOutChar(visual2);
    
    gameState.activeProjectiles = [];
    gameState.isProcessing = false;
    
    console.log('Phase through effect complete');
}

