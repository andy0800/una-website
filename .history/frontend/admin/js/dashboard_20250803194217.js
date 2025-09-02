// Global variables
let socket;
let localStream = null;
let screenStream = null;
let isScreenSharing = false;
let connectedViewers = new Map();
let currentEditId = null;
let quillEditor;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    initializeTabNavigation();
    initializeSocketConnection();
    initializeQuillEditor();
    loadDashboardStats();
    initializeEditModals();
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

// Initialize edit modals
function initializeEditModals() {
    // User edit form
    document.getElementById('editUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveUserEdit();
    });

    // Course edit form
    document.getElementById('editCourseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCourseEdit();
    });
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
        
        // Create WebRTC peer connection for this viewer
        if (localStream) {
            try {
                const peerConnection = createPeerConnection(socketId);
                peerConnections[socketId] = peerConnection;
                
                // Create and send offer
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                
                socket.emit('offer', {
                    target: socketId,
                    offer: offer
                });
                
                console.log('📤 Sent offer to viewer:', socketId);
            } catch (error) {
                console.error('Error creating peer connection:', error);
            }
        }
        
        // Add to chat
        addChatMessage('System', `${userInfo?.name || 'Anonymous'} joined the stream`);
    });

    socket.on('disconnectPeer', (data) => {
        const { socketId, viewerCount } = data;
        
        // Update viewer count
        document.getElementById('viewerCount').textContent = `${viewerCount} viewers`;
        document.getElementById('liveViewers').textContent = viewerCount;
        
        // Close peer connection
        if (peerConnections[socketId]) {
            peerConnections[socketId].close();
            delete peerConnections[socketId];
        }
        
        // Remove from connected viewers
        connectedViewers.delete(socketId);
        
        // Add to chat
        addChatMessage('System', 'A viewer left the stream');
    });

    // Handle WebRTC answers from viewers
    socket.on('answer', async (data) => {
        const { socketId, answer } = data;
        const peerConnection = peerConnections[socketId];
        
        if (peerConnection) {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('📥 Received answer from viewer:', socketId);
            } catch (error) {
                console.error('Error setting remote description:', error);
            }
        }
    });

    // Handle ICE candidates from viewers
    socket.on('ice-candidate', (data) => {
        const { socketId, candidate } = data;
        const peerConnection = peerConnections[socketId];
        
        if (peerConnection) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(error => console.error('Error adding ICE candidate:', error));
        }
    });

    socket.on('chat-message', (data) => {
        addChatMessage(data.user, data.message);
    });

    socket.on('mic-request', (data) => {
        addMicRequest(data.user, data.socketId, data.userInfo);
    });

    socket.on('unmute-request', (data) => {
        addMicRequest(data.user, data.socketId, data.userInfo, true);
    });

    socket.on('stream-stopped', () => {
        connectedViewers.clear();
        document.getElementById('viewerCount').textContent = '0 viewers';
        document.getElementById('liveViewers').textContent = '0';
        addChatMessage('System', 'Stream ended');
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

    // First, get all courses for badge display
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
        const courseMap = {};
        courses.forEach(course => {
            courseMap[course._id] = course;
        });

        let html = `
            <div style="overflow-x: auto;">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Civil ID</th>
                            <th>Assigned Courses</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(user => {
            const courseBadges = user.courses ? user.courses.map(courseId => {
                // Fixed: Convert ObjectIds to strings for comparison
                const course = courseMap[courseId.toString()];
                if (course) {
                    return `<span class="course-badge" style="background-color: ${course.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; display: inline-block; border: 2px solid ${course.color}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${course.name}</span>`;
                }
                return '';
            }).join('') : '';

            html += `
                <tr>
                    <td>${user.name || 'N/A'}</td>
                    <td>${user.phone || 'N/A'}</td>
                    <td>${user.civilId || 'N/A'}</td>
                    <td style="max-width: 400px; word-wrap: break-word;">
                        ${courseBadges || '<span style="color: #666; font-style: italic;">No courses assigned</span>'}
                    </td>
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
    })
    .catch(error => {
        console.error('Error loading courses for display:', error);
        // Fallback display without course badges
        let html = `
            <div style="overflow-x: auto;">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Civil ID</th>
                            <th>Assigned Courses</th>
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
                    <td>${user.courses ? user.courses.length + ' courses' : 'No courses'}</td>
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
    });
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

// Edit user
function editUser(userId) {
    currentEditId = userId;
    
    fetch(`/api/admin/users/${userId}`, {
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
    .then(user => {
        // Populate form
        document.getElementById('editUserName').value = user.name || '';
        document.getElementById('editUserPhone').value = user.phone || '';
        document.getElementById('editUserCivilId').value = user.civilId || '';
        
        // Load available courses for assignment
        loadAvailableCourses(user.courses || []);
        
        // Show modal
        document.getElementById('editUserModal').style.display = 'block';
    })
    .catch(error => {
        console.error('Error loading user:', error);
        alert('Error loading user data. Please try again.');
    });
}

// Load available courses for assignment
function loadAvailableCourses(assignedCourses = []) {
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
        const courseSelect = document.getElementById('editUserCourses');
        courseSelect.innerHTML = '<option value="">Select courses...</option>';
        
        courses.forEach(course => {
            // Fixed: Convert ObjectIds to strings for comparison
            const isAssigned = assignedCourses.some(assignedId => 
                assignedId.toString() === course._id.toString()
            );
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = course.name;
            option.selected = isAssigned;
            option.style.color = course.color;
            courseSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error loading courses:', error);
    });
}

// Save user edit
function saveUserEdit() {
    const courseSelect = document.getElementById('editUserCourses');
    if (!courseSelect) {
        console.error('Course select element not found');
        alert('Error: Course selection element not found');
        return;
    }
    
    const selectedCourses = Array.from(courseSelect.selectedOptions)
        .map(option => option.value)
        .filter(id => id !== '' && id !== null);
    
    const userData = {
        name: document.getElementById('editUserName').value,
        phone: document.getElementById('editUserPhone').value,
        civilId: document.getElementById('editUserCivilId').value,
        courses: selectedCourses
    };

    console.log('Saving user data:', userData);
    console.log('Selected courses:', selectedCourses);

    fetch(`/api/admin/users/${currentEditId}/info`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(userData)
    })
    .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
            return response.json().then(errorData => {
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('User updated successfully:', data);
        alert('User updated successfully!');
        closeEditModal('editUserModal');
        loadUsers(); // Reload the users list
    })
    .catch(error => {
        console.error('Error updating user:', error);
        alert('Error updating user: ' + error.message);
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
                        <th>Duration</th>
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

// Edit course function
function editCourse(courseId) {
    currentEditId = courseId;
    
    // Fetch course data
    fetch(`/api/admin/courses/${courseId}`, {
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
    .then(course => {
        // Populate form
        document.getElementById('editCourseName').value = course.name || '';
        document.getElementById('editCourseDescription').value = course.description || '';
        document.getElementById('editCourseDuration').value = course.duration || '';
        
        // Show modal
        document.getElementById('editCourseModal').style.display = 'block';
    })
    .catch(error => {
        console.error('Error loading course:', error);
        alert('Error loading course data. Please try again.');
    });
}

// Save course edit
function saveCourseEdit() {
    const courseData = {
        name: document.getElementById('editCourseName').value,
        description: document.getElementById('editCourseDescription').value,
        duration: document.getElementById('editCourseDuration').value
    };

    fetch(`/api/admin/courses/${currentEditId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(courseData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Course updated successfully!');
        closeEditModal('editCourseModal');
        loadCourses(); // Reload the courses list
    })
    .catch(error => {
        console.error('Error updating course:', error);
        alert('Error updating course. Please try again.');
    });
}

// Close edit modal
function closeEditModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    currentEditId = null;
    
    // Clear form fields
    if (modalId === 'editUserModal') {
        document.getElementById('editUserForm').reset();
    } else if (modalId === 'editCourseModal') {
        document.getElementById('editCourseForm').reset();
    }
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

// Live Stream Functions with WebRTC Implementation
let peerConnections = {}; // Store peer connections for each viewer

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
    
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => pc.close());
    peerConnections = {};
    
    socket.emit('admin-end');
    connectedViewers.clear();
}

// Create WebRTC peer connection for a viewer
function createPeerConnection(viewerSocketId) {
    const peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });

    // Add local stream tracks to peer connection
    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: viewerSocketId,
                candidate: event.candidate
            });
        }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Peer connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
            delete peerConnections[viewerSocketId];
        }
    };

    return peerConnection;
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
function addMicRequest(user, socketId, userInfo, isUnmute = false) {
    const list = document.getElementById('micRequestList');
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${user} ${isUnmute ? 'wants to unmute' : 'wants to use microphone'}</span>
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
window.editUser = editUser;
window.editCourse = editCourse;
window.closeEditModal = closeEditModal;
window.showViewersPopup = showViewersPopup;
window.hideViewersPopup = hideViewersPopup;
window.toggleScreenShare = toggleScreenShare;