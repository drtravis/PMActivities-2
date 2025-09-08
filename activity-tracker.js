// Activity Tracker JavaScript Functions

// Handle Sign In button click
function handleSignIn() {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Signing In...';
    button.disabled = true;
    
    setTimeout(() => {
        alert('Sign In functionality will be implemented soon.\n\nThis will redirect to the user dashboard where existing users can access their activities and projects.');
        
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
}

// Handle Get Started button click
function handleGetStarted() {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Setting Up...';
    button.disabled = true;
    
    setTimeout(() => {
        alert('Get Started functionality will be implemented soon.\n\nThis will guide new organizations through the setup process including:\n• Organization profile creation\n• Team member invitations\n• Initial project setup\n• Role assignments');
        
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
}

// Handle Demo button click
function handleDemo() {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading Demo...';
    button.disabled = true;
    
    setTimeout(() => {
        alert('Demo functionality will be implemented soon.\n\nThis will provide:\n• Sample project data\n• Interactive walkthrough\n• Feature demonstrations\n• No registration required');
        
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
    }, 1000);
}

// Close Lovable badge functionality
document.addEventListener('DOMContentLoaded', function() {
    const closeBtn = document.querySelector('.close-btn');
    const lovableBadge = document.querySelector('.lovable-badge');
    
    if (closeBtn && lovableBadge) {
        closeBtn.addEventListener('click', function() {
            lovableBadge.style.display = 'none';
        });
    }
});

// Add hover effects for feature cards
document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1)';
            }
        });
    });
});
