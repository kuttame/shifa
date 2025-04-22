import 'hammerjs'; // Import for side effects - attaches Hammer to the global scope

document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const items = Array.from(carousel.querySelectorAll('.carousel-item'));
    const dotsContainer = document.querySelector('.carousel-dots');
    const heartsContainer = document.getElementById('hearts-container');
    const audio = document.getElementById('background-audio');
    const playButton = document.getElementById('play-button');
    const mainImage = document.getElementById('main-image'); // Get the main image element
    let currentIndex = 0;
    let intervalId = null; // For heart generation

    function updateMainImage(index) {
        if (items[index]) {
            const newSrc = items[index].querySelector('img')?.src;
            const newAlt = items[index].querySelector('img')?.alt;
            if (newSrc) {
                // Optional: Add fade effect for image change
                mainImage.style.opacity = '0';
                setTimeout(() => {
                    mainImage.src = newSrc;
                    mainImage.alt = newAlt || 'Couple Image';
                    mainImage.style.opacity = '1';
                }, 250); // Match half of the carousel transition time
            }
        }
    }

    function updateCarousel(newIndex, direction = '') {
        const prevIndex = currentIndex;
        currentIndex = (newIndex + items.length) % items.length; // Wrap around

        items.forEach((item, index) => {
            item.classList.remove('current', 'prev', 'next', 'glow-left', 'glow-right', 'swiping');
            // Clear transforms set during swipe
            item.style.transform = '';
            item.style.opacity = '';

            if (index === currentIndex) {
                item.classList.add('current');
            } else if (index === (currentIndex - 1 + items.length) % items.length) {
                item.classList.add('prev');
            } else if (index === (currentIndex + 1) % items.length) {
                item.classList.add('next');
            }
        });

        updateDots();
        updateMainImage(currentIndex); // Update the main image
    }

    function updateDots() {
         dotsContainer.innerHTML = ''; // Clear existing dots
         items.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.classList.add('dot');
            if (index === currentIndex) {
                dot.classList.add('active');
            }
            dot.setAttribute('aria-label', `Go to image ${index + 1}`); // Accessibility
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }

    function goToSlide(index) {
         if (index === currentIndex) return;
         updateCarousel(index);
    }

    // Initialize Hammer.js for swipe gestures
    // Access Hammer via the global scope (window.Hammer or just Hammer)
    const hammer = new Hammer(carousel);

    // --- Swipe Logic ---
    let startX = 0; // Track initial position for dynamic movement
    let currentItem = null;

    hammer.on('panstart', (ev) => {
        currentItem = items[currentIndex];
        if (!currentItem) return;

        currentItem.classList.add('grabbing', 'swiping'); // Add grabbing cursor and disable transition
        // Get initial transform value correctly
        const transformMatrix = window.getComputedStyle(currentItem).transform;
        if (transformMatrix && transformMatrix !== 'none') {
           const matrixValues = transformMatrix.match(/matrix.*\((.+)\)/);
           if (matrixValues && matrixValues[1]) {
                startX = parseFloat(matrixValues[1].split(', ')[4]) || 0;
           } else {
               startX = 0; // Fallback if parsing fails
           }
        } else {
            startX = 0; // No initial transform
        }
         // Pause heart generation during swipe interaction
        stopHeartGeneration();
    });

    hammer.on('panmove', (ev) => {
        if (!currentItem) return;

        const deltaX = ev.deltaX;
        const percentage = (deltaX / carousel.offsetWidth) * 100;
        const threshold = 20; // Percentage threshold to show glow

        // Move the current item
        currentItem.style.transform = `translateX(${startX + deltaX}px) scale(1)`; // Keep scale during drag
        currentItem.style.opacity = `${1 - Math.abs(deltaX) / (carousel.offsetWidth * 0.8)}`; // Fade out slightly

        // Show glow based on direction
        if (percentage > threshold) { // Swiping Right (towards prev slide)
            currentItem.classList.add('glow-right'); // Red glow on right
            currentItem.classList.remove('glow-left');
        } else if (percentage < -threshold) { // Swiping Left (towards next slide)
            currentItem.classList.add('glow-left'); // Green glow on left
            currentItem.classList.remove('glow-right');
        } else {
            currentItem.classList.remove('glow-left', 'glow-right');
        }
    });

    hammer.on('panend', (ev) => {
         if (!currentItem) return;

        currentItem.classList.remove('grabbing', 'swiping'); // Remove grabbing cursor and re-enable transitions
        const deltaX = ev.deltaX;
        const velocityX = ev.velocityX;
        const threshold = carousel.offsetWidth * 0.3; // 30% swipe needed

        // Determine if swipe was significant enough
        if (Math.abs(deltaX) > threshold || Math.abs(velocityX) > 0.5) {
            // Swiping left (negative deltaX) means go to next slide
            // Swiping right (positive deltaX) means go to previous slide
            if (deltaX < 0) {
                updateCarousel(currentIndex + 1, 'left');
            } else {
                 updateCarousel(currentIndex - 1, 'right');
            }
        } else {
            // Reset position if swipe wasn't enough
            currentItem.style.transform = ''; // Revert to CSS defined position
            currentItem.style.opacity = '';
            currentItem.classList.remove('glow-left', 'glow-right');
        }
        currentItem = null; // Reset current item
        // Resume heart generation after interaction ends
        startHeartGeneration();
    });

     // Prevent default drag behavior on images inside carousel items
    items.forEach(item => {
        const img = item.querySelector('img');
        if (img) {
            img.addEventListener('dragstart', (e) => e.preventDefault());
        }
    });

    // --- Floating Hearts ---
    function createHeart() {
        const heart = document.createElement('div');
        heart.classList.add('heart');
        heart.style.left = `${Math.random() * 100}%`; // Random horizontal position
        // Randomize animation duration and delay for variety
        const duration = Math.random() * 5 + 8; // 8-13 seconds
        const delay = Math.random() * 5; // 0-5 seconds delay
        heart.style.animationDuration = `${duration}s`;
        heart.style.animationDelay = `${delay}s`;
        // Randomize size slightly
        const size = Math.random() * 6 + 8; // 8px to 14px
        heart.style.width = `${size}px`;
        heart.style.height = `${size}px`;

         // Adjust pseudo-element sizes based on the main size
        const pseudoSize = `${size}px`;
        const pseudoOffset = `${-size / 2}px`;

        const style = document.createElement('style');
        // Create a unique ID for the heart to target its pseudo-elements
        const uniqueId = `heart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        heart.id = uniqueId;
        // Adjust pseudo-element positioning for correct heart shape
        style.innerHTML = `
            #${uniqueId}::before, #${uniqueId}::after {
                width: ${pseudoSize};
                height: ${pseudoSize};
            }
            #${uniqueId}::before {
                 top: ${pseudoOffset}; /* Move up half size */
                 left: 0;
            }
            #${uniqueId}::after {
                 top: 0;
                 left: ${pseudoOffset}; /* Move left half size */
            }
        `;
        document.head.appendChild(style); // Add styles to head


        heartsContainer.appendChild(heart);

        // Remove heart and its style from DOM after animation finishes to prevent buildup
        heart.addEventListener('animationend', () => {
            heart.remove();
            style.remove(); // Remove the associated style tag
        });
    }

    function startHeartGeneration() {
        if (intervalId === null) { // Prevent multiple intervals
            // Generate hearts periodically
             intervalId = setInterval(createHeart, 1000); // Create a heart every second
             // Create initial burst
            for(let i=0; i<10; i++) {
                setTimeout(createHeart, Math.random() * 1000);
            }
        }
    }

     function stopHeartGeneration() {
        clearInterval(intervalId);
        intervalId = null;
    }

    // --- Audio Handling ---
    // Try to play audio, handle potential browser restrictions
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            // Autoplay started!
            console.log("Audio playback started automatically.");
        }).catch(error => {
            // Autoplay was prevented. Show a play button.
            console.log("Audio playback was prevented. Showing play button.", error);
            playButton.style.display = 'block';
            playButton.addEventListener('click', () => {
                 // Create an AudioContext on user interaction for better compatibility
                 const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                 const source = audioContext.createMediaElementSource(audio);
                 source.connect(audioContext.destination);

                audio.play().then(() => {
                     playButton.style.display = 'none'; // Hide button after successful play
                }).catch(err => {
                    console.error("Error playing audio after user interaction:", err);
                    // Optionally provide feedback to the user that playback failed
                });
            }, { once: true }); // Remove listener after first click
        });
    } else {
         // Fallback for browsers that don't return a promise from play()
         // May require user interaction regardless
         playButton.style.display = 'block';
         playButton.addEventListener('click', () => {
            audio.play();
            playButton.style.display = 'none';
         }, { once: true });
    }

    // Initial setup
    updateCarousel(currentIndex); // Calls updateMainImage internally
    startHeartGeneration(); // Start heart animation
});