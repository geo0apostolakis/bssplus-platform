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
        this.loadPosts();
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
        this.savePosts();
        this.renderPosts();
        this.showNotification('Post created successfully!', 'success');
        
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
            this.savePosts();
            this.renderPosts();
            this.showNotification('Post updated successfully!', 'success');
            
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
            this.savePosts();
            this.renderPosts();
            this.showNotification('Post deleted.', 'info');
            
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

    // Data Management
    loadSampleData() {
        return [
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
    }

    loadPosts() {
        const stored = localStorage.getItem('bssplus_posts');
        if (stored) {
            this.posts = JSON.parse(stored);
        } else {
            this.posts = this.loadSampleData();
            this.savePosts();
        }
    }

    savePosts() {
        localStorage.setItem('bssplus_posts', JSON.stringify(this.posts));
    }
    
    // UI/Event Handlers

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
    
    handleSearch(query) {
        this.renderPosts(query, document.getElementById('category-filter').value);
    }

    handleCategoryFilter(category) {
        this.renderPosts(document.getElementById('search-input').value, category);
    }

    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = 'all';
        this.renderPosts();
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('post-title').value.trim();
        const category = document.getElementById('post-category').value;
        const content = document.getElementById('post-content').value.trim();
        const tags = document.getElementById('post-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        const postData = { title, category, content, tags };
        
        if (this.currentEditId) {
            this.updatePost(this.currentEditId, postData);
        } else {
            this.createPost(postData);
        }

        this.closeModal();
    }

    openAddModal() {
        this.currentEditId = null; // Resets for a new post
        document.getElementById('modal-title').textContent = 'Add New Post';
        document.getElementById('post-form').reset(); // Clear old form data
        document.getElementById('post-modal').classList.remove('hidden');
    }

    openEditModal(id) {
        const post = this.getPost(id).data;
        if (!post) return;

        this.currentEditId = id;
        document.getElementById('modal-title').textContent = 'Edit Post';
        
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-category').value = post.category;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-tags').value = post.tags.join(', ');

        document.getElementById('post-modal').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('post-modal').classList.add('hidden');
        this.currentEditId = null;
    }

    confirmDelete(id) {
        if (confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            this.deletePost(id);
        }
    }

    renderPosts(searchQuery = '', categoryFilter = 'all') {
        let filteredPosts = this.posts;

        // Apply search filter
        if (searchQuery) {
            filteredPosts = this.searchPosts(searchQuery).data;
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.category === categoryFilter);
        }

        const postsList = document.getElementById('posts-list');
        const emptyState = document.getElementById('empty-state');
        postsList.innerHTML = '';
        
        if (filteredPosts.length === 0) {
            emptyState.classList.remove('hidden');
            document.getElementById('total-posts').textContent = this.posts.length;
            this.updateStats(filteredPosts);
            return;
        } else {
            emptyState.classList.add('hidden');
        }

        filteredPosts.forEach(post => {
            const tagsHtml = post.tags.map(tag => 
                `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${tag}</span>`
            ).join('');

            const postElement = document.createElement('div');
            postElement.className = 'bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow';
            postElement.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-xl font-bold text-gray-900">${post.title}</h3>
                    <div class="flex space-x-2">
                        <button onclick="platform.openEditModal(${post.id})" title="Edit Post"
                                class="text-blue-600 hover:text-blue-800 transition-colors">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                        <button onclick="platform.confirmDelete(${post.id})" title="Delete Post"
                                class="text-red-600 hover:text-red-800 transition-colors">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="mb-3">
                    <span class="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${this.getCategoryClass(post.category)}">
                        ${this.capitalize(post.category)}
                    </span>
                </div>
                <p class="text-gray-700 mb-4 line-clamp-3">${post.content}</p>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${tagsHtml}
                </div>
                <div class="text-xs text-gray-500 border-t pt-3">
                    <p>Author: ${post.author}</p>
                    <p>Created: ${this.formatDate(post.createdDate)} | Last Modified: ${this.formatDate(post.modifiedDate)}</p>
                </div>
            `;
            postsList.appendChild(postElement);
        });
        
        this.updateStats(this.posts);
    }
    
    updateStats(allPosts) {
        document.getElementById('total-posts').textContent = allPosts.length;
        document.getElementById('published-posts').textContent = allPosts.filter(p => p.status === 'published').length;
        document.getElementById('draft-posts').textContent = allPosts.filter(p => p.status === 'draft').length;
        
        const categories = new Set(allPosts.map(p => p.category));
        document.getElementById('total-categories').textContent = categories.size;
        
        this.initCharts(allPosts);
    }

    // Utility & Style Methods

    getCategoryClass(category) {
        switch (category) {
            case 'announcements': return 'bg-blue-100 text-blue-800';
            case 'guidelines': return 'bg-green-100 text-green-800';
            case 'updates': return 'bg-yellow-100 text-yellow-800';
            case 'training': return 'bg-indigo-100 text-indigo-800';
            case 'policies': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    capitalize(s) {
        if (typeof s !== 'string') return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Animations and Visualizations
    
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
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => { observer.observe(el); });

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
            const linkDistance = 100;

            p.setup = () => {
                const parent = canvas.parentElement;
                p.createCanvas(parent.clientWidth, parent.clientHeight).parent(canvas);
                p.noStroke();
                for (let i = 0; i < numParticles; i++) {
                    particles.push(new Particle(p));
                }
            };

            p.draw = () => {
                p.clear();
                p.background(0, 0); // Transparent background

                for (let i = 0; i < particles.length; i++) {
                    particles[i].update();
                    particles[i].draw();

                    // Connect particles
                    for (let j = i + 1; j < particles.length; j++) {
                        let d = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        if (d < linkDistance) {
                            let alpha = p.map(d, 0, linkDistance, 0.2, 0);
                            p.stroke(27, 69, 113, alpha * 255); // Primary Blue with transparency
                            p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                            p.noStroke();
                        }
                    }
                }
            };

            p.windowResized = () => {
                const parent = canvas.parentElement;
                p.resizeCanvas(parent.clientWidth, parent.clientHeight);
            };

        }, canvas.id); 

        class Particle {
            constructor(p) {
                this.p = p;
                this.x = p.random(p.width);
                this.y = p.random(p.height);
                this.xSpeed = p.random(-0.5, 0.5);
                this.ySpeed = p.random(-0.5, 0.5);
                this.radius = p.random(1, 3);
            }

            update() {
                this.x += this.xSpeed;
                this.y += this.ySpeed;

                if (this.x < 0 || this.x > this.p.width) this.xSpeed *= -1;
                if (this.y < 0 || this.y > this.p.height) this.ySpeed *= -1;
            }

            draw() {
                this.p.fill(16, 185, 129, 150); // Secondary Green with transparency
                this.p.ellipse(this.x, this.y, this.radius * 2);
            }
        }
    }

    initCharts(posts) {
        // Post Distribution Pie Chart
        const categoryCounts = posts.reduce((acc, post) => {
            acc[post.category] = (acc[post.category] || 0) + 1;
            return acc;
        }, {});

        const pieData = Object.keys(categoryCounts).map(key => ({
            value: categoryCounts[key],
            name: this.capitalize(key)
        }));

        const pieChart = echarts.init(document.getElementById('chart-pie'));
        const pieOptions = {
            tooltip: { trigger: 'item' },
            legend: {
                orient: 'vertical',
                left: 'left',
                data: pieData.map(d => d.name)
            },
            series: [{
                name: 'Posts',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['60%', '50%'],
                data: pieData,
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
        pieChart.setOption(pieOptions);
        
        // Simple Line Chart (Mock data for trend)
        const lineChart = echarts.init(document.getElementById('chart-line'));
        const lineOptions = {
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
            },
            yAxis: { type: 'value' },
            series: [{
                name: 'New Posts',
                type: 'line',
                data: [3, 5, 4, 7, 6, 8],
                smooth: true,
                itemStyle: { color: '#1B4571' },
                lineStyle: { color: '#1B4571' }
            }]
        };
        lineChart.setOption(lineOptions);

        // Responsive charts
        window.addEventListener('resize', () => {
            pieChart.resize();
            lineChart.resize();
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
// These must be available globally for the HTML 'onclick' to find them.
function openAddModal() {
    window.platform.openAddModal();
}

function closeModal() {
    window.platform.closeModal();
}

function clearFilters() {
    window.platform.clearFilters();
}

// Initialize platform when DOM is loaded
let platform;
document.addEventListener('DOMContentLoaded', () => {
    platform = new BSSPlusPlatform();
    // Make the platform instance globally accessible for direct API calls (e.g., from console)
    window.platform = platform; 
});
