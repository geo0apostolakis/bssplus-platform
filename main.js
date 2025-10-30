// AIChatbotPlatform Main JavaScript - API-Driven with Netlify/Supabase
class AIChatbotPlatform {
    constructor() {
        this.interactions = []; // <-- Renamed data store
        this.currentEditId = null;
        // The endpoint is now pointing to the new consolidated API path
        this.apiEndpoints = {
            // Key remains 'posts' for convenient internal access, but the URL is now correct
            posts: '/api/interactions', 
        };
        this.init();
    }

    async init() {
        this.checkAuthentication();
        await this.loadInteractions(); // <-- Renamed function call
        this.setupEventListeners();
        this.initializeAnimations();
        this.renderInteractions(); // <-- Renamed function call
        this.initParticles();
        this.initializeAPI();
    }
    
    // ------------------------------------------------------------------
    // API-DRIVEN CRUD METHODS (Supabase via Netlify Function)
    // ------------------------------------------------------------------

    // R - Read All Interactions (Load data from API)
    async loadInteractions() { // <-- Renamed function
        this.showNotification("Loading chat interactions...", 'info');
        try {
            const response = await fetch(this.apiEndpoints.posts);

            if (!response.ok) {
                // If the response status is not 200, throw an error
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Sort interactions by created_date, descending
                this.interactions = result.data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

                this.renderInteractions(); // <-- Renamed function call
                this.updateStats();
                this.updateTopicChart();
                this.showNotification(`Successfully loaded ${this.interactions.length} interactions.`, 'success');
            } else {
                throw new Error(result.error || "Failed to load interactions data.");
            }
        } catch (error) {
            console.error("Error loading interactions:", error);
            this.showNotification("Error connecting to API. Check console.", 'error');
        }
    }
    
    // R - Read Single Interaction
    getInteractionById(id) {
        return this.interactions.find(i => i.id == id); // <-- Uses this.interactions
    }

    // C/U - Create or Update Interaction
    async saveInteraction(event) { // <-- Renamed function
        event.preventDefault();

        const id = document.getElementById('post-id').value;
        const isNew = !id;
        const method = isNew ? 'POST' : 'PUT';
        let url = this.apiEndpoints.posts;

        const interactionData = {
            title: document.getElementById('post-title').value,
            content: document.getElementById('post-body').value,
            tags: document.getElementById('post-tags').value,
            // Assuming the server handles validation and dates
        };
        
        if (!isNew) {
            url = `${url}/${id}`;
            interactionData.id = id;
        }

        this.showNotification(`${isNew ? 'Saving' : 'Updating'} interaction...`, 'info');
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(interactionData),
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`Interaction ${isNew ? 'created' : 'updated'} successfully!`, 'success');
                this.closeModal();
                await this.loadInteractions(); // <-- Renamed function call
            } else {
                throw new Error(result.error || `Failed to ${isNew ? 'create' : 'update'} interaction.`);
            }

        } catch (error) {
            console.error("Error saving interaction:", error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // D - Delete Interaction
    async deleteInteraction() { // <-- Renamed function
        this.showNotification("Deleting interaction...", 'info');
        // ID is retrieved from the button data attribute set by confirmDeleteInteraction()
        const id = document.getElementById('confirm-delete-button').dataset.id;
        
        try {
            const response = await fetch(`${this.apiEndpoints.posts}/${id}`, {
                method: 'DELETE',
            });
            
            const result = await response.json();

            if (result.success) {
                this.showNotification("Interaction deleted successfully.", 'success');
                this.closeModal();
                await this.loadInteractions(); // <-- Renamed function call
            } else {
                throw new Error(result.error || "Failed to delete interaction.");
            }

        } catch (error) {
            console.error("Error deleting interaction:", error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // ------------------------------------------------------------------
    // UI METHODS
    // ------------------------------------------------------------------

    // Render the table rows
    renderInteractions() { // <-- Renamed function
        const tableBody = document.getElementById('posts-table-body'); // Retaining HTML ID for now
        if (!tableBody) return; 

        tableBody.innerHTML = ''; // Clear existing rows
        
        const filteredInteractions = this.interactions
            .filter(interaction => this.filterLogic(interaction))
            .filter(interaction => this.searchLogic(interaction));

        if (filteredInteractions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-12 text-gray-500 text-lg">No interactions found matching your criteria.</td></tr>`;
            return;
        }

        filteredInteractions.forEach(interaction => {
            const row = `
                <tr class="hover:bg-gray-700/50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${interaction.title}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">${interaction.author || 'Admin'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden md:table-cell">
                        ${interaction.tags ? interaction.tags.split(',').map(tag => `<span class="inline-block bg-gray-600/50 text-xs font-semibold px-2 py-0.5 rounded-full mr-1">${tag.trim()}</span>`).join('') : '<span class="text-gray-500">N/A</span>'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden lg:table-cell">${new Date(interaction.created_date).toLocaleDateString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <!-- Actions use globally exposed functions -->
                        <button
                            onclick="viewInteraction(${interaction.id})" 
                            class="text-indigo-400 hover:text-indigo-300 transition-colors p-1"
                            title="View Interaction">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>
                        <button
                            onclick="editInteraction(${interaction.id})" 
                            class="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                            title="Edit Interaction">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-7-12.293a1 1 0 00-1.414 0L4 12v3h3l7.707-7.707a1 1 0 000-1.414z"></path></svg>
                        </button>
                        <button
                            onclick="confirmDeleteInteraction(${interaction.id})" 
                            class="text-red-400 hover:text-red-300 transition-colors p-1"
                            title="Delete Interaction">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // Populate modal for editing an existing post
    editInteraction(id) { // <-- Renamed function
        this.currentEditId = id;
        const modal = document.getElementById('add-edit-modal');
        const interaction = this.getInteractionById(id);
        
        if (interaction) {
            document.getElementById('modal-title').textContent = 'Edit Chat Interaction';
            document.getElementById('post-id').value = interaction.id;
            document.getElementById('post-title').value = interaction.title;
            document.getElementById('post-body').value = interaction.content;
            document.getElementById('post-tags').value = interaction.tags; 
            modal.classList.remove('hidden');
            this.animateModalOpen(modal);
        }
    }

    // Populate modal for viewing an existing post
    viewInteraction(id) { // <-- Renamed function
        const modal = document.getElementById('view-post-modal');
        const interaction = this.getInteractionById(id);

        if (interaction) {
            document.getElementById('view-post-title').textContent = interaction.title;
            document.getElementById('view-post-body').innerHTML = this.formatInteractionBody(interaction.content);
            document.getElementById('view-post-date').textContent = `Date: ${new Date(interaction.created_date).toLocaleDateString()}`;
            document.getElementById('view-post-author').textContent = `User: ${interaction.author || 'Admin'}`;

            const tagsContainer = document.getElementById('view-post-tags');
            tagsContainer.innerHTML = ''; // Clear previous tags
            if (interaction.tags) {
                const tags = interaction.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                tags.forEach(tag => {
                    tagsContainer.innerHTML += `<span class="inline-block bg-indigo-900/50 text-indigo-300 text-xs font-semibold mr-2 px-3 py-1 rounded-full">${tag}</span>`;
                });
            } else {
                 tagsContainer.innerHTML = '<span class="text-gray-500 text-sm">No topics specified.</span>';
            }

            modal.classList.remove('hidden');
            this.animateModalOpen(modal);
        }
    }
    
    // Setup delete confirmation modal
    confirmDeleteInteraction(id) { // <-- Renamed function
        const modal = document.getElementById('delete-confirm-modal');
        document.getElementById('confirm-delete-button').dataset.id = id;
        modal.classList.remove('hidden');
        this.animateModalOpen(modal);
    }
    
    // ------------------------------------------------------------------
    // FILTERING, SEARCH, AND STATS METHODS
    // ------------------------------------------------------------------

    // Filter logic based on the dropdown filter
    filterLogic(interaction) {
        const filter = document.getElementById('filter-select')?.value;
        if (!filter || filter === 'all') return true;
        
        const tags = interaction.tags ? interaction.tags.split(',').map(t => t.trim().toLowerCase()) : [];
        return tags.includes(filter.toLowerCase());
    }

    // Search logic based on the search input
    searchLogic(interaction) {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase();
        if (!searchTerm) return true;

        const titleMatch = interaction.title.toLowerCase().includes(searchTerm);
        const contentMatch = interaction.content.toLowerCase().includes(searchTerm);
        const tagsMatch = interaction.tags ? interaction.tags.toLowerCase().includes(searchTerm) : false;

        return titleMatch || contentMatch || tagsMatch;
    }

    // Update the statistics cards
    updateStats() {
        const totalInteractions = this.interactions.length;
        const totalTags = new Set(this.interactions.flatMap(i => i.tags ? i.tags.split(',').map(t => t.trim().toLowerCase()) : [])).size;
        
        // Mock data for user count (since we don't have a user API)
        const activeUsers = 5; 
        
        // Calculate average length (word count) - highly simplified
        const totalWords = this.interactions.reduce((sum, i) => sum + (i.content ? i.content.split(/\s+/).length : 0), 0);
        const averageLength = totalInteractions > 0 ? Math.round(totalWords / totalInteractions) : 0;


        document.getElementById('stat-total-posts').textContent = totalInteractions;
        document.getElementById('stat-total-tags').textContent = totalTags;
        document.getElementById('stat-active-users').textContent = activeUsers;
        document.getElementById('stat-avg-length').textContent = `${averageLength} words`;
    }
    
    // Update the topic distribution chart using ECharts
    updateTopicChart() {
        const chartDom = document.getElementById('topic-chart');
        if (!chartDom) return;

        const tagCounts = this.interactions.reduce((acc, interaction) => {
            if (interaction.tags) {
                interaction.tags.split(',').map(tag => tag.trim()).forEach(tag => {
                    const cleanTag = tag.toLowerCase();
                    acc[cleanTag] = (acc[cleanTag] || 0) + 1;
                });
            }
            return acc;
        }, {});

        // Prepare data for ECharts (Top 5 tags)
        const sortedTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        
        const chartData = sortedTags.map(([name, value]) => ({ name, value }));
        const chartNames = sortedTags.map(([name]) => name);

        const myChart = echarts.init(chartDom, 'dark'); // Use 'dark' theme if available, otherwise default

        const option = {
            tooltip: { trigger: 'item' },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 0,
                top: 20,
                bottom: 20,
                data: chartNames,
                textStyle: { color: '#94a3b8' }
            },
            series: [
                {
                    name: 'Interactions by Topic',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['35%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#0f1117',
                        borderWidth: 2
                    },
                    label: {
                        show: false,
                        position: 'center'
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 16,
                            fontWeight: 'bold',
                            color: '#f1f5f9'
                        }
                    },
                    labelLine: { show: false },
                    data: chartData,
                    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] // Custom color palette
                }
            ]
        };

        myChart.setOption(option);

        // Responsive chart handling
        window.addEventListener('resize', () => myChart.resize());
    }

    // ------------------------------------------------------------------
    // UTILITY & SETUP METHODS
    // ------------------------------------------------------------------
    
    // Mock user authentication check
    checkAuthentication() {
        if (localStorage.getItem('bssplus_logged_in') !== 'true') {
            window.location.href = 'login.html';
        }
    }

    // Logout function
    logout() {
        localStorage.removeItem('bssplus_logged_in');
        localStorage.removeItem('bssplus_username');
        window.location.href = 'login.html';
    }

    // Setup event listeners for search and filter
    setupEventListeners() {
        document.getElementById('search-input')?.addEventListener('input', () => this.renderInteractions());
        document.getElementById('filter-select')?.addEventListener('change', () => this.renderInteractions());
        document.getElementById('post-form')?.addEventListener('submit', (e) => this.saveInteraction(e)); // <-- Renamed function call
        document.getElementById('confirm-delete-button')?.addEventListener('click', () => this.deleteInteraction()); // <-- Renamed function call
    }
    
    // Resets search and filter and re-renders
    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('filter-select').value = 'all';
        this.renderInteractions();
    }

    // Simple markdown-like formatting for content viewing
    formatInteractionBody(content) {
        if (!content) return '';
        // Convert newlines to paragraphs/breaks
        let html = content.split('\n').map(line => `<p class="mb-3">${line.trim()}</p>`).join('');
        // Simple bolding
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return html;
    }

    // Initialize mock Firebase/Supabase connection (placeholder)
    initializeAPI() {
        console.log("Supabase/Firebase Client initialized (Mock). Using Netlify Functions for CRUD.");
    }
    
    // Closes any open modal
    closeModal() {
        const modals = document.querySelectorAll('.modal-container:not(.hidden)');
        modals.forEach(modal => {
             this.animateModalClose(modal, () => modal.classList.add('hidden'));
        });
        this.currentEditId = null;
    }

    // ------------------------------------------------------------------
    // ANIMATION & UI FEEDBACK
    // ------------------------------------------------------------------

    showNotification(message, type) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const colorClasses = {
            'success': 'bg-green-600 border-green-700',
            'error': 'bg-red-600 border-red-700',
            'info': 'bg-blue-600 border-blue-700',
        };
        
        const notification = document.createElement('div');
        notification.className = `p-4 rounded-lg shadow-xl text-white text-sm border-l-4 ${colorClasses[type]} opacity-0 transform translate-x-full transition-all duration-300 ease-out flex items-center space-x-3`;
        notification.innerHTML = `
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        anime({ targets: notification, translateX: 0, opacity: 1, duration: 300, easing: 'easeOutQuart' });
        
        setTimeout(() => {
            anime({ targets: notification, translateX: '100%', opacity: 0, duration: 300, easing: 'easeInQuart', complete: () => notification.remove() });
        }, 3000);
    }

    animateModalOpen(modal) {
        anime({
            targets: modal.querySelector('.transform'),
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    animateModalClose(modal, callback) {
        anime({
            targets: modal.querySelector('.transform'),
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInQuart',
            complete: callback
        });
    }
    
    // --- Initial Load Animations ---
    initializeAnimations() {
        
        // Animate hero text
        anime({
            targets: '#hero-title, #hero-subtitle',
            translateY: [20, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutQuart'
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
    
    // --- Canvas/Particle Background ---
    initParticles() {
        if (typeof p5 === 'undefined') return;
        
        let stars = [];
        let numStars = 50;

        // Create a new P5 instance
        const sketch = (p) => {
            p.setup = () => {
                const canvasContainer = document.getElementById('particle-bg');
                p.createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight).parent('particle-bg');
                for (let i = 0; i < numStars; i++) {
                    stars.push(new Star(p.random(p.width), p.random(p.height), p.random(1, 4)));
                }
                p.noStroke();
                p.frameRate(30);
            };

            p.draw = () => {
                p.background(15, 17, 23); // var(--bg-dark) approx
                for (let i = 0; i < stars.length; i++) {
                    stars[i].update();
                    stars[i].display();
                }
            };
            
            p.windowResized = () => {
                const canvasContainer = document.getElementById('particle-bg');
                p.resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
            };
        };
        
        // Star class definition inside scope for P5
        class Star {
            constructor(x, y, size) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.speed = 0.5;
                this.color = p.color(150 + p.random(100), 200 + p.random(55)); // White/Gray tones
            }

            update() {
                this.x -= this.speed * (this.size / 2); // Move horizontally
                
                // Wrap around when star goes off screen
                if (this.x < 0) {
                    this.x = p.width;
                    this.y = p.random(p.height);
                }
            }

            display() {
                p.fill(this.color);
                p.ellipse(this.x, this.y, this.size, this.size);
            }
        }

        // Initialize P5
        new p5(sketch);
    }
}


// ------------------------------------------------------------------
// Global functions for HTML onclick handlers (Wrapper Functions)
// ------------------------------------------------------------------
// These map the HTML attribute calls to the renamed class methods
function openAddModal() {
    window.platform.openAddModal();
}

function editInteraction(id) { // <-- Renamed global function
    window.platform.editInteraction(id);
}

function viewInteraction(id) { // <-- Renamed global function
    window.platform.viewInteraction(id);
}

function confirmDeleteInteraction(id) { // <-- Renamed global function
    window.platform.confirmDeleteInteraction(id);
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
        window.platform = new AIChatbotPlatform(); // <-- Renamed Instantiation
    }
    // If not on index.html, we assume we are on a page that doesn't need the dashboard class (like login.html)
});

