// BSSPlus Platform Main JavaScript
class BSSPlusPlatform {
    constructor() {
        this.posts = [];
        this.currentEditId = null;
        this.apiEndpoints = {
            posts: '/api/posts',
            post: '/api/post',
            search: '/api/search'
        };
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadSampleData();
        this.setupEventListeners();
        this.initializeAnimations();
        this.renderPosts();
        this.initParticles();
        this.initializeAPI();
    }

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

    initializeAPI() {
        // Create API endpoints for external access
        window.BSSPlusAPI = {
            getAllPosts: () => this.getAllPosts(),
            getPost: (id) => this.getPost(id),
            searchPosts: (query) => this.searchPosts(query),
            createPost: (data) => this.createPost(data),
            updatePost: (id, data) => this.updatePost(id, data),
            deletePost: (id) => this.deletePost(id),
            getPostsByCategory: (category) => this.getPostsByCategory(category)
        };
    }

    // API Methods
    getAllPosts() {
        return {
            success: true,
            data: this.posts,
            count: this.posts.length,
            timestamp: new Date().toISOString()
        };
    }

    getPost(id) {
        const post = this.posts.find(p => p.id === parseInt(id));
        if (post) {
            return {
                success: true,
                data: post,
                timestamp: new Date().toISOString()
            };
        }
        return {
            success: false,
            error: 'Post not found',
            timestamp: new Date().toISOString()
        };
    }

    searchPosts(query) {
        const results = this.posts.filter(post => 
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        return {
            success: true,
            data: results,
            count: results.length,
            query: query,
            timestamp: new Date().toISOString()
        };
    }

    getPostsByCategory(category) {
        const results = this.posts.filter(post => post.category === category);
        return {
            success: true,
            data: results,
            count: results.length,
            category: category,
            timestamp: new Date().toISOString()
        };
    }

    createPost(data) {
        const newPost = {
            id: Date.now(),
            ...data,
            author: localStorage.getItem('bssplus_username') || 'Manager',
            createdDate: new Date().toISOString().split('T')[0],
            modifiedDate: new Date().toISOString().split('T')[0],
            status: 'published'
        };
        
        this.posts.unshift(newPost);
        localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
        this.renderPosts();
        
        return {
            success: true,
            data: newPost,
            message: 'Post created successfully',
            timestamp: new Date().toISOString()
        };
    }

    updatePost(id, data) {
        const postIndex = this.posts.findIndex(p => p.id === parseInt(id));
        if (postIndex !== -1) {
            this.posts[postIndex] = {
                ...this.posts[postIndex],
                ...data,
                modifiedDate: new Date().toISOString().split('T')[0]
            };
            localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
            this.renderPosts();
            
            return {
                success: true,
                data: this.posts[postIndex],
                message: 'Post updated successfully',
                timestamp: new Date().toISOString()
            };
        }
        
        return {
            success: false,
            error: 'Post not found',
            timestamp: new Date().toISOString()
        };
    }

    deletePost(id) {
        const postIndex = this.posts.findIndex(p => p.id === parseInt(id));
        if (postIndex !== -1) {
            const deletedPost = this.posts[postIndex];
            this.posts = this.posts.filter(p => p.id !== parseInt(id));
            localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
            this.renderPosts();
            
            return {
                success: true,
                data: deletedPost,
                message: 'Post deleted successfully',
                timestamp: new Date().toISOString()
            };
        }
        
        return {
            success: false,
            error: 'Post not found',
            timestamp: new Date().toISOString()
        };
    }

    loadSampleData() {
        this.posts = [
            {
                id: 1,
                title: "Welcome to BSSPlus Platform",
                category: "announcements",
                content: "Welcome to our new content management platform! This system allows you to create, manage, and organize all your business content efficiently. The platform includes advanced search capabilities, AI-powered chatbot assistance, and comprehensive analytics to help you make data-driven decisions.",
                author: "System Administrator",
                createdDate: "2024-10-15",
                modifiedDate: "2024-10-15",
                tags: ["welcome", "platform", "introduction"],
                status: "published"
            },
            {
                id: 2,
                title: "Digital Transformation Strategy Guidelines",
                category: "guidelines",
                content: "Comprehensive guide to implementing digital transformation in your organization. This document covers key strategies, best practices, and step-by-step approaches to modernizing your business processes. Learn about change management, technology integration, and measuring success metrics.",
                author: "Digital Strategy Team",
                createdDate: "2024-10-10",
                modifiedDate: "2024-10-12",
                tags: ["digital transformation", "strategy", "guidelines"],
                status: "published"
            },
            {
                id: 3,
                title: "ESPA Programs Update 2024",
                category: "updates",
                content: "Latest updates on ESPA (European Structural and Investment Funds) programs available for Greek businesses. This post contains important information about new funding opportunities, application deadlines, and eligibility criteria for various business development programs.",
                author: "Funding Advisory Team",
                createdDate: "2024-10-08",
                modifiedDate: "2024-10-08",
                tags: ["ESPA", "funding", "programs", "2024"],
                status: "published"
            },
            {
                id: 4,
                title: "Financial Advisory Services Overview",
                category: "training",
                content: "Detailed overview of our financial advisory services including tax planning, financial analysis, investment strategies, and risk management. This training material helps our team understand the full scope of services we offer to clients.",
                author: "Financial Advisory Team",
                createdDate: "2024-10-05",
                modifiedDate: "2024-10-05",
                tags: ["financial advisory", "services", "training"],
                status: "published"
            },
            {
                id: 5,
                title: "Company Policy Updates",
                category: "policies",
                content: "Recent updates to company policies including remote work guidelines, data security protocols, and client communication standards. All team members should review these updates and ensure compliance with the new procedures.",
                author: "HR Department",
                createdDate: "2024-10-01",
                modifiedDate: "2024-10-01",
                tags: ["policies", "updates", "compliance"],
                status: "published"
            },
            {
                id: 6,
                title: "Business Consulting Best Practices",
                category: "guidelines",
                content: "Essential best practices for business consulting including client relationship management, project delivery methodologies, and quality assurance processes. This guide serves as a reference for maintaining high service standards.",
                author: "Consulting Excellence Team",
                createdDate: "2024-09-28",
                modifiedDate: "2024-09-30",
                tags: ["consulting", "best practices", "quality"],
                status: "published"
            }
        ];
        
        // Save to localStorage
        localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        }

        // Post form submission
        const postForm = document.getElementById('post-form');
        if (postForm) {
            postForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Modal close on outside click
        const modal = document.getElementById('post-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    }

    initializeAnimations() {
        // Hero title typing animation
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
            observer.observe(el);
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

    initParticles() {
        // P5.js particle system for hero background
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;

        new p5((p) => {
            let particles = [];
            const numParticles = 50;

            p.setup = () => {
                const canvas = p.createCanvas(window.innerWidth, 400);
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
                    p.fill(27, 69, 113, particle.opacity * 255);
                    p.noStroke();
                    p.ellipse(particle.x, particle.y, particle.size);
                });
            };

            p.windowResized = () => {
                p.resizeCanvas(window.innerWidth, 400);
            };
        });
    }

    renderPosts(postsToRender = this.posts) {
        const tbody = document.getElementById('posts-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (postsToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        No posts found. Create your first post to get started!
                    </td>
                </tr>
            `;
            return;
        }

        postsToRender.forEach(post => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            
            const categoryColors = {
                announcements: 'bg-blue-100 text-blue-800',
                guidelines: 'bg-green-100 text-green-800',
                updates: 'bg-yellow-100 text-yellow-800',
                training: 'bg-purple-100 text-purple-800',
                policies: 'bg-red-100 text-red-800'
            };

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
                <td class="px-6 py-4 text-sm text-gray-900">${post.author}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${this.formatDate(post.createdDate)}</td>
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
                        <button onclick="platform.deletePost(${post.id})" 
                                class="text-red-600 hover:text-red-900 text-sm font-medium">
                            Delete
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        // Update total posts count
        const totalPostsElement = document.getElementById('total-posts');
        if (totalPostsElement) {
            totalPostsElement.textContent = postsToRender.length;
        }
    }

    handleSearch(query) {
        const filteredPosts = this.posts.filter(post => 
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content.toLowerCase().includes(query.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderPosts(filteredPosts);
    }

    handleCategoryFilter(category) {
        if (!category) {
            this.renderPosts();
            return;
        }
        
        const filteredPosts = this.posts.filter(post => post.category === category);
        this.renderPosts(filteredPosts);
    }

    clearFilters() {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        
        this.renderPosts();
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
                targets: modal.querySelector('.bg-white'),
                scale: [0.8, 1],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuart'
            });
        }
    }

    editPost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;

        this.currentEditId = id;
        const modal = document.getElementById('post-modal');
        const modalTitle = document.getElementById('modal-title');
        
        if (modal && modalTitle) {
            modalTitle.textContent = 'Edit Post';
            this.fillForm(post);
            modal.classList.add('active');
            
            // Animate modal appearance
            anime({
                targets: modal.querySelector('.bg-white'),
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
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50 active';
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
                        <span class="ml-2 text-sm text-gray-500">By ${post.author} on ${this.formatDate(post.createdDate)}</span>
                    </div>
                    <div class="prose max-w-none">
                        <p class="text-gray-700 leading-relaxed">${post.content}</p>
                    </div>
                    ${post.tags.length > 0 ? `
                        <div class="mt-6">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
                            <div class="flex flex-wrap gap-2">
                                ${post.tags.map(tag => `
                                    <span class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">${tag}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate modal appearance
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    deletePost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;

        if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
            this.posts = this.posts.filter(p => p.id !== id);
            localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
            this.renderPosts();
            
            // Show success message
            this.showNotification('Post deleted successfully!', 'success');
        }
    }

    closeModal() {
        const modal = document.getElementById('post-modal');
        if (modal) {
            // Animate modal disappearance
            anime({
                targets: modal.querySelector('.bg-white'),
                scale: [1, 0.8],
                opacity: [1, 0],
                duration: 200,
                easing: 'easeInQuart',
                complete: () => {
                    modal.classList.remove('active');
                }
            });
        }
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('post-title').value,
            category: document.getElementById('post-category').value,
            content: document.getElementById('post-content').value,
            tags: document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        if (this.currentEditId) {
            // Edit existing post
            const postIndex = this.posts.findIndex(p => p.id === this.currentEditId);
            if (postIndex !== -1) {
                this.posts[postIndex] = {
                    ...this.posts[postIndex],
                    ...formData,
                    modifiedDate: new Date().toISOString().split('T')[0]
                };
                this.showNotification('Post updated successfully!', 'success');
            }
        } else {
            // Add new post
            const newPost = {
                id: Date.now(),
                ...formData,
                author: 'Manager',
                createdDate: new Date().toISOString().split('T')[0],
                modifiedDate: new Date().toISOString().split('T')[0],
                status: 'published'
            };
            this.posts.unshift(newPost);
            this.showNotification('Post created successfully!', 'success');
        }

        localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
        this.renderPosts();
        this.closeModal();
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
        document.getElementById('post-tags').value = post.tags.join(', ');
    }

    formatDate(dateString) {
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
}

// Global functions for HTML onclick handlers
function openAddModal() {
    platform.openAddModal();
}

function closeModal() {
    platform.closeModal();
}

function clearFilters() {
    platform.clearFilters();
}

// Initialize platform when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.platform = new BSSPlusPlatform();
});