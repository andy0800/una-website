// Global variables
let socket;
let localStream;
let screenStream;
let peerConnections = {};
let connectedViewers = new Map(); // Track viewers with their info and mic status
let quillEditor;
let isScreenSharing = false;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    initializeTabNavigation();
    initializeSocketConnection();
    initializeQuillEditor();
    loadDashboardStats();
});

// Initialize dashboard
function initializeDashboard() {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Initialize logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login.html';
    });

    // Load initial content
    loadUsers();
}

// Initialize tab navigation
function initializeTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show target tab content
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');
            
            // Update page title
            updatePageTitle(targetTab);
            
            // Load tab-specific content
            loadTabContent(targetTab);
        });
    });
}

// Update page title based on active tab
function updatePageTitle(tabName) {
    const titles = {
        'dashboard': 'Dashboard Overview',
        'users': 'Users Management',
        'courses': 'Courses Management',
        'content': 'Content Editor',
        'livestream': 'Live Stream Control',
        'stats': 'Statistics',
        'forms': 'Submitted Forms'
    };
    
    document.querySelector('.page-title').textContent = titles[tabName] || 'Dashboard';
}

// Load tab-specific content
function loadTabContent(tabName) {
    switch(tabName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'users':
            loadUsers();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'stats':
            loadStats();
            break;
        case 'forms':
            loadForms();
            break;
        case 'livestream':
            // Live stream is already initialized
            break;
    }
}

// Initialize socket connection
function initializeSocketConnection() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('viewer-join', async (data) => {
        const { socketId, userInfo, viewerCount } = data;
        
        // Update viewer count
        document.getElementById('viewerCount').textContent = `${viewerCount} viewers`;
        document.getElementById('liveViewers').textContent = viewerCount;
        
        // Store viewer information (only name, no phone)
        if (userInfo) {
            connectedViewers.set(socketId, {
                name: userInfo.name || 'Anonymous',
                hasMic: false
            });
        }
        
        // Add to chat
        addChatMessage('System', `${userInfo?.name || 'Anonymous'} joined the stream`);
    });

    socket.on('disconnectPeer', (data) => {
        const { socketId, viewerCount } = data;
        
        // Update viewer count
        document.getElementById('viewerCount').textContent = `${viewerCount} viewers`;
        document.getElementById('liveViewers').textContent = viewerCount;
        
        // Remove from connected viewers
        connectedViewers.delete(socketId);
        
        // Add to chat
        addChatMessage('System', 'A viewer left the stream');
    });

    socket.on('chat-message', (data) => {
        addChatMessage(data.user, data.message);
    });

    socket.on('mic-request', (data) => {
        addMicRequest(data.user, data.socketId, data.userInfo);
    });

    socket.on('user-mic-offer', async ({ socketId, offer }) => {
        // Update viewer's mic status to active
        if (connectedViewers.has(socketId)) {
            const viewer = connectedViewers.get(socketId);
            viewer.hasMic = true;
            connectedViewers.set(socketId, viewer);
        }
        
        // Handle mic stream
        try {
            const pc = new RTCPeerConnection();
            peerConnections[socketId] = pc;
            
            pc.ondatachannel = (event) => {
                event.channel.onmessage = (event) => {
                    // Handle mic audio data
                    console.log('Received mic audio data');
                };
            };
            
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit('mic-answer', { socketId, answer });
        } catch (error) {
            console.error('Error handling mic offer:', error);
        }
    });

    socket.on('stream-started', () => {
        document.getElementById('streamStatus').textContent = 'LIVE';
        document.getElementById('streamStatus').style.background = 'rgba(40, 167, 69, 0.9)';
    });

    socket.on('stream-stopped', () => {
        document.getElementById('streamStatus').textContent = 'OFFLINE';
        document.getElementById('streamStatus').style.background = 'rgba(0,0,0,0.8)';
        connectedViewers.clear();
    });
}

// Initialize Quill editor
function initializeQuillEditor() {
    quillEditor = new Quill('#quillEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Save content button
    document.getElementById('saveContentBtn').addEventListener('click', saveContent);
}

// Load dashboard statistics
function loadDashboardStats() {
    // Load users count
    fetch('/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('totalUsers').textContent = data.length || 0;
    })
    .catch(error => {
        console.error('Error loading users:', error);
        document.getElementById('totalUsers').textContent = '0';
    });

    // Load courses count
    fetch('/api/admin/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('activeCourses').textContent = data.length || 0;
    })
    .catch(error => {
        console.error('Error loading courses:', error);
        document.getElementById('activeCourses').textContent = '0';
    });

    // Load forms count
    fetch('/api/admin/forms', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('totalForms').textContent = data.length || 0;
    })
    .catch(error => {
        console.error('Error loading forms:', error);
        document.getElementById('totalForms').textContent = '0';
    });
}

// Load users
function loadUsers() {
    const content = document.getElementById('adminContent');
    content.innerHTML = '<p>Loading users...</p>';

    fetch('/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(users => {
        displayUsers(users);
    })
    .catch(error => {
        console.error('Error loading users:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading users</p>
                <button onclick="loadUsers()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display users in table format
function displayUsers(users) {
    const content = document.getElementById('adminContent');
    
    if (!users || users.length === 0) {
        content.innerHTML = '<p>No users found</p>';
        return;
    }

    let html = `
        <div style="overflow-x: auto;">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Civil ID</th>
                        <th>Level</th>
                        <th>Courses</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>${user.civilId || 'N/A'}</td>
                    <td>${user.level || 'N/A'}</td>
                    <td>${user.courses ? user.courses.length : 0} courses</td>
                    <td>
                        <button onclick="editUser('${user._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    }

// Filter users
function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('.users-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Load courses
function loadCourses() {
    const content = document.getElementById('coursesContent');
    content.innerHTML = '<p>Loading courses...</p>';

    fetch('/api/admin/courses', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(courses => {
        displayCourses(courses);
    })
    .catch(error => {
        console.error('Error loading courses:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading courses</p>
                <button onclick="loadCourses()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display courses
function displayCourses(courses) {
    const content = document.getElementById('coursesContent');
    
    if (!courses || courses.length === 0) {
        content.innerHTML = '<p>No courses found</p>';
        return;
    }

    let html = `
        <div style="overflow-x: auto;">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        courses.forEach(course => {
            html += `
                <tr>
                    <td>${course.name || 'N/A'}</td>
                    <td>${course.description || 'N/A'}</td>
                    <td>${course.duration || 'N/A'}</td>
                    <td>
                        <button onclick="editCourse('${course._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    }

// Load statistics
function loadStats() {
    const content = document.getElementById('adminStats');
    content.innerHTML = '<p>Loading statistics...</p>';

    fetch('/api/admin/stats', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(stats => {
        displayStats(stats);
    })
    .catch(error => {
        console.error('Error loading stats:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading statistics</p>
                <button onclick="loadStats()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display statistics
function displayStats(stats) {
    const content = document.getElementById('adminStats');
    content.innerHTML = `
        <div class="dashboard-overview">
            <div class="stat-card">
                <h3>Total Users</h3>
                <div class="number">${stats.users || 0}</div>
                <div class="trend">+12% this month</div>
            </div>
            <div class="stat-card">
                <h3>Active Courses</h3>
                <div class="number">${stats.courses || 0}</div>
                <div class="trend">+5% this month</div>
            </div>
            <div class="stat-card">
                <h3>Total Forms</h3>
                <div class="number">${stats.forms || 0}</div>
                <div class="trend">+8% this month</div>
            </div>
            <div class="stat-card">
                <h3>Certificates</h3>
                <div class="number">${stats.certificates || 0}</div>
                <div class="trend">+3% this month</div>
            </div>
        </div>
    `;
}

// Load forms
function loadForms() {
    const content = document.getElementById('formsContent');
    content.innerHTML = '<p>Loading forms...</p>';

    fetch('/api/admin/forms', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(forms => {
        displayForms(forms);
    })
    .catch(error => {
        console.error('Error loading forms:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading forms</p>
                <button onclick="loadForms()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display forms
function displayForms(forms) {
    const content = document.getElementById('formsContent');
    
    if (!forms || forms.length === 0) {
        content.innerHTML = '<p>No forms submitted</p>';
        return;
    }

    let html = `
        <div style="overflow-x: auto;">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        forms.forEach(form => {
            html += `
                <tr>
                    <td>${form.name || 'N/A'}</td>
                    <td>${form.email || 'N/A'}</td>
                    <td>${form.subject || 'N/A'}</td>
                    <td>${form.message || 'N/A'}</td>
                    <td>${new Date(form.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    }

// Live Stream Functions with Screen Sharing
function startLiveStream() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            document.getElementById('localVideo').srcObject = stream;
            document.getElementById('startLiveBtn').disabled = true;
            document.getElementById('endLiveBtn').disabled = false;
            document.getElementById('shareScreenBtn').disabled = false;
            socket.emit('admin-start');
        })
        .catch(error => {
            console.error('Error accessing media devices:', error);
            alert('Error accessing camera/microphone. Please check permissions.');
        });
}

function endLiveStream() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
    }
    document.getElementById('localVideo').srcObject = null;
    document.getElementById('startLiveBtn').disabled = false;
    document.getElementById('endLiveBtn').disabled = true;
    document.getElementById('shareScreenBtn').disabled = true;
    document.getElementById('shareScreenBtn').textContent = 'Share Screen';
    isScreenSharing = false;
    socket.emit('admin-end');
    connectedViewers.clear();
}

// Screen sharing functionality
function toggleScreenShare() {
    if (!isScreenSharing) {
        startScreenShare();
    } else {
        stopScreenShare();
    }
}

function startScreenShare() {
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
            screenStream = stream;
            document.getElementById('localVideo').srcObject = stream;
            document.getElementById('shareScreenBtn').textContent = 'Stop Sharing';
            isScreenSharing = true;
            
            // Handle screen share stop
            stream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };
        })
        .catch(error => {
            console.error('Error sharing screen:', error);
            alert('Error sharing screen. Please try again.');
        });
}

function stopScreenShare() {
    if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        screenStream = null;
    }
    if (localStream) {
        document.getElementById('localVideo').srcObject = localStream;
    }
    document.getElementById('shareScreenBtn').textContent = 'Share Screen';
    isScreenSharing = false;
}

// Add mic request
function addMicRequest(user, socketId, userInfo) {
    const list = document.getElementById('micRequestList');
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${user} wants to use microphone</span>
        <div>
            <button class="approve-btn" onclick="approveMic('${socketId}')">Approve</button>
            <button class="reject-btn" onclick="rejectMic('${socketId}')">Reject</button>
        </div>
    `;
    list.appendChild(li);
    
    // Update viewer's mic status to false (requesting)
    if (connectedViewers.has(socketId)) {
        const viewer = connectedViewers.get(socketId);
        viewer.hasMic = false;
        connectedViewers.set(socketId, viewer);
    }
}

// Approve mic
function approveMic(socketId) {
    socket.emit('approve-mic', socketId);
    removeMicRequest(socketId);
    
    // Update viewer's mic status to false (pending stream)
    if (connectedViewers.has(socketId)) {
        const viewer = connectedViewers.get(socketId);
        viewer.hasMic = false;
        connectedViewers.set(socketId, viewer);
    }
}

// Reject mic
function rejectMic(socketId) {
    socket.emit('reject-mic', socketId);
    removeMicRequest(socketId);
    
    // Update viewer's mic status to false
    if (connectedViewers.has(socketId)) {
        const viewer = connectedViewers.get(socketId);
        viewer.hasMic = false;
        connectedViewers.set(socketId, viewer);
    }
}

// Remove mic request
function removeMicRequest(socketId) {
    const list = document.getElementById('micRequestList');
    const items = list.getElementsByTagName('li');
    for (let item of items) {
        if (item.textContent.includes(socketId)) {
            item.remove();
            break;
        }
    }
}

// Add chat message
function addChatMessage(user, message) {
    const messagesDiv = document.getElementById('adminMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `<strong>${user}:</strong> ${message}`;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Send chat message
function sendChatMessage() {
    const input = document.getElementById('adminChatInput');
    const message = input.value.trim();
    
    if (message) {
        socket.emit('admin-chat', message);
        addChatMessage('Admin', message);
        input.value = '';
    }
}

// Popup functions
function showViewersPopup() {
    const popup = document.getElementById('viewersPopup');
    const viewersList = document.getElementById('viewersList');
    
    if (connectedViewers.size === 0) {
        viewersList.innerHTML = '<p class="no-viewers">No viewers currently watching</p>';
    } else {
        let html = '';
        connectedViewers.forEach((viewerInfo, socketId) => {
            const micIcon = viewerInfo.hasMic ? 
                '<span class="mic-icon mic-unmuted">🎤</span>' : 
                '<span class="mic-icon mic-muted">🔇</span>';
            
            html += `
                <div class="viewer-item">
                    <span class="viewer-name">${viewerInfo.name || 'Anonymous'}</span>
                    <div class="mic-status">
                        ${micIcon}
                        <span>${viewerInfo.hasMic ? 'Unmuted' : 'Muted'}</span>
                    </div>
                </div>
            `;
        });
        viewersList.innerHTML = html;
    }
    
    // Show popup with smooth animation
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
}

function hideViewersPopup() {
    const popup = document.getElementById('viewersPopup');
    
    // Hide popup with smooth animation
    popup.classList.remove('show');
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300);
}

// Save content
function saveContent() {
    const content = quillEditor.root.innerHTML;
    const language = document.getElementById('contentLang').value;
    const page = document.getElementById('contentPage').value;
    
    fetch('/api/admin/content', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
            language,
            page,
            content
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('contentSaveStatus').innerHTML = 
            '<p style="color: green;">Content saved successfully!</p>';
    })
    .catch(error => {
        console.error('Error saving content:', error);
        document.getElementById('contentSaveStatus').innerHTML = 
            '<p style="color: red;">Error saving content</p>';
    });
}

// Event listeners
document.getElementById('startLiveBtn').addEventListener('click', startLiveStream);
document.getElementById('endLiveBtn').addEventListener('click', endLiveStream);
document.getElementById('sendAdminChat').addEventListener('click', sendChatMessage);
document.getElementById('adminChatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    const popup = document.getElementById('viewersPopup');
    if (e.target === popup) {
        hideViewersPopup();
    }
});

// Close popup with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const popup = document.getElementById('viewersPopup');
        if (popup.style.display === 'flex') {
            hideViewersPopup();
        }
    }
});

// Export functions for global access
window.loadUsers = loadUsers;
window.loadCourses = loadCourses;
window.loadStats = loadStats;
window.loadForms = loadForms;
window.showCreateCourseForm = function() {
    // Implementation for creating course form
    console.log('Create course form');
};
window.showCreateUserForm = function() {
    // Implementation for creating user form
    console.log('Create user form');
};
window.exportUsersExcel = function() {
    // Implementation for exporting users to Excel
    console.log('Export users to Excel');
};
window.editUser = function(userId) {
    // Implementation for editing user
    console.log('Edit user:', userId);
};
window.editCourse = function(courseId) {
    // Implementation for editing course
    console.log('Edit course:', courseId);
};
window.showViewersPopup = showViewersPopup;
window.hideViewersPopup = hideViewersPopup;
window.toggleScreenShare = toggleScreenShare;