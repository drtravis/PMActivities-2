// Navigation function with placeholder alerts
function navigateToRole(role) {
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Loading...';
    button.disabled = true;
    
    setTimeout(() => {
        let roleName = '';
        switch(role) {
            case 'admin':
                roleName = 'Admin Dashboard';
                break;
            case 'program-manager':
                roleName = 'Program Manager Dashboard';
                break;
            case 'project-manager':
                roleName = 'Project Manager Dashboard';
                break;
            case 'project-member-1':
                roleName = 'Project Member 1 Dashboard';
                break;
            case 'project-member-2':
                roleName = 'Project Member 2 Dashboard';
                break;
            default:
                roleName = 'Dashboard';
        }
        
        alert(`Redirecting to ${roleName}...\n\nThis is a placeholder. Dashboard pages will be implemented in the future.`);
        
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
    }, 500);
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
    
    // Add subtle animations to profile images
    const profileImages = document.querySelectorAll('.profile-image');
    profileImages.forEach(img => {
        img.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.transition = 'transform 0.2s ease';
        });
        
        img.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add click animation to role buttons
    const roleButtons = document.querySelectorAll('.role-button');
    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(-1px)';
            }, 100);
        });
    });
    
    // Add console welcome message
    console.log('🏢 Niha Technologies - Organizational Hierarchy');
    console.log('👤 Click on role buttons to navigate to dashboards');
});

