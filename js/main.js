// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const btn = document.querySelector('.theme-toggle');
    btn.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';

    // Save theme preference
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const btn = document.querySelector('.theme-toggle');
        if (btn) btn.textContent = '☀️';
    }
});

// Carousel functionality (for index.html)
let currentRotation = 0;
let currentSlide = 0;
let totalSlides = 0;
let anglePerSlide = 0;
const radius = 550;
let flipTimeout = null;
let flippedCardIndex = null;

// Dragging variables
let pressed = false;
let startX;
let currentX;
let carouselStartRotation = 0;

function updateCarouselPositions() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;

    const items = carousel.querySelectorAll('.carousel-item');

    items.forEach((item, index) => {
        const angle = (index * anglePerSlide + currentRotation) % 360;
        const normalizedAngle = ((angle % 360) + 360) % 360;

        // Calculate horizontal position only (all cards on same line)
        const x = Math.sin(angle * Math.PI / 180) * radius;

        // Keep all cards at the same vertical position (y=0)
        // Slight Z positioning for depth, but not too much
        const z = (Math.cos(angle * Math.PI / 180) - 1) * 100;

        // Determine scale and opacity based on position
        let scale = 1;
        let opacity = 1;
        let blur = 0;
        let brightness = 1;
        let zIndex = 50;

        // Center card (facing front, around 0 degrees)
        if (normalizedAngle < 30 || normalizedAngle > 330) {
            scale = 1.05;
            opacity = 1;
            blur = 0;
            brightness = 1;
            zIndex = 100;
            item.classList.add('center');
            item.classList.remove('side', 'far', 'hidden');
            item.dataset.position = 'center';
        }
        // Side cards (30-90 or 270-330 degrees)
        else if ((normalizedAngle >= 30 && normalizedAngle <= 90) || (normalizedAngle >= 270 && normalizedAngle < 330)) {
            scale = 0.9;
            opacity = 0.8;
            blur = 0.5;
            brightness = 0.9;
            zIndex = 50;
            item.classList.add('side');
            item.classList.remove('center', 'far', 'hidden');

            if (normalizedAngle >= 270 && normalizedAngle < 330) {
                item.dataset.position = 'right';
            } else {
                item.dataset.position = 'left';
            }
        }
        // Far cards (90-150 or 210-270 degrees)
        else if ((normalizedAngle > 90 && normalizedAngle <= 150) || (normalizedAngle >= 210 && normalizedAngle < 270)) {
            scale = 0.75;
            opacity = 0.5;
            blur = 1.5;
            brightness = 0.75;
            zIndex = 20;
            item.classList.add('far');
            item.classList.remove('center', 'side', 'hidden');
            item.dataset.position = 'far';
        }
        // Hidden cards (back side, 150-210 degrees)
        else {
            scale = 0.6;
            opacity = 0;
            blur = 3;
            brightness = 0.5;
            zIndex = 1;
            item.classList.add('hidden');
            item.classList.remove('center', 'side', 'far');
            item.dataset.position = 'hidden';
        }

        // Apply transform with only horizontal movement and scale
        item.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scale})`;
        item.style.opacity = opacity;
        item.style.filter = `blur(${blur}px) brightness(${brightness})`;
        item.style.zIndex = zIndex;
    });
}

function rotateCarousel(direction) {
    currentSlide = (currentSlide - direction + totalSlides) % totalSlides;
    currentRotation += direction * anglePerSlide;

    // Reset any flipped cards when rotating
    resetFlippedCards();

    updateCarouselPositions();
}

function snapToNearestCard() {
    // Calculate which card should be centered based on current rotation
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const targetSlide = Math.round(normalizedRotation / anglePerSlide) % totalSlides;
    const targetRotation = targetSlide * anglePerSlide;

    // Snap to the nearest card
    currentRotation = targetRotation;
    currentSlide = totalSlides - (targetSlide % totalSlides);

    updateCarouselPositions();
}

function resetFlippedCards() {
    const items = document.querySelectorAll('.carousel-item');
    items.forEach(item => {
        item.classList.remove('flipped');
        const front = item.querySelector('.card-front');
        const back = item.querySelector('.card-back');
        if (front && back) {
            front.style.display = 'block';
            back.style.display = 'none';
        }
    });
    flippedCardIndex = null;
    if (flipTimeout) {
        clearTimeout(flipTimeout);
        flipTimeout = null;
    }
}

function handleCardClick(event, index) {
    const item = event.currentTarget;
    const position = item.dataset.position;

    // Don't handle clicks during drag
    if (Math.abs(currentX - startX) > 10) {
        return;
    }

    // If clicking left side card, rotate left
    if (position === 'left') {
        rotateCarousel(-1);
        return;
    }

    // If clicking right side card, rotate right
    if (position === 'right') {
        rotateCarousel(1);
        return;
    }

    // If clicking center card
    if (position === 'center') {
        // If already flipped, navigate to project
        if (item.classList.contains('flipped')) {
            const projectUrl = item.dataset.project;
            if (projectUrl) {
                window.location.href = projectUrl;
            }
            return;
        }

        // Otherwise, flip the card
        item.classList.add('flipped');
        flippedCardIndex = index;

        // Show back, hide front
        const front = item.querySelector('.card-front');
        const back = item.querySelector('.card-back');
        if (front && back) {
            front.style.display = 'none';
            back.style.display = 'flex';
        }

        // Set timeout to flip back after 5 seconds
        if (flipTimeout) {
            clearTimeout(flipTimeout);
        }
        flipTimeout = setTimeout(() => {
            if (item.classList.contains('flipped')) {
                item.classList.remove('flipped');
                if (front && back) {
                    front.style.display = 'block';
                    back.style.display = 'none';
                }
                flippedCardIndex = null;
            }
        }, 5000);
    }
}

// Draggable carousel functionality
function handleDragStart(e) {
    pressed = true;
    startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    currentX = startX;
    carouselStartRotation = currentRotation;

    const container = document.querySelector('.carousel-container');
    if (container) {
        container.style.cursor = 'grabbing';
    }
}

function handleDragMove(e) {
    if (!pressed) return;

    e.preventDefault();
    currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const diff = currentX - startX;

    // Convert pixel movement to rotation (sensitivity adjustment)
    currentRotation = carouselStartRotation + (diff * 0.25);

    updateCarouselPositions();
}

function handleDragEnd(e) {
    if (!pressed) return;

    pressed = false;

    const container = document.querySelector('.carousel-container');
    if (container) {
        container.style.cursor = 'grab';
    }

    // Snap to nearest card
    snapToNearestCard();
}

// Initialize carousel
function initCarousel() {
    const carousel = document.getElementById('carousel');
    const container = document.querySelector('.carousel-container');
    if (!carousel || !container) return;

    // Dynamically calculate total slides
    const items = carousel.querySelectorAll('.carousel-item');
    totalSlides = items.length;
    anglePerSlide = 360 / totalSlides;

    console.log(`Carousel initialized with ${totalSlides} projects`);

    updateCarouselPositions();

    // Add click handlers to all carousel items
    items.forEach((item, index) => {
        item.addEventListener('click', (e) => handleCardClick(e, index));
    });

    // Mouse drag events
    container.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // Touch drag events
    container.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    // Cursor styling
    container.addEventListener('mouseenter', () => {
        if (!pressed) container.style.cursor = 'grab';
    });
}

// Auto-rotate carousel
let autoRotate;
if (document.getElementById('carousel')) {
    initCarousel();

    autoRotate = setInterval(() => {
        // Don't auto-rotate if a card is flipped or user is dragging
        if (flippedCardIndex === null && !pressed) {
            rotateCarousel(1);
        }
    }, 4000);

    // Pause auto-rotate on hover
    document.querySelector('.carousel-container')?.addEventListener('mouseenter', () => {
        clearInterval(autoRotate);
    });

    document.querySelector('.carousel-container')?.addEventListener('mouseleave', () => {
        // Only restart if no card is flipped and not dragging
        if (flippedCardIndex === null && !pressed) {
            autoRotate = setInterval(() => {
                if (flippedCardIndex === null && !pressed) {
                    rotateCarousel(1);
                }
            }, 4000);
        }
    });
}

function updateDots() {
    // Dots removed - no longer needed
}

// Vinyl record spin interaction
function initVinylSpin() {
    const vinylContainer = document.querySelector('.vinyl-container');
    const vinylDisc = document.querySelector('.vinyl-disc-3d');

    if (!vinylContainer || !vinylDisc) return;

    let isSpinning = false;
    let lastMouseX = null;
    let lastMouseY = null;
    let lastTime = null;
    let mouseVelocity = 0;
    let currentRotation = 0; // Track current Y rotation
    let returnToStartInterval = null;

    // Track mouse movement to calculate velocity
    document.addEventListener('mousemove', (e) => {
        if (lastMouseX !== null && lastMouseY !== null && lastTime !== null) {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastTime;

            if (timeDiff > 0) {
                const distanceX = e.clientX - lastMouseX;
                const distanceY = e.clientY - lastMouseY;
                const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                // Calculate velocity in pixels per millisecond
                mouseVelocity = distance / timeDiff;
            }
        }

        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        lastTime = Date.now();
    });

    // Function to slowly return to starting position
    function startReturnToStart() {
        // Clear any existing return interval
        if (returnToStartInterval) {
            clearInterval(returnToStartInterval);
        }

        // Normalize rotation to between -180 and 180
        const normalizedRotation = ((currentRotation % 360) + 540) % 360 - 180;

        // Only return if not already at start
        if (Math.abs(normalizedRotation) > 1) {
            returnToStartInterval = setInterval(() => {
                // Calculate how far we are from 0
                const currentNormalized = ((currentRotation % 360) + 540) % 360 - 180;

                // If close enough, snap to 0 and stop
                if (Math.abs(currentNormalized) < 1) {
                    currentRotation = Math.round(currentRotation / 360) * 360;
                    vinylDisc.style.transform = `rotateX(15deg) rotateY(${currentRotation}deg) translateY(0px)`;
                    clearInterval(returnToStartInterval);
                    returnToStartInterval = null;
                    return;
                }

                // Move 2 degrees per frame towards 0 (slow return)
                const direction = currentNormalized > 0 ? -1 : 1;
                currentRotation += direction * 2;

                vinylDisc.style.transform = `rotateX(15deg) rotateY(${currentRotation}deg) translateY(0px)`;
            }, 16); // ~60fps
        }
    }

    vinylContainer.addEventListener('mouseenter', (e) => {
        if (isSpinning) return;

        // Stop any return to start animation
        if (returnToStartInterval) {
            clearInterval(returnToStartInterval);
            returnToStartInterval = null;
        }

        isSpinning = true;

        // Get container bounds
        const rect = vinylContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;

        // Determine which side the mouse entered from
        const mouseX = e.clientX;
        const fromLeft = mouseX < centerX;

        // Calculate spin speed based on mouse velocity
        // Clamp velocity between 0.2 and 3 for reasonable speeds
        const minVelocity = 0.2;
        const maxVelocity = 3;
        const clampedVelocity = Math.max(minVelocity, Math.min(maxVelocity, mouseVelocity));

        // Map velocity to rotation count (0.5 to 5 rotations)
        const minRotations = 0.5;
        const maxRotations = 5;
        const rotationCount = minRotations + (clampedVelocity - minVelocity) / (maxVelocity - minVelocity) * (maxRotations - minRotations);

        // Map velocity to duration (2s for slow, 0.8s for fast)
        const minDuration = 800;  // Fast spin
        const maxDuration = 2000; // Slow spin
        const duration = maxDuration - (clampedVelocity - minVelocity) / (maxVelocity - minVelocity) * (maxDuration - minDuration);

        // Calculate total degrees to add (from current position)
        const direction = fromLeft ? 1 : -1; // Right if from left, left if from right
        const degreesToAdd = direction * rotationCount * 360;
        const targetRotation = currentRotation + degreesToAdd;

        console.log(`Velocity: ${mouseVelocity.toFixed(2)}, Rotations: ${rotationCount.toFixed(1)}, Duration: ${duration}ms, From: ${currentRotation.toFixed(0)}° To: ${targetRotation.toFixed(0)}°`);

        // Animate using requestAnimationFrame for smooth interpolation
        const startRotation = currentRotation;
        const startTime = Date.now();

        function animate() {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease out cubic)
            const eased = 1 - Math.pow(1 - progress, 3);

            currentRotation = startRotation + (degreesToAdd * eased);
            vinylDisc.style.transform = `rotateX(15deg) rotateY(${currentRotation}deg) translateY(0px)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation complete
                isSpinning = false;

                // Start slow return to start position after a delay
                setTimeout(() => {
                    if (!isSpinning) {
                        startReturnToStart();
                    }
                }, 1000); // Wait 1 second before starting return
            }
        }

        // Disable the CSS animation and start custom animation
        vinylDisc.style.animation = 'none';
        requestAnimationFrame(animate);
    });

    // Reset velocity when mouse leaves the window
    document.addEventListener('mouseleave', () => {
        mouseVelocity = 0;
        lastMouseX = null;
        lastMouseY = null;
        lastTime = null;
    });

    // Set initial state
    vinylDisc.style.transform = `rotateX(15deg) rotateY(0deg) translateY(0px)`;
}

// Initialize vinyl spin when DOM is ready
if (document.querySelector('.vinyl-container')) {
    initVinylSpin();
}
function sendEmail(event) {
    event.preventDefault();

    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    const subject = encodeURIComponent(`Portfolio Message from ${fullname}`);
    const body = encodeURIComponent(`Name: ${fullname}\nEmail: ${email}\n\nMessage:\n${message}`);

    window.location.href = `mailto:charles.projecteco@gmail.com?subject=${subject}&body=${body}`;

    // Reset form
    event.target.reset();
    alert('Your email client will open. Please send the message from there!');
}

document.querySelectorAll('.education-accordion').forEach(acc => {
    const content = acc.querySelector('.education-content');
    const indicator = acc.querySelector('.edu-indicator');

    acc.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;

        acc.classList.toggle('open');

        if (acc.classList.contains('open')) {
            content.style.maxHeight = content.scrollHeight + 40 + "px";
            content.classList.add("open");
            indicator.src = "/images/arrow-open.png";   // <-- your open image
        } else {
            content.style.maxHeight = null;
            content.classList.remove("open");
            indicator.src = "/images/arrow-closed.png"; // <-- your closed image
        }
    });
});
