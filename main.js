// BSSPlus Platform Main JavaScript - API-Driven with Netlify/Supabase
class BSSPlusPlatform {
    constructor() {
        this.posts = [];
        this.currentEditId = null;
        // The endpoint is now handled by the Netlify Redirects file
        this.apiEndpoints = {
            posts: '/api/posts', 
        };
        this.init();
    }

    async init() {
        this.checkAuthentication();
        await this.loadPosts(); // <--- ASYNCHRONOUSLY LOADS FROM API
        this.setupEventListeners();
        this.initializeAnimations();
        this.renderPosts();
        this.initParticles();
        this.initializeAPI();
    }
    
    // ------------------------------------------------------------------
    // API-DRIVEN CRUD METHODS (Supabase via Netlify Function)
    // ------------------------------------------------------------------

    // R - Read All Posts (Load data from API)
    async loadPosts() {
        this.showNotification("Loading posts from BSSPlus API...", 'info');
        try {
            const response = await fetch(this.apiEndpoints.posts);
            
            if (!response.ok) {
                // If the response status is not 200, throw an error
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Sort posts by created_date, descending
                this.posts = result.data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
                this.renderPosts();
                this.showNotification(`Successfully loaded ${this.posts.length} posts from database.`, 'success');
                // Ensure local storage is cleared, as it's no longer the source of truth
                localStorage.removeItem('bssplus_posts');
            } else {
                console.error("API Error:", result.error);
                this.showNotification("Could not load posts from API.", 'error');
                this.loadSampleDataFallback(); 
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            this.showNotification(`Failed to connect to the content API. Loading fallback data.`, 'error');
            this.loadSampleDataFallback();
        }
    }
    
    // C - Create Post (POST request)
    async createPost(data) {
        const postData = {
            ...data,
            author: localStorage.getItem('bssplus_username') || 'Manager',
        };
        
        try {
            const response = await fetch(this.apiEndpoints.posts, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            // Reload all posts to update the list with the new, confirmed data from the database
            await this.loadPosts(); 
            this.showNotification('Post created successfully and saved to database.', 'success');
            return { success: true, data: result.data };
            
        } catch (error) {
            console.error("Create Post Error:", error);
            this.showNotification(`Failed to create post: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // U - Update Post (PUT request)
    async updatePost(id, data) {
        // The PUT endpoint requires the ID in the URL: /api/posts/123
        const endpoint = `${this.apiEndpoints.posts}/${id}`; 
        
        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            
            // Reload all posts to ensure the list is refreshed
            await this.loadPosts(); 
            this.showNotification('Post updated successfully in database.', 'success');
            return { success: true, data: result.data };
            
        } catch (error) {
            console.error("Update Post Error:", error);
            this.showNotification(`Failed to update post: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    // D - Delete Post (DELETE request)
    async deletePost(id) {
        // The DELETE endpoint requires the ID in the URL: /api/posts/123
        const endpoint = `${this.apiEndpoints.posts}/${id}`; 
        
        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }
            
            // For a fast UI update, remove from local array before full reload
            this.posts = this.posts.filter(p => p.id != id); 
            this.renderPosts(); 
            this.showNotification('Post deleted successfully from database.', 'success');
            return { success: true, message: 'Post deleted successfully' };
            
        } catch (error) {
            console.error("Delete Post Error:", error);
            this.showNotification(`Failed to delete post: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    // Make form submit handler async to await the API call
    async handleFormSubmit(e) {
        e.preventDefault();
        
        // Collect form data
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value;
        const tagsInput = document.getElementById('post-tags').value;
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
        
        const postData = { title, category, content, tags, status: 'published' };

        // Determine if creating or updating
        if (this.currentEditId) {
            await this.updatePost(this.currentEditId, postData);
        } else {
            await this.createPost(postData);
        }

        this.closeModal();
    }
    
    // ------------------------------------------------------------------
    // AUTHENTICATION AND LEGACY/FALLBACK METHODS (Mostly Unchanged)
    // ------------------------------------------------------------------

    checkAuthentication() {
        // Check if user is logged in
        if (!localStorage.getItem('bssplus_logged_in') || 
            localStorage.getItem('bssplus_username') !== 'admin') {
            window.location.href = 'login.html';
            return;
        }
    }

    logout() {
        localStorage.removeItem('bssplus_logged_in');
        localStorage.removeItem('bssplus_username');
        window.location.href = 'login.html';
    }

    // The API methods are now internal and call the fetch methods
    initializeAPI() {
        window.BSSPlusAPI = {
            getAllPosts: () => this.posts, // Now returns the locally synced array
            getPost: (id) => this.posts.find(p => p.id == id),
            // The following now trigger the full database update cycle:
            createPost: (data) => this.createPost(data),
            updatePost: (id, data) => this.updatePost(id, data),
            deletePost: (id) => this.deletePost(id),
        };
    }
    
    // Fallback data in case the API call completely fails
    loadSampleDataFallback() {
        this.posts = [
            { id: 1, title: "Welcome to BSSPlus Platform", category: "announcements", content: "Welcome to our new content management platform...", author: "System Administrator", created_date: "2024-10-15", modified_date: "2024-10-15", tags: ["welcome"], status: "published" },
            { id: 2, title: "Digital Transformation Strategy Guidelines", category: "guidelines", content: "Comprehensive guide to implementing digital transformation...", author: "Digital Strategy Team", created_date: "2024-10-10", modified_date: "2024-10-12", tags: ["strategy"], status: "published" },
            { id: 3, title: "ESPA Programs Update 2024", category: "updates", content: "Latest updates on ESPA (European Structural and Investment Funds) programs...", author: "Funding Advisory Team", created_date: "2024-10-08", modified_date: "2024-10-08", tags: ["funding"], status: "published" },
        ];
        this.renderPosts();
    }
    
    // --- UI/RENDERING METHODS ---
    
    renderPosts(postsToRender = this.posts) {
        const tableBody = document.getElementById('posts-table-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (postsToRender.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No posts found. Add a new post to get started!</td></tr>`;
            return;
        }

        const categoryColors = {
            announcements: 'bg-blue-100 text-blue-800',
            guidelines: 'bg-green-100 text-green-800',
            updates: 'bg-yellow-100 text-yellow-800',
            training: 'bg-purple-100 text-purple-800',
            policies: 'bg-red-100 text-red-800'
        };

        postsToRender.forEach(post => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            
            // NOTE: Using post.created_date and post.modified_date from the Supabase schema
            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${post.title}</div>
                    <div class="text-sm text-gray-500">${post.content.substring(0, 80)}...</div>
                </td>
                <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryColors[post.category] || 'bg-gray-100 text-gray-800'}">
                        ${post.category}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">${post.author || 'N/A'}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${this.formatDate(post.created_date)}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <button onclick="platform.editPost(${post.id})" 
                                class="text-blue-600 hover:text-blue-900 text-sm font-medium">
                            Edit
                        </button>
                        <button onclick="platform.viewPost(${post.id})" 
                                class="text-green-600 hover:text-green-900 text-sm font-medium">
                            View
                        </button>
                        <button onclick="platform.confirmDelete(${post.id})" 
                                class="text-red-600 hover:text-red-900 text-sm font-medium">
                            Delete
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Update total posts count
        const totalPostsElement = document.getElementById('total-posts');
        if (totalPostsElement) {
            totalPostsElement.textContent = postsToRender.length;
        }
    }

    setupEventListeners() {
        // Main event listener for form submission (Create/Update)
        document.getElementById('post-form')?.addEventListener('submit', this.handleFormSubmit.bind(this));
        
        // Search and filter listeners
        document.getElementById('search-input')?.addEventListener('input', this.applyFilters.bind(this));
        document.getElementById('category-filter')?.addEventListener('change', this.applyFilters.bind(this));

        // Logout listener
        document.getElementById('logout-btn')?.addEventListener('click', this.logout.bind(this));
        
        // Modal close listener
        document.getElementById('post-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'post-modal') {
                this.closeModal();
            }
        });
    }
    
    applyFilters() {
        const query = document.getElementById('search-input').value.toLowerCase();
        const category = document.getElementById('category-filter').value;
        
        const filteredPosts = this.posts.filter(post => {
            // Note: Must use post.content and post.tags as the local array is the source
            const matchesQuery = post.title.toLowerCase().includes(query) || 
                                 post.content.toLowerCase().includes(query) ||
                                 (Array.isArray(post.tags) ? post.tags.some(tag => tag.toLowerCase().includes(query)) : false);
            const matchesCategory = category === '' || post.category === category;
            
            return matchesQuery && matchesCategory;
        });

        this.renderPosts(filteredPosts);
    }

    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        this.renderPosts(); // Render the full, unfiltered list
    }
    
    openAddModal() {
        this.currentEditId = null;
        const modal = document.getElementById('post-modal');
        const modalTitle = document.getElementById('modal-title');
        
        if (modal && modalTitle) {
            modalTitle.textContent = 'Add New Post';
            this.clearForm();
            modal.classList.add('active');
            
            // Animate modal appearance
            anime({
                targets: modal.querySelector('div:nth-child(1)'), // Target the modal content box
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuart'
            });
        }
    }

    editPost(id) {
        const post = this.posts.find(p => p.id == id);
        if (!post) {
            this.showNotification('Post not found!', 'error');
            return;
        }

        this.currentEditId = id;
        const modal = document.getElementById('post-modal');
        const modalTitle = document.getElementById('modal-title');
        
        if (modal && modalTitle) {
            modalTitle.textContent = `Edit Post: ${post.title}`;
            this.fillForm(post);
            modal.classList.add('active');
            
            // Animate modal appearance
            anime({
                targets: modal.querySelector('div:nth-child(1)'), // Target the modal content box
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuart'
            });
        }
    }
    
    viewPost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;

        // Create a simple modal to view the full post
        const modal = document.createElement('div');
        modal.id = 'view-post-modal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 active';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-xl font-semibold text-gray-900">${post.title}</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="px-6 py-6">
                    <div class="mb-4">
                        <span class="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                            ${post.category}
                        </span>
                        <span class="ml-2 text-sm text-gray-500">By ${post.author || 'N/A'} on ${this.formatDate(post.created_date)}</span>
                    </div>
                    <div class="prose max-w-none">
                        <p class="text-gray-700 leading-relaxed">${post.content}</p>
                    </div>
                    ${post.tags.length > 0 ? `
                        <div class="mt-6">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
                            <div class="flex flex-wrap gap-2">
                                ${Array.isArray(post.tags) ? post.tags.map(tag => `
                                    <span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">${tag}</span>
                                `).join('') : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add close listener for outside click
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'view-post-modal') {
                modal.remove();
            }
        });
        
        // Animate modal appearance
        anime({
            targets: modal.querySelector('div:nth-child(1)'), // Target the modal content box
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    closeModal() {
        const modal = document.getElementById('post-modal');
        if (modal) {
            // Animate modal disappearance
            anime({
                targets: modal.querySelector('div:nth-child(1)'), // Target the modal content box
                scale: [1, 0.8],
                opacity: [1, 0],
                duration: 200,
                easing: 'easeInQuart',
                complete: () => {
                    modal.classList.remove('active');
                }
            });
        }
        this.currentEditId = null;
        this.clearForm();
    }

    confirmDelete(id) {
        const post = this.posts.find(p => p.id == id);
        if (!post) return;

        if (confirm(`Are you sure you want to permanently delete post titled "${post.title}"? This cannot be undone and will delete it from the database.`)) {
            this.deletePost(id);
        }
    }
    
    clearForm() {
        document.getElementById('post-title').value = '';
        document.getElementById('post-category').value = '';
        document.getElementById('post-content').value = '';
        document.getElementById('post-tags').value = '';
    }

    fillForm(post) {
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-category').value = post.category;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-tags').value = Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || '';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate notification
        anime({
            targets: notification,
            translateX: [100, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            anime({
                targets: notification,
                translateX: [0, 100],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeInQuart',
                complete: () => notification.remove()
            });
        }, 3000);
    }

    initParticles() {
        // P5.js particle system for hero background
        const canvas = document.getElementById('particles-canvas');
        // Ensure p5 is loaded and the canvas element exists
        if (!canvas || typeof p5 === 'undefined') return;

        new p5((p) => {
            let particles = [];
            const numParticles = 50;
            let container;

            p.setup = () => {
                container = document.getElementById('particles-canvas').parentElement;
                
                // Ensure the canvas adapts to the parent container
                const canvas = p.createCanvas(container.offsetWidth, 400);
                canvas.parent('particles-canvas');
                
                for (let i = 0; i < numParticles; i++) {
                    particles.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        vx: p.random(-0.5, 0.5),
                        vy: p.random(-0.5, 0.5),
                        size: p.random(2, 6),
                        opacity: p.random(0.1, 0.3)
                    });
                }
            };

            p.draw = () => {
                p.clear();
                
                particles.forEach(particle => {
                    // Update position
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    // Wrap around edges
                    if (particle.x < 0) particle.x = p.width;
                    if (particle.x > p.width) particle.x = 0;
                    if (particle.y < 0) particle.y = p.height;
                    if (particle.y > p.height) particle.y = 0;
                    
                    // Draw particle
                    p.fill(27, 69, 113, particle.opacity * 255); // Primary Blue color with alpha
                    p.noStroke();
                    p.ellipse(particle.x, particle.y, particle.size);
                });
            };

            p.windowResized = () => {
                if (container) {
                    p.resizeCanvas(container.offsetWidth, 400);
                }
            };
        });
    }

    initializeAnimations() {
        // Hero title typing animation (assuming Typed.js is linked)
        if (document.getElementById('hero-title')) {
            new Typed('#hero-title', {
                strings: ['BSSPlus Manager Platform', 'Your Business Command Center', 'Content Management Simplified'],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true,
                showCursor: false
            });
        }

        // Fade in animations for sections 
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => {
            // Apply initial hidden state (if not already in CSS)
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';

            // Use intersection observer to trigger animation
            observer.observe(el);
            
            // Add custom animation for visibility
            if (el.classList.contains('visible')) {
                 anime({
                    targets: el,
                    translateY: [20, 0],
                    opacity: [0, 1],
                    duration: 800,
                    easing: 'easeOutQuart'
                });
            }
        });
        
        // Animate stats cards
        anime({
            targets: '.card-hover',
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutQuart'
        });
    }

}

// Global functions for HTML onclick handlers (needed because they are called directly from HTML attributes)
// We expose the platform instance globally for access from HTML onclicks
function openAddModal() {
    window.platform.openAddModal();
}

function editPost(id) {
    window.platform.editPost(id);
}

function viewPost(id) {
    window.platform.viewPost(id);
}

function confirmDelete(id) {
    window.platform.confirmDelete(id);
}

function closeModal() {
    window.platform.closeModal();
}

function clearFilters() {
    window.platform.clearFilters();
}

// Initialize platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we are on index.html (i.e., we have a dashboard)
    if (document.getElementById('posts-table-body')) {
        window.platform = new BSSPlusPlatform();
    }
});
