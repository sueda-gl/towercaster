// Character Animations and Main Animation Loop
// Depends on: scene-setup.js, arena-builder.js, battle-visuals.js, visual-effects.js

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    // Camera lock - only lock when rotation is disabled and not shaking/zooming
    // When isRotating is enabled, camera can be freely rotated by mouse
    if (!cameraShakeActive && !isRotating) {
        // Keep camera in fixed position (unless camera is zooming for battle)
        if (!camera.userData || !camera.userData.isZooming) {
            camera.position.set(-19.58, 13.37, 56.24);
            camera.lookAt(-3.54, 2.42, 10.17);
        }
    }
    
    // Animate clouds
    if (scene.userData.clouds) {
        scene.userData.clouds.forEach(cloud => {
            cloud.position.x += cloud.userData.speed;
            // Wrap clouds around
            if (cloud.position.x > 50) {
                cloud.position.x = -50;
            }
            // Gentle vertical movement
            cloud.position.y += Math.sin(time + cloud.position.x * 0.1) * 0.01;
        });
    }
    
    // Animate snow
    if (scene.userData.snow) {
        const snow = scene.userData.snow;
        const positions = snow.geometry.attributes.position.array;
        const velocities = snow.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
            // Update positions
            positions[i] += velocities[i];     // x
            positions[i + 1] += velocities[i + 1]; // y
            positions[i + 2] += velocities[i + 2]; // z
            
            // Reset snow that falls below ground
            if (positions[i + 1] < -10) {
                positions[i + 1] = 60;
                positions[i] = (Math.random() - 0.5) * 100;
                positions[i + 2] = (Math.random() - 0.5) * 100;
            }
            
            // Wrap snow horizontally for infinite effect
            if (positions[i] > 50) positions[i] = -50;
            if (positions[i] < -50) positions[i] = 50;
            if (positions[i + 2] > 50) positions[i + 2] = -50;
            if (positions[i + 2] < -50) positions[i + 2] = 50;
        }
        
        snow.geometry.attributes.position.needsUpdate = true;
    }
    
    // Animate water
    scene.traverse((child) => {
        if (child.userData && child.userData.material) {
            child.userData.material.emissiveIntensity = 0.1 + Math.sin(time * 2) * 0.05;
        }
    });
    
    // Animate towers with enhanced effects
    towers.forEach((tower, index) => {
        if (tower.userData.crystal) {
            // Rotate and float crystal
            tower.userData.crystal.rotation.y += 0.02;
            tower.userData.crystal.rotation.x = Math.sin(time * 2 + index) * 0.1;
            tower.userData.crystal.position.y = 14 + Math.sin(time * 2 + index) * 0.3;
            
            // Pulse glow with color variation
            const scale = 1 + Math.sin(time * 3 + index) * 0.3;
            tower.userData.glow.scale.set(scale, scale, scale);
            tower.userData.glow.material.opacity = 0.3 + Math.sin(time * 4) * 0.2;
            
            // Rotate particle ring
            if (tower.userData.particleRing) {
                tower.userData.particleRing.rotation.z += 0.01;
                tower.userData.particleRing.material.opacity = 0.1 + Math.sin(time * 2) * 0.1;
            }
            
            // Wave flag
            if (tower.userData.flag) {
                tower.userData.flag.rotation.y = Math.sin(time * 3 + index) * 0.3;
                tower.userData.flag.position.x = 0.75 + Math.sin(time * 4 + index) * 0.1;
            }
        }
    });
    
    // Move units with swaying motion
    units.forEach((unit, index) => {
        unit.position.x += unit.userData.velocity;
        unit.position.y = 1 + Math.sin(time * 5 + index) * 0.15;
        unit.position.z += Math.sin(time * 3 + index) * 0.01; // Slight zigzag
        
        // Rotate units
        unit.rotation.y += 0.05;
        
        // Remove units that go off screen
        if (Math.abs(unit.position.x) > 25) {
            scene.remove(unit);
            units.splice(index, 1);
        }
        
        // Check collision with enemy towers
        towers.forEach(tower => {
            if (tower.userData.team !== unit.userData.team) {
                const distance = unit.position.distanceTo(tower.position);
                if (distance < 3) {
                    // Create enhanced hit effect
                    createSpawnEffect(unit.position, 0xffff00);
                    createExplosion(unit.position);
                    scene.remove(unit);
                    units.splice(index, 1);
                    
                    // Update health bar
                    const healthBar = document.getElementById(
                        tower.userData.team === 'blue' ? 'blue-health' : 'red-health'
                    );
                    const currentWidth = parseFloat(healthBar.style.width);
                    healthBar.style.width = Math.max(0, currentWidth - 10) + '%';
                }
            }
        });
    });
    
    // Animate flowers and grass (subtle wind effect)
    scene.traverse((child) => {
        if (child.type === 'Group' && child.children.length > 0) {
            // Check if it's a flower group (has petals)
            const hasPetals = child.children.some(c => c.geometry && c.geometry.parameters && c.geometry.parameters.radius === 0.15);
            if (hasPetals) {
                child.rotation.z = Math.sin(time * 2 + child.position.x) * 0.05;
                child.rotation.x = Math.cos(time * 2 + child.position.z) * 0.05;
            }
        }
    });

    // Camera shake effect
    if (cameraShakeActive) {
        if (cameraShakeDuration > 0) {
            camera.position.x = originalCameraPos.x + (Math.random() - 0.5) * cameraShakeIntensity;
            camera.position.y = originalCameraPos.y + (Math.random() - 0.5) * cameraShakeIntensity;
            camera.position.z = originalCameraPos.z + (Math.random() - 0.5) * cameraShakeIntensity;
            cameraShakeDuration--;
        } else {
            camera.position.copy(originalCameraPos);
            cameraShakeActive = false;
        }
    }
    
    // Animate AI walking character (before battle) - skip if game is paused
    if (gameState && gameState.aiWalkingCharacter && gameState.aiWalkingCharacter.userData.walkData) {
        const walkData = gameState.aiWalkingCharacter.userData.walkData;
        
        // Check if game is paused (onboarding mode)
        const isPaused = (typeof isGamePaused === 'function' && isGamePaused());
        
        if (walkData.isWalking && !isPaused) {
            const elapsed = Date.now() - walkData.startTime;
            const progress = Math.min(elapsed / walkData.duration, 1);
            
            // Update position
            gameState.aiWalkingCharacter.position.lerpVectors(
                walkData.startPos,
                walkData.endPos,
                progress
            );
            
            // Walking bobbing animation
            const bob = Math.abs(Math.sin(elapsed * 0.002)) * 0.8;
            gameState.aiWalkingCharacter.position.y = 0 + bob;
            
            // Subtle rotation variation from base rotation
            const baseRot = gameState.aiWalkingCharacter.userData.baseRotation || 0;
            gameState.aiWalkingCharacter.rotation.y = baseRot + Math.sin(elapsed * 0.0012) * 0.05;
            
            // When walk completes, stop at center
            if (progress >= 1) {
                walkData.isWalking = false;
                gameState.aiWalkingCharacter.position.copy(walkData.endPos);
                console.log('AI character reached center');
            }
        } else if (isPaused && walkData.isWalking) {
            // Game is paused - store elapsed time to resume from this point
            if (!walkData.pausedAt) {
                walkData.pausedAt = Date.now();
                walkData.elapsedBeforePause = Date.now() - walkData.startTime;
                console.log('AI walk paused at', walkData.elapsedBeforePause, 'ms');
            }
        } else if (!isPaused && walkData.pausedAt) {
            // Game resumed - adjust start time to account for pause duration
            const pauseDuration = Date.now() - walkData.pausedAt;
            walkData.startTime += pauseDuration;
            walkData.pausedAt = null;
            console.log('AI walk resumed, added', pauseDuration, 'ms to start time');
        }
    }
    
    // Animate active projectiles - skip if game is paused
    const isPausedForProjectiles = (typeof isGamePaused === 'function' && isGamePaused());
    
    if (gameState && gameState.activeProjectiles && gameState.activeProjectiles.length > 0 && !isPausedForProjectiles) {
        for (let i = gameState.activeProjectiles.length - 1; i >= 0; i--) {
            const projectile = gameState.activeProjectiles[i];
            
            if (!projectile || !projectile.mesh) {
                // Remove invalid projectile
                gameState.activeProjectiles.splice(i, 1);
                continue;
            }
            
            projectile.progress += projectile.speed;
            
            if (projectile.progress >= 1) {
                // Projectile reached target
                console.log(`Projectile from ${projectile.team} reached center`);
                
                // Clean up trail particles
                if (projectile.particles) {
                    projectile.particles.forEach(p => {
                        scene.remove(p);
                        if (p.material) p.material.dispose();
                    });
                    projectile.particles = [];
                }
                
                projectile.onComplete();
                gameState.activeProjectiles.splice(i, 1);
            } else {
                // Update position - WALKING on ground
                const t = projectile.progress;
                projectile.mesh.position.lerpVectors(
                    projectile.startPos,
                    projectile.endPos,
                    t
                );
                
                // Walking bobbing animation (up and down) - slower for bigger characters
                projectile.walkCycle += 0.1;
                const bob = Math.abs(Math.sin(projectile.walkCycle)) * 0.8;
                projectile.mesh.position.y = 0 + bob;
                
                // Subtle rotation variation from base rotation for character movement feel
                const baseRot = projectile.mesh.userData.baseRotation || 0;
                projectile.mesh.rotation.y = baseRot + Math.sin(projectile.walkCycle) * 0.05;
                
                // Speed up slightly as they get closer (building tension)
                if (t > 0.7) {
                    projectile.speed = 0.005; // Gentle speed up near the end
                }
            }
        }
    }
    
    renderer.render(scene, camera);
}

// Spawn character at tower and make it walk for specified duration
function spawnAndWalkCharacter(character, team, duration) {
    const tower = towers.find(t => t.userData.team === team);
    if (!tower) {
        console.error(`Tower not found for team: ${team}`);
        return;
    }
    
    // Position character at tower
    character.position.copy(tower.position);
    character.position.y = 0; // Ground level
    scene.add(character);
    
    // Calculate walk path (from tower to center)
    const startPos = character.position.clone();
    const endPos = new THREE.Vector3(0, 0, 0); // Center of arena
    
    // Set character to face camera for side view
    // Camera is at +Z looking toward -Z, so characters face toward camera (rotation.y = 0)
    // This gives a consistent side profile regardless of model's default orientation
    character.rotation.y = 0;
    
    // Store base rotation for animation variations
    character.userData.baseRotation = 0;
    
    // Store walk data
    character.userData.walkData = {
        startPos: startPos,
        endPos: endPos,
        startTime: Date.now(),
        duration: duration,
        isWalking: true
    };
    
    console.log(`${team} character started walking from tower to center (${duration}ms)`);
}

// Stop AI walk animation and prepare for battle
async function stopAIWalkAndStartBattle(aiVisual, playerVisual, aiTeam, playerTeam) {
    console.log('Stopping AI walk and starting battle...');
    
    // Step 1: Stop AI walking animation (it's already in scene, partway to center)
    if (aiVisual && aiVisual.userData.walkData) {
        aiVisual.userData.walkData.isWalking = false;
        console.log('AI walk stopped at current position');
    }
    
    // Step 2: Get AI's CURRENT position (don't reset to tower!)
    const aiCurrentPos = aiVisual ? aiVisual.position.clone() : new THREE.Vector3(10, 0, 0);
    const centerPos = new THREE.Vector3(0, 0, 0);
    
    console.log(`AI current position: (${aiCurrentPos.x.toFixed(1)}, ${aiCurrentPos.y.toFixed(1)}, ${aiCurrentPos.z.toFixed(1)})`);
    
    // Step 3: Calculate how far AI still needs to walk to center
    const aiDistanceToCenter = aiCurrentPos.distanceTo(centerPos);
    const totalDistance = 20; // Approximate distance from tower to center
    const aiProgress = 1 - (aiDistanceToCenter / totalDistance); // How far AI has walked (0-1)
    
    console.log(`AI progress: ${(aiProgress * 100).toFixed(0)}% of the way to center`);
    
    // Step 4: Add AI to projectiles system to continue from current position
    if (aiVisual && !aiVisual.userData.inProjectiles) {
        const aiProjectile = {
            mesh: aiVisual,
            startPos: aiCurrentPos.clone(), // Start from CURRENT position
            endPos: centerPos.clone(),
            progress: 0, // Start fresh from current position
            speed: 0.004, // Slightly faster to catch up
            team: aiTeam,
            walkCycle: Math.random() * Math.PI * 2, // Random phase
            onComplete: () => {
                console.log('AI reached center from intercepted position');
            }
        };
        
        if (!gameState.activeProjectiles) {
            gameState.activeProjectiles = [];
        }
        gameState.activeProjectiles.push(aiProjectile);
        aiVisual.userData.inProjectiles = true;
        
        console.log('AI added to projectiles system from current position');
    }
    
    // Step 5: Spawn player character at their tower and animate to center
    const playerTower = towers.find(t => t.userData.team === playerTeam);
    if (playerTower && playerVisual) {
        playerVisual.position.copy(playerTower.position);
        playerVisual.position.y = 0;
        scene.add(playerVisual);
        
        console.log('Player character spawned at tower, animating to center...');
        
        // Add player to projectiles system
        const playerProjectile = {
            mesh: playerVisual,
            startPos: playerVisual.position.clone(),
            endPos: centerPos.clone(),
            progress: 0,
            speed: 0.004, // Match AI speed
            team: playerTeam,
            walkCycle: 0,
            onComplete: () => {
                console.log('Player reached center');
            }
        };
        
        gameState.activeProjectiles.push(playerProjectile);
        playerVisual.userData.inProjectiles = true;
    }
    
    // Step 6: Wait for BOTH characters to reach center
    // Calculate wait time based on AI's remaining distance
    const maxWaitTime = Math.max(aiDistanceToCenter / (0.004 * 60), 10 / (0.004 * 60)); // Distance / speed
    const waitTime = Math.min(maxWaitTime * 16.67, 5000); // Convert to ms, cap at 5 seconds
    
    console.log(`Waiting ${(waitTime / 1000).toFixed(1)}s for both characters to reach center...`);
    
    return new Promise((resolve) => {
        // Poll until both projectiles are done
        const checkInterval = setInterval(() => {
            const aiDone = !gameState.activeProjectiles.some(p => p.mesh === aiVisual);
            const playerDone = !gameState.activeProjectiles.some(p => p.mesh === playerVisual);
            
            if (aiDone && playerDone) {
                clearInterval(checkInterval);
                console.log('Both characters reached center, starting battle collision!');
                resolve();
            }
        }, 100);
        
        // Timeout fallback
        setTimeout(() => {
            clearInterval(checkInterval);
            console.log('Battle timeout reached, proceeding...');
            resolve();
        }, waitTime);
    });
}

// Create engaging looping animation while waiting for LLM response
function startCharacterStandoffLoop(visual1, visual2) {
    console.log('Starting character standoff loop - waiting for LLM...');
    
    if (!visual1 || !visual2) {
        console.warn('Missing visuals for standoff animation');
        return () => {}; // Return empty stop function
    }
    
    const centerPos = new THREE.Vector3(0, 0, 0);
    const startTime = Date.now();
    let animationActive = true;
    
    // Store original positions
    const v1OriginalPos = visual1.position.clone();
    const v2OriginalPos = visual2.position.clone();
    
    // Animation parameters
    let circleAngle = 0;
    const circleRadius = 2; // Small circle around center
    const circleSpeed = 0.3; // Slow circling
    
    // Breathing/bobbing animation
    let breathPhase = 0;
    const breathSpeed = 2;
    const breathAmount = 0.3;
    
    // Energy buildup effect
    let energyPhase = 0;
    const energySpeed = 1.5;
    
    // Create ground crack effects
    createGroundCracks(centerPos);
    
    // Create ambient energy particles
    const particles = createStandoffParticles(visual1, visual2);
    
    // Main animation loop
    const animationLoop = () => {
        if (!animationActive) return;
        
        const elapsed = (Date.now() - startTime) / 1000; // seconds
        
        // 1. CIRCLING MOTION - Characters slowly circle around center point
        circleAngle += circleSpeed * 0.016; // ~60fps
        
        const v1Offset = new THREE.Vector3(
            Math.cos(circleAngle) * circleRadius,
            0,
            Math.sin(circleAngle) * circleRadius
        );
        
        const v2Offset = new THREE.Vector3(
            Math.cos(circleAngle + Math.PI) * circleRadius, // Opposite side
            0,
            Math.sin(circleAngle + Math.PI) * circleRadius
        );
        
        // 2. BREATHING/BOBBING - Slight up-down movement
        breathPhase += breathSpeed * 0.016;
        const breathOffset = Math.sin(breathPhase) * breathAmount;
        
        // Apply positions
        visual1.position.set(
            centerPos.x + v1Offset.x,
            breathOffset,
            centerPos.z + v1Offset.z
        );
        
        visual2.position.set(
            centerPos.x + v2Offset.x,
            breathOffset + 0.2, // Slightly out of phase
            centerPos.z + v2Offset.z
        );
        
        // 3. ROTATION - Characters face each other
        const angleToEachOther = Math.atan2(
            visual2.position.z - visual1.position.z,
            visual2.position.x - visual1.position.x
        );
        visual1.rotation.y = angleToEachOther + Math.PI / 2;
        visual2.rotation.y = angleToEachOther - Math.PI / 2;
        
        // 4. ENERGY BUILDUP - Pulsing scale effect
        energyPhase += energySpeed * 0.016;
        const energyPulse = 1 + Math.sin(energyPhase) * 0.05; // 5% pulse
        
        visual1.scale.set(energyPulse, energyPulse, energyPulse);
        visual2.scale.set(energyPulse, energyPulse, energyPulse);
        
        // 5. UPDATE PARTICLES
        updateStandoffParticles(particles, visual1, visual2);
        
        // Continue loop
        requestAnimationFrame(animationLoop);
    };
    
    // Start the animation loop
    requestAnimationFrame(animationLoop);
    
    // Return stop function
    return () => {
        console.log('Stopping standoff loop - LLM response received');
        animationActive = false;
        
        // Clean up particles
        cleanupStandoffParticles(particles);
        
        // Reset to original positions and scales
        visual1.position.copy(centerPos);
        visual2.position.copy(centerPos);
        visual1.scale.set(1, 1, 1);
        visual2.scale.set(1, 1, 1);
        visual1.rotation.y = 0;
        visual2.rotation.y = 0;
    };
}

// Create ground crack effects during standoff
function createGroundCracks(centerPos) {
    const crackCount = 8;
    for (let i = 0; i < crackCount; i++) {
        const angle = (i / crackCount) * Math.PI * 2;
        const distance = 2 + Math.random() * 3;
        
        const crackPos = new THREE.Vector3(
            centerPos.x + Math.cos(angle) * distance,
            0.1,
            centerPos.z + Math.sin(angle) * distance
        );
        
        // Simple line geometry for crack
        const crackGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            centerPos.x, 0.1, centerPos.z,
            crackPos.x, 0.1, crackPos.z
        ]);
        crackGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const crackMaterial = new THREE.LineBasicMaterial({
            color: 0x333333,
            opacity: 0.5,
            transparent: true
        });
        
        const crack = new THREE.Line(crackGeometry, crackMaterial);
        scene.add(crack);
        
        // Fade out and remove after animation
        setTimeout(() => {
            scene.remove(crack);
            crackGeometry.dispose();
            crackMaterial.dispose();
        }, 10000); // Remove after 10 seconds
    }
}

// Create ambient energy particles around characters
function createStandoffParticles(visual1, visual2) {
    const particles = [];
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: i < particleCount / 2 ? 0x4444ff : 0xff4444,
            opacity: 0.6,
            transparent: true
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.userData.offset = Math.random() * Math.PI * 2;
        particle.userData.speed = 1 + Math.random() * 2;
        particle.userData.radius = 2 + Math.random() * 1;
        particle.userData.height = Math.random() * 3;
        particle.userData.character = i < particleCount / 2 ? visual1 : visual2;
        
        scene.add(particle);
        particles.push(particle);
    }
    
    return particles;
}

// Update particle positions each frame
function updateStandoffParticles(particles, visual1, visual2) {
    particles.forEach((particle, i) => {
        const char = particle.userData.character;
        if (!char) return;
        
        const time = Date.now() / 1000;
        const angle = particle.userData.offset + time * particle.userData.speed;
        
        particle.position.x = char.position.x + Math.cos(angle) * particle.userData.radius;
        particle.position.y = particle.userData.height + Math.sin(time * 2) * 0.5;
        particle.position.z = char.position.z + Math.sin(angle) * particle.userData.radius;
        
        // Pulsing opacity
        particle.material.opacity = 0.3 + Math.sin(time * 3 + particle.userData.offset) * 0.3;
    });
}

// Clean up particles when standoff ends
function cleanupStandoffParticles(particles) {
    particles.forEach(particle => {
        scene.remove(particle);
        if (particle.geometry) particle.geometry.dispose();
        if (particle.material) particle.material.dispose();
    });
}

