// BSSPlus Platform Main JavaScript - API-Driven with Netlify/Supabase
class BSSPlusPlatform {
    constructor() {
        this.posts = [];
        this.currentEditId = null;
        // The endpoint is now handled by the Netlify Redirects file
        this.apiEndpoints = {
            posts: '/api/posts', 
            interactions: '/api/interactions', // <--- NEW API ENDPOINT ADDED
        };
        this.user = {
            name: localStorage.getItem('bssplus_username') || 'Manager',
        };
        this.chartInstance = null;
        this.init();
    }

    async init() {
        this.checkAuthentication();
        await this.loadPosts(); // <--- ASYNCHRONOUSLY LOADS FROM API
        this.setupEventListeners();
        this.initializeAnimations();
        this.renderPosts();
        this.initParticles();
        // this.initializeAPI(); // Placeholder for future complex API init
        await this.loadInteractions(); // Load new interactions data
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
                this.renderStats();
                this.initChart();
                this.showNotification(`Successfully loaded ${this.posts.length} knowledge posts.`, 'success');
            } else {
                 this.showNotification(`Error loading posts: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error in loadPosts:', error);
            this.showNotification(`Failed to connect to API or load posts.`, 'error');
        }
    }

    // R - Read All Interactions (Load data from NEW API)
    async loadInteractions() {
        try {
            const response = await fetch(this.apiEndpoints.interactions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // Update interactions stat
                document.getElementById('stat-total-interactions').textContent = result.data.length;
            } else {
                 console.error(`Error loading interactions: ${result.error}`);
            }
        } catch (error) {
            console.error('Error in loadInteractions:', error);
        }
    }


    // C & U - Create or Update Post
    async savePost(event) {
        event.preventDefault();
        const id = document.getElementById('post-id').value;
        const isUpdate = !!id;
        const method = isUpdate ? 'PUT' : 'POST';
        const endpoint = isUpdate ? `${this.apiEndpoints.posts}/${id}` : this.apiEndpoints.posts;

        const postData = {
            title: document.getElementById('post-title').value,
            category: document.getElementById('post-category').value,
            content: document.getElementById('post-content').value,
            author: this.user.name,
        };

        const saveButton = document.getElementById('save-post-button');
        const originalText = saveButton.textContent;
        saveButton.textContent = isUpdate ? 'Updating...' : 'Creating...';
        saveButton.disabled = true;

        this.showNotification(isUpdate ? "Updating post..." : "Creating new post...", 'info');

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                await this.loadPosts(); // Reload data
                this.renderPosts();
                this.closeModal();
                this.showNotification(`Post successfully ${isUpdate ? 'updated' : 'created'}.`, 'success');
            } else {
                this.showNotification(`API Error: ${result.error}`, 'error');
            }

        } catch (error) {
            console.error('Save Post Error:', error);
            this.showNotification(`Failed to save post: ${error.message}`, 'error');
        } finally {
            saveButton.textContent = originalText;
            saveButton.disabled = false;
        }
    }

    // D - Delete Post
    async deletePost() {
        const id = this.currentEditId;
        if (!id) return;

        this.showNotification("Deleting post...", 'warning');

        try {
            const response = await fetch(`${this.apiEndpoints.posts}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();

            if (result.success) {
                await this.loadPosts(); // Reload data
                this.renderPosts();
                this.closeModal();
                this.showNotification(`Post ${id} deleted permanently.`, 'success');
            } else {
                this.showNotification(`API Error: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Delete Post Error:', error);
            this.showNotification(`Failed to delete post: ${error.message}`, 'error');
        }
    }

    // ------------------------------------------------------------------
    // RENDERING AND UI LOGIC
    // ------------------------------------------------------------------

    renderPosts(filterText = '') {
        const body = document.getElementById('posts-table-body');
        body.innerHTML = '';
        
        let filteredPosts = this.posts;

        if (filterText) {
            filterText = filterText.toLowerCase();
            filteredPosts = this.posts.filter(post => 
                post.title.toLowerCase().includes(filterText) || 
                (post.content && post.content.toLowerCase().includes(filterText))
            );
            document.getElementById('clear-filters-btn').disabled = false;
        } else {
             document.getElementById('clear-filters-btn').disabled = true;
        }

        document.getElementById('posts-count').textContent = `Showing ${filteredPosts.length} results.`;

        if (filteredPosts.length === 0) {
            body.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No posts found matching your criteria.</td></tr>';
            return;
        }

        filteredPosts.forEach(post => {
            const date = new Date(post.created_date || post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            
            const row = `
                <tr class="transition-colors duration-200">
                    <td class="p-3 font-semibold text-gray-200 truncate max-w-xs">${post.title}</td>
                    <td class="p-3 hidden sm:table-cell text-gray-400">${post.category || 'General'}</td>
                    <td class="p-3 hidden md:table-cell text-gray-400">${post.author || 'System'}</td>
                    <td class="p-3 hidden md:table-cell text-gray-400">${date}</td>
                    <td class="p-3 text-right space-x-2">
                        <button onclick="viewPost('${post.id}')" class="text-secondary-green hover:text-white transition-colors p-1 rounded-full">
                             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                        <button onclick="editPost('${post.id}')" class="text-primary-blue hover:text-white transition-colors p-1 rounded-full">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-6-1.834L17.834 5M15 4l2 2-6.5 6.5-2 2L9 15l2-2 6.5-6.5z"></path></svg>
                        </button>
                        <button onclick="confirmDelete('${post.id}')" class="text-red-500 hover:text-white transition-colors p-1 rounded-full">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>
            `;
            body.insertAdjacentHTML('beforeend', row);
        });
    }

    renderStats() {
        // Stat 1: Total Posts
        document.getElementById('stat-total-posts').textContent = this.posts.length;

        // Stat 3: Top Category
        const categoryCounts = this.posts.reduce((acc, post) => {
            const category = post.category || 'General';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        const topCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0];
        document.getElementById('stat-top-category').textContent = topCategory ? `${topCategory[0]} (${topCategory[1]})` : 'N/A';
    }

    // ------------------------------------------------------------------
    // MODAL HANDLERS
    // ------------------------------------------------------------------

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            this.animateModalOpen(modal);
        }
    }

    closeModal() {
        const modals = ['post-modal', 'view-modal', 'delete-confirm-modal'];
        modals.forEach(id => {
            const modal = document.getElementById(id);
            if (modal && !modal.classList.contains('hidden')) {
                this.animateModalClose(modal, () => modal.classList.add('hidden'));
            }
        });
        this.currentEditId = null;
        document.getElementById('post-form').reset(); // Clear form on close
    }

    openAddModal() {
        document.getElementById('modal-title').textContent = 'Create New Post';
        document.getElementById('save-post-button').textContent = 'Create Post';
        document.getElementById('post-id').value = ''; // Clear ID for new post
        document.getElementById('post-form').reset(); 
        this.openModal('post-modal');
    }

    editPost(id) {
        const post = this.posts.find(p => p.id == id);
        if (post) {
            document.getElementById('modal-title').textContent = 'Edit Post';
            document.getElementById('save-post-button').textContent = 'Update Post';
            document.getElementById('post-id').value = post.id;
            document.getElementById('post-title').value = post.title;
            document.getElementById('post-category').value = post.category || 'General';
            document.getElementById('post-content').value = post.content;
            this.currentEditId = id;
            this.openModal('post-modal');
        } else {
            this.showNotification('Post not found.', 'error');
        }
    }

    viewPost(id) {
        const post = this.posts.find(p => p.id == id);
        if (post) {
            document.getElementById('view-title').textContent = post.title;
            document.getElementById('view-author').textContent = `By: ${post.author || 'System'}`;
            const date = new Date(post.created_date || post.created_at).toLocaleString();
            document.getElementById('view-date').textContent = `Created: ${date}`;
            
            // Simple markdown-like line break conversion for display
            const contentHTML = post.content ? post.content.replace(/\n/g, '<br>') : 'No content available.';
            document.getElementById('view-content').innerHTML = contentHTML;
            
            this.openModal('view-modal');
        } else {
            this.showNotification('Post not found.', 'error');
        }
    }

    confirmDelete(id) {
        this.currentEditId = id;
        this.openModal('delete-confirm-modal');
    }

    // ------------------------------------------------------------------
    // UTILITIES AND EVENT LISTENERS
    // ------------------------------------------------------------------

    setupEventListeners() {
        // Form submission (Create/Update)
        document.getElementById('post-form').addEventListener('submit', (e) => this.savePost(e));

        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.renderPosts(e.target.value);
        });

        // Add keyboard escape to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    
    clearFilters() {
        document.getElementById('search-input').value = '';
        this.renderPosts('');
    }

    checkAuthentication() {
        const statusElement = document.getElementById('auth-status');
        if (localStorage.getItem('bssplus_logged_in') === 'true') {
            statusElement.textContent = `Welcome, ${this.user.name}`;
            statusElement.classList.remove('text-red-400');
            statusElement.classList.add('text-secondary-green');
        } else {
            statusElement.textContent = 'Logged Out';
            statusElement.classList.remove('text-secondary-green');
            statusElement.classList.add('text-red-400');
        }
    }

    logout() {
        localStorage.removeItem('bssplus_logged_in');
        localStorage.removeItem('bssplus_username');
        window.location.href = 'login.html';
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const colorMap = {
            info: 'bg-primary-blue border-blue-400',
            success: 'bg-secondary-green border-green-400',
            warning: 'bg-yellow-600 border-yellow-400',
            error: 'bg-red-600 border-red-400'
        };

        const notification = document.createElement('div');
        notification.className = `p-3 rounded-lg shadow-xl border-l-4 ${colorMap[type]} text-white text-sm opacity-0 transform translate-x-full max-w-xs`;
        notification.textContent = message;
        container.appendChild(notification);
        
        anime({ targets: notification, translateX: [100, 0], opacity: [0, 1], duration: 300, easing: 'easeOutQuart' });
        
        setTimeout(() => {
            anime({ targets: notification, translateX: [0, 100], opacity: [1, 0], duration: 300, easing: 'easeInQuart', complete: () => notification.remove() });
        }, 3000);
    }
    
    // ------------------------------------------------------------------
    // ANIMATION & VISUALIZATION
    // ------------------------------------------------------------------

    initChart() {
        const chartDom = document.getElementById('post-activity-chart');
        if (!chartDom || this.posts.length === 0) return;

        if (this.chartInstance) {
            this.chartInstance.dispose();
        }
        this.chartInstance = echarts.init(chartDom, 'dark'); // Initialize in dark theme

        // Simple aggregation: group posts by creation month
        const monthlyData = this.posts.reduce((acc, post) => {
            const date = new Date(post.created_date || post.created_at);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[monthYear] = (acc[monthYear] || 0) + 1;
            return acc;
        }, {});

        // Sort data chronologically and extract arrays for ECharts
        const sortedKeys = Object.keys(monthlyData).sort();
        const dates = sortedKeys.map(key => key);
        const counts = sortedKeys.map(key => monthlyData[key]);

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: { color: var(--text-muted) }
            },
            yAxis: {
                type: 'value',
                axisLabel: { color: var(--text-muted) },
                splitLine: { lineStyle: { color: '#313642' } }
            },
            series: [
                {
                    name: 'New Posts',
                    type: 'line',
                    smooth: true,
                    data: counts,
                    lineStyle: { color: '#10B981' },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.5)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
                        ])
                    },
                    itemStyle: { color: '#10B981' }
                }
            ],
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            }
        };

        this.chartInstance.setOption(option);

        // Handle resize
        window.addEventListener('resize', () => {
            if (this.chartInstance) this.chartInstance.resize();
        });
    }

    initParticles() {
        // p5.js sketch for subtle background particles
        const container = document.getElementById('p5-container');
        if (!container) return;

        const sketch = (p) => {
            let particles = [];
            const numParticles = p.width < 768 ? 30 : 50; // Fewer particles on mobile

            p.setup = () => {
                p.createCanvas(container.offsetWidth, container.offsetHeight).parent('p5-container');
                for (let i = 0; i < numParticles; i++) {
                    particles.push(new Particle(p));
                }
            };

            p.draw = () => {
                p.clear(); // Use clear to maintain background transparency
                p.fill(p.color(27, 69, 113, 50)); // Primary Blue with transparency
                p.noStroke();
                
                for (let i = 0; i < particles.length; i++) {
                    particles[i].update();
                    particles[i].display();
                    particles[i].checkEdges();
                }
            };

            p.windowResized = () => {
                p.resizeCanvas(container.offsetWidth, container.offsetHeight);
            };
        };
        
        // Particle class definition within the sketch context
        class Particle {
            constructor(p) {
                this.p = p;
                this.position = p.createVector(p.random(p.width), p.random(p.height));
                this.velocity = p.createVector(p.random(-0.5, 0.5), p.random(-0.5, 0.5));
                this.size = p.random(2, 5);
            }

            update() {
                this.position.add(this.velocity);
            }

            display() {
                this.p.ellipse(this.position.x, this.position.y, this.size);
            }

            checkEdges() {
                if (this.position.x > this.p.width || this.position.x < 0) this.velocity.x *= -1;
                if (this.position.y > this.p.height || this.position.y < 0) this.velocity.y *= -1;
            }
        }
        
        new p5(sketch);
    }

    initializeAnimations() {
        // Animate the main page content on load (after particles are init)
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.classList.add('opacity-0', 'translate-y-4');
            anime({
                targets: mainContent,
                translateY: [20, 0],
                opacity: [0, 1],
                duration: 1000,
                easing: 'easeOutQuart',
                delay: 200,
                complete: () => {
                    mainContent.classList.remove('opacity-0', 'translate-y-4');
                }
            });
        }
    }

    animateModalOpen(modal) {
        anime({
            targets: modal.querySelector('div:not(.modal)'),
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    animateModalClose(modal, callback) {
        anime({
            targets: modal.querySelector('div:not(.modal)'),
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInQuart',
            complete: callback
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

