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
    console.log('🚀 Admin Dashboard: DOM Content Loaded');
    
    // Add a small delay to ensure all elements are rendered
    setTimeout(() => {
        console.log('🔧 Admin Dashboard: Starting initialization...');
        
        try {
            // First check authentication
            const token = localStorage.getItem('adminToken');
            if (!token) {
                console.log('❌ No admin token found, redirecting to login');
                window.location.href = '/admin/login.html';
                return;
            }
            
            console.log('✅ Admin token found, proceeding with initialization');
            
            // Initialize core functionality
            initializeDashboard();
            initializeTabNavigation();
            initializeSocketConnection();
            initializeQuillEditor();
            
            // Load content after core initialization
            setTimeout(() => {
                try {
                    loadDashboardStats();
                    initializeEditModals();
                    console.log('✅ Admin Dashboard: Content loading complete');
                } catch (error) {
                    console.error('❌ Error loading dashboard content:', error);
                }
            }, 200);
            
            console.log('✅ Admin Dashboard: Core initialization complete');
        } catch (error) {
            console.error('❌ Admin Dashboard: Initialization failed:', error);
        }
    }, 100);
});

// Check if all required streaming elements exist
function checkStreamingElements() {
    const requiredElements = [
        'startLiveBtn',
        'endLiveBtn', 
        'shareScreenBtn',
        'startRecordingBtn',
        'stopRecordingBtn',
        'localVideo',
        'streamStatus',
        'recordingStatus',
        'viewerCount',
        'liveViewers'
    ];
    
    const missingElements = [];
    
    requiredElements.forEach(elementId => {
        if (!document.getElementById(elementId)) {
            missingElements.push(elementId);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('❌ Missing required streaming elements:', missingElements);
        return false;
    }
    
    console.log('✅ All required streaming elements found');
    return true;
}

// Initialize dashboard
function initializeDashboard() {
    console.log('🔧 Initializing dashboard...');
    
    try {
        // Check authentication
        const token = localStorage.getItem('adminToken');
        if (!token) {
            console.log('❌ No admin token found, redirecting to login');
            window.location.href = '/admin/login.html';
            return;
        }
        console.log('✅ Admin token found');

        // Initialize logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin/login.html';
            });
            console.log('✅ Logout button initialized');
        } else {
            console.error('❌ Logout button not found');
        }

        // Check if streaming elements exist before initializing
        if (checkStreamingElements()) {
            // Initialize streaming event listeners
            initializeStreamingEventListeners();
        } else {
            console.warn('⚠️ Some streaming elements missing, streaming features may not work');
        }

        // Load initial content
        console.log('📊 Loading initial dashboard content...');
        loadUsers();
        
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
    }
}

// Initialize streaming event listeners
function initializeStreamingEventListeners() {
    console.log('🔧 Initializing streaming event listeners...');
    
    // Wait for elements to exist before binding events
    const startLiveBtn = document.getElementById('startLiveBtn');
    const endLiveBtn = document.getElementById('endLiveBtn');
    const sendAdminChat = document.getElementById('sendAdminChat');
    const adminChatInput = document.getElementById('adminChatInput');
    
    if (startLiveBtn) {
        startLiveBtn.addEventListener('click', startLiveStream);
        console.log('✅ Start live button event listener bound');
    } else {
        console.error('❌ Start live button not found');
    }
    
    if (endLiveBtn) {
        endLiveBtn.addEventListener('click', endLiveStream);
        console.log('✅ End live button event listener bound');
    } else {
        console.error('❌ End live button not found');
    }
    
    if (sendAdminChat) {
        sendAdminChat.addEventListener('click', sendChatMessage);
        console.log('✅ Send admin chat event listener bound');
    } else {
        console.error('❌ Send admin chat button not found');
    }
    
    if (adminChatInput) {
        adminChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
        console.log('✅ Admin chat input event listener bound');
    } else {
        console.error('❌ Admin chat input not found');
    }
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

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.edit-modal').id;
            closeEditModal(modalId);
        });
    });

    // Modal cancel buttons
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.closest('.edit-modal').id;
            closeEditModal(modalId);
        });
    });

    // Viewers popup close
    const viewersCloseBtn = document.querySelector('.close-btn');
    if (viewersCloseBtn) {
        viewersCloseBtn.addEventListener('click', hideViewersPopup);
    }
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
        'forms': 'Submitted Forms',
        'recorded-lectures': 'Recorded Lectures Management'
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
        case 'recorded-lectures':
            loadRecordedLectures();
            break;
    }
}

// Initialize socket connection
function initializeSocketConnection() {
    console.log('🔌 Initializing socket connection...');
    
    try {
        socket = io();
        
        socket.on('connect', () => {
            console.log('✅ Connected to server with socket ID:', socket.id);
        });
        
        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });
        
        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
        });

        // Handle stream start event
        socket.on('stream-started', () => {
            console.log('🎥 Stream started event received');
            const streamStatus = document.getElementById('streamStatus');
            if (streamStatus) {
                streamStatus.textContent = 'LIVE';
                streamStatus.style.backgroundColor = '#28a745';
            }
            
            // Enable recording buttons when stream is active
            const startRecordingBtn = document.getElementById('startRecordingBtn');
            if (startRecordingBtn) {
                startRecordingBtn.disabled = false;
            }
        });

        socket.on('viewer-join', async (data) => {
            const { socketId, userInfo, viewerCount } = data;
            console.log('👀 Viewer joined:', data);
            
            // Update viewer count
            const viewerCountElement = document.getElementById('viewerCount');
            const liveViewersElement = document.getElementById('liveViewers');
            
            if (viewerCountElement) {
                viewerCountElement.textContent = `${viewerCount} viewers`;
            }
            if (liveViewersElement) {
                liveViewersElement.textContent = viewerCount;
            }
            
            // Store viewer information (only name, no phone)
            if (userInfo) {
                connectedViewers.set(socketId, {
                    name: userInfo.name || 'Anonymous',
                    hasMic: false
                });
            }
            
            // Add to chat
            addChatMessage('System', `${userInfo?.name || 'Anonymous'} joined the stream`);
            
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
                    console.error('❌ Error creating peer connection:', error);
                }
            }
        });

        socket.on('disconnectPeer', (data) => {
            const { socketId, viewerCount } = data;
            console.log('👤 Viewer disconnected:', data);
            
            // Update viewer count
            const viewerCountElement = document.getElementById('viewerCount');
            const liveViewersElement = document.getElementById('liveViewers');
            
            if (viewerCountElement) {
                viewerCountElement.textContent = `${viewerCount} viewers`;
            }
            if (liveViewersElement) {
                liveViewersElement.textContent = viewerCount;
            }
            
            // Remove from connected viewers
            connectedViewers.delete(socketId);
            
            // Close peer connection
            if (peerConnections[socketId]) {
                peerConnections[socketId].close();
                delete peerConnections[socketId];
            }
            
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
                    console.error('❌ Error setting remote description:', error);
                }
            }
        });

        // Handle ICE candidates from viewers
        socket.on('ice-candidate', (data) => {
            const { socketId, candidate } = data;
            const peerConnection = peerConnections[socketId];

            if (peerConnection) {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                    .catch(error => console.error('❌ Error adding ICE candidate:', error));
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
            console.log('⏹️ Stream stopped event received');
            connectedViewers.clear();
            
            const viewerCountElement = document.getElementById('viewerCount');
            const liveViewersElement = document.getElementById('liveViewers');
            
            if (viewerCountElement) {
                viewerCountElement.textContent = '0 viewers';
            }
            if (liveViewersElement) {
                liveViewersElement.textContent = '0';
            }
            
            addChatMessage('System', 'Stream ended');
        });
        
        console.log('✅ Socket event handlers initialized');
        
    } catch (error) {
        console.error('❌ Error initializing socket connection:', error);
    }
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
            const courseBadges = user.courses && user.courses.length > 0 ? user.courses.map(courseId => {
                // Convert ObjectIds to strings for comparison
                const course = courseMap[courseId.toString()];
                if (course) {
                    return `<span class="course-badge" style="background-color: ${course.color || '#007bff'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; display: inline-block; border: 2px solid ${course.color || '#007bff'}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${course.name}</span>`;
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
        document.getElementById('editUserName').value = user.name || '';
        document.getElementById('editUserPhone').value = user.phone || '';
        document.getElementById('editUserCivilId').value = user.civilId || '';
        
        // Load and display certificates
        displayCertificates(user.certificates || []);
        
        // Load available courses and mark assigned ones
        loadAvailableCourses(user.courses || []);
        
        document.getElementById('editUserModal').style.display = 'block';
    })
    .catch(error => {
        console.error('Error loading user:', error);
        alert('Error loading user: ' + error.message);
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
        if (!courseSelect) {
            console.error('Course select element not found');
            return;
        }
        
        courseSelect.innerHTML = '<option value="">Select courses...</option>';
        
        courses.forEach(course => {
            // Convert ObjectIds to strings for comparison
            const isAssigned = assignedCourses.some(assignedId => 
                assignedId.toString() === course._id.toString()
            );
            
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = `${course.name} (${course.duration || 'N/A'})`;
            option.selected = isAssigned;
            option.style.color = course.color || '#333';
            courseSelect.appendChild(option);
        });
        
        console.log('Courses loaded successfully:', courses.length);
    })
    .catch(error => {
        console.error('Error loading courses:', error);
        const courseSelect = document.getElementById('editUserCourses');
        if (courseSelect) {
            courseSelect.innerHTML = '<option value="">Error loading courses</option>';
        }
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
    
    // Input validation
    const name = document.getElementById('editUserName').value.trim();
    const phone = document.getElementById('editUserPhone').value.trim();
    const civilId = document.getElementById('editUserCivilId').value.trim();
    
    if (!name) {
        alert('Please enter a valid name');
        document.getElementById('editUserName').focus();
        return;
    }
    
    if (!phone) {
        alert('Please enter a valid phone number');
        document.getElementById('editUserPhone').focus();
        return;
    }
    
    const selectedCourses = Array.from(courseSelect.selectedOptions)
        .map(option => option.value)
        .filter(id => id !== '' && id !== null);
    
    const userData = {
        name: name,
        phone: phone,
        civilId: civilId,
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
    // Input validation
    const name = document.getElementById('editCourseName').value.trim();
    const description = document.getElementById('editCourseDescription').value.trim();
    const duration = document.getElementById('editCourseDuration').value.trim();
    
    if (!name) {
        alert('Please enter a valid course name');
        document.getElementById('editCourseName').focus();
        return;
    }
    
    if (!description) {
        alert('Please enter a valid course description');
        document.getElementById('editCourseDescription').focus();
        return;
    }
    
    const courseData = {
        name: name,
        description: description,
        duration: duration
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
    } else if (modalId === 'createLectureModal') {
        document.getElementById('createLectureForm').reset();
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

// Live Stream Functions with Proper WebRTC Implementation
let peerConnections = {}; // Store peer connections for each viewer

function startLiveStream() {
    console.log('🎥 Starting live stream...');
    
    try {
        // Check if we have permission to access media devices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Media devices API not supported in this browser');
        }
        
        // Request camera and microphone access
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1920 }, 
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            }, 
            audio: { 
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        })
        .then(stream => {
            console.log('✅ Media stream obtained successfully');
            localStream = stream;
            
            // Update local video display
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = stream;
                localVideo.play().catch(e => console.log('Video autoplay prevented:', e));
            }
            
            // Update UI buttons
            const startLiveBtn = document.getElementById('startLiveBtn');
            const endLiveBtn = document.getElementById('endLiveBtn');
            const shareScreenBtn = document.getElementById('shareScreenBtn');
            
            if (startLiveBtn) startLiveBtn.disabled = true;
            if (endLiveBtn) endLiveBtn.disabled = false;
            if (shareScreenBtn) shareScreenBtn.disabled = false;
            
            // Notify server that streaming has started
            if (socket && socket.connected) {
                socket.emit('admin-start');
                console.log('📡 Emitted admin-start event to server');
            } else {
                console.error('❌ Socket not connected, cannot start stream');
                alert('Connection error. Please refresh the page and try again.');
                return;
            }
            
            console.log('🎥 Live stream started successfully');
        })
        .catch(error => {
            console.error('❌ Error accessing media devices:', error);
            
            let errorMessage = 'Error accessing camera/microphone. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please check browser permissions and allow camera/microphone access.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera or microphone found. Please check your device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Camera or microphone is already in use by another application.';
            } else {
                errorMessage += error.message || 'Please check permissions and try again.';
            }
            
            alert(errorMessage);
        });
        
    } catch (error) {
        console.error('❌ Error in startLiveStream:', error);
        alert('Error starting live stream: ' + error.message);
    }
}

function endLiveStream() {
    console.log('⏹️ Ending live stream...');
    
    try {
        // Stop all media tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Stopped track:', track.kind);
            });
            localStream = null;
        }
        
        if (screenStream) {
            screenStream.getTracks().forEach(track => {
                track.stop();
                console.log('🛑 Stopped screen track:', track.kind);
            });
            screenStream = null;
        }
        
        // Close all peer connections
        Object.keys(peerConnections).forEach(socketId => {
            const pc = peerConnections[socketId];
            if (pc) {
                pc.close();
                console.log('🛑 Closed peer connection:', socketId);
            }
        });
        peerConnections = {};
        
        // Clear connected viewers
        connectedViewers.clear();
        
        // Update UI
        const localVideo = document.getElementById('localVideo');
        const startLiveBtn = document.getElementById('startLiveBtn');
        const endLiveBtn = document.getElementById('endLiveBtn');
        const shareScreenBtn = document.getElementById('shareScreenBtn');
        
        if (localVideo) {
            localVideo.srcObject = null;
        }
        if (startLiveBtn) startLiveBtn.disabled = false;
        if (endLiveBtn) endLiveBtn.disabled = true;
        if (shareScreenBtn) {
            shareScreenBtn.disabled = true;
            shareScreenBtn.textContent = 'Share Screen';
        }
        
        // Reset screen sharing state
        isScreenSharing = false;
        
        // Notify server that streaming has ended
        if (socket && socket.connected) {
            socket.emit('admin-end');
            console.log('📡 Emitted admin-end event to server');
        }
        
        console.log('✅ Live stream ended successfully');
        
    } catch (error) {
        console.error('❌ Error ending live stream:', error);
        alert('Error ending live stream: ' + error.message);
    }
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
    // Use screen stream if screen sharing is active, otherwise use camera stream
    const streamToUse = isScreenSharing && screenStream ? screenStream : localStream;
    
    if (streamToUse) {
        streamToUse.getTracks().forEach(track => {
            peerConnection.addTrack(track, streamToUse);
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
// REMOVED: These are now handled in initializeStreamingEventListeners()
// document.getElementById('startLiveBtn').addEventListener('click', startLiveStream);
// document.getElementById('endLiveBtn').addEventListener('click', endLiveStream);
// document.getElementById('sendAdminChat').addEventListener('click', sendChatMessage);
// document.getElementById('adminChatInput').addEventListener('keypress', function(e) {
//   if (e.key === 'Enter') {
//         sendChatMessage();
//     }
// });

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

// NEW: Lecture Management Functions
window.showCreateLectureForm = showCreateLectureForm;
window.loadRecordedLectures = loadRecordedLectures;
window.createLecture = createLecture;
window.deleteLecture = deleteLecture;
window.manageLectureAccess = manageLectureAccess;
window.uploadVideoToLecture = uploadVideoToLecture;

// Make functions globally accessible
window.editUser = editUser;
window.saveUserEdit = saveUserEdit;
window.editCourse = editCourse;
window.saveCourseEdit = saveCourseEdit;
window.closeEditModal = closeEditModal;
window.showViewersPopup = showViewersPopup;
window.hideViewersPopup = hideViewersPopup;
window.toggleScreenShare = toggleScreenShare;
window.uploadCertificate = uploadCertificate;
window.deleteCertificate = deleteCertificate;

// Certificate Management Functions
function displayCertificates(certificates) {
    const displayDiv = document.getElementById('certificatesDisplay');
    if (!displayDiv) return;
    
    if (!certificates || certificates.length === 0) {
        displayDiv.innerHTML = '<p style="margin: 0; color: #666;">No certificates uploaded yet</p>';
        return;
    }
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">';
    
    certificates.forEach((cert, index) => {
        const isImage = cert.image && (cert.image.endsWith('.jpg') || cert.image.endsWith('.jpeg') || cert.image.endsWith('.png') || cert.image.endsWith('.gif'));
        
        html += `
            <div style="border: 1px solid #ddd; border-radius: 5px; padding: 10px; background: white;">
                <div style="text-align: center; margin-bottom: 10px;">
                    ${isImage ? 
                        `<img src="/certs/${cert.image}" alt="${cert.name}" style="max-width: 100%; max-height: 100px; object-fit: cover; border-radius: 3px;">` :
                        `<div style="width: 100%; height: 100px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; border-radius: 3px;">
                            <i class="fas fa-file-pdf" style="font-size: 2rem; color: #dc3545;"></i>
                        </div>`
                    }
                </div>
                <p style="margin: 5px 0; font-size: 12px; font-weight: bold; text-align: center;">${cert.name}</p>
                <button onclick="deleteCertificate(${index})" class="btn-cancel" style="width: 100%; padding: 5px; font-size: 11px;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    displayDiv.innerHTML = html;
}

function uploadCertificate() {
    const name = document.getElementById('certificateName').value.trim();
    const file = document.getElementById('certificateFile').files[0];
    
    if (!name || !file) {
        alert('Please provide both certificate name and file.');
        return;
    }
    
    if (!currentEditId) {
        alert('No user selected for certificate upload.');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', file);
    
    fetch(`/api/admin/users/${currentEditId}/certificate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(user => {
        alert('Certificate uploaded successfully!');
        displayCertificates(user.certificates);
        
        // Clear form
        document.getElementById('certificateName').value = '';
        document.getElementById('certificateFile').value = '';
    })
    .catch(error => {
        console.error('Error uploading certificate:', error);
        alert('Failed to upload certificate: ' + error.message);
    });
}

function deleteCertificate(certIndex) {
    if (!currentEditId) {
        alert('No user selected for certificate deletion.');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this certificate?')) {
        return;
    }
    
    fetch(`/api/admin/users/${currentEditId}/certificates/${certIndex}`, {
        method: 'DELETE',
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
        alert('Certificate deleted successfully!');
        // Reload user data to refresh certificates
        editUser(currentEditId);
    })
    .catch(error => {
        console.error('Error deleting certificate:', error);
        alert('Failed to delete certificate: ' + error.message);
    });
}

// Screen sharing functionality
function toggleScreenShare() {
    if (!isScreenSharing) {
        startScreenShare();
    } else {
        stopScreenShare();
    }
}

// ===== LECTURE MANAGEMENT FUNCTIONS =====

// Show create lecture form
function showCreateLectureForm() {
    document.getElementById('createLectureModal').style.display = 'block';
}

// Load recorded lectures
function loadRecordedLectures() {
    const content = document.getElementById('recordedLecturesContent');
    content.innerHTML = '<p>Loading recorded lectures...</p>';

    fetch('/api/lectures/admin/lectures', {
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
    .then(lectures => {
        displayRecordedLectures(lectures);
    })
    .catch(error => {
        console.error('Error loading lectures:', error);
        content.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="color: #dc3545;">Error loading recorded lectures</p>
                <button onclick="loadRecordedLectures()" class="save-btn">Retry</button>
            </div>
        `;
    });
}

// Display recorded lectures
function displayRecordedLectures(lectures) {
    const content = document.getElementById('recordedLecturesContent');
    
    if (!lectures || lectures.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-video-camera" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <p style="color: #666;">No recorded lectures found</p>
                <p style="color: #999; font-size: 0.9rem;">Create your first lecture to get started</p>
            </div>
        `;
        return;
    }

    let html = `
        <div style="overflow-x: auto;">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Quality</th>
                        <th>Duration</th>
                        <th>Access Control</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        lectures.forEach(lecture => {
            const duration = lecture.duration ? `${Math.floor(lecture.duration / 60)}:${(lecture.duration % 60).toString().padStart(2, '0')}` : 'N/A';
            const accessCount = lecture.accessUsers ? lecture.accessUsers.length : 0;
            const hasVideo = lecture.filePath && lecture.filePath.trim() !== '';
            const fileSize = lecture.fileSize ? `${(lecture.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'N/A';
            
            html += `
                <tr>
                    <td>
                        <strong>${lecture.title || 'N/A'}</strong>
                        ${lecture.description ? `<br><small style="color: #666;">${lecture.description}</small>` : ''}
                        <br><small style="color: #999;">Created: ${new Date(lecture.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                        <span class="course-badge" style="background-color: #007bff; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px;">
                            ${lecture.category || 'General'}
                        </span>
                    </td>
                    <td>
                        <span style="color: #28a745; font-weight: 600;">${lecture.quality || '1080p'}</span>
                    </td>
                    <td>${duration}</td>
                    <td>
                        <div style="margin-bottom: 5px;">
                            <span style="color: ${lecture.isPublic ? '#28a745' : '#ffc107'}; font-weight: 600;">
                                ${lecture.isPublic ? 'Public' : `${accessCount} users`}
                            </span>
                        </div>
                        <div style="font-size: 11px; color: #666;">
                            ${hasVideo ? `✅ Video: ${fileSize}` : '❌ No video'}
                        </div>
                    </td>
                    <td>
                        <button onclick="manageLectureAccess('${lecture._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                            <i class="fas fa-users"></i> Access
                        </button>
                        ${!hasVideo ? `
                            <button onclick="uploadVideoToLecture('${lecture._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px; background: #28a745;">
                                <i class="fas fa-upload"></i> Video
                            </button>
                        ` : `
                            <button onclick="uploadVideoToLecture('${lecture._id}')" class="save-btn" style="padding: 5px 10px; font-size: 12px; margin-right: 5px; background: #17a2b8;">
                                <i class="fas fa-sync"></i> Replace
                            </button>
                        `}
                        <button onclick="deleteLecture('${lecture._id}')" class="btn-cancel" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        content.innerHTML = html;
    }


// Create new lecture
function createLecture() {
    const title = document.getElementById('lectureTitle').value.trim();
    const description = document.getElementById('lectureDescription').value.trim();
    const category = document.getElementById('lectureCategory').value;
    const tags = document.getElementById('lectureTags').value.trim();
    const quality = document.getElementById('lectureQuality').value;
    const videoFile = document.getElementById('lectureVideo').files[0];

    // Enhanced validation
    if (!title) {
        alert('Please enter a lecture title');
        document.getElementById('lectureTitle').focus();
        return;
    }
    
    if (!category) {
        alert('Please select a lecture category');
        document.getElementById('lectureCategory').focus();
        return;
    }
    
    if (title.length < 3) {
        alert('Lecture title must be at least 3 characters long');
        document.getElementById('lectureTitle').focus();
        return;
    }

    const lectureData = {
        title,
        description,
        category,
        tags,
        quality
    };

    // If video file is selected, upload it first
    if (videoFile) {
        uploadLectureWithVideo(lectureData, videoFile);
    } else {
        // Create lecture without video
        createLectureEntry(lectureData);
    }
}

// Create lecture entry (without video)
function createLectureEntry(lectureData) {
    fetch('/api/lectures/admin/lectures', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(lectureData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Lecture created successfully! You can upload the video file later.');
        closeEditModal('createLectureModal');
        loadRecordedLectures(); // Reload the lectures list
    })
    .catch(error => {
        console.error('Error creating lecture:', error);
        alert('Error creating lecture: ' + error.message);
    });
}

// Upload lecture with video
function uploadLectureWithVideo(lectureData, videoFile) {
    // First create the lecture entry
    fetch('/api/lectures/admin/lectures', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(lectureData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(lecture => {
        console.log('✅ Lecture created, now uploading video...');
        
        // Now upload the video file
        const formData = new FormData();
        formData.append('video', videoFile);
        
        return fetch(`/api/lectures/admin/lectures/${lecture._id}/video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        alert('Lecture created and video uploaded successfully!');
        closeEditModal('createLectureModal');
        loadRecordedLectures(); // Reload the lectures list
    })
    .catch(error => {
        console.error('Error creating lecture with video:', error);
        alert('Error creating lecture with video: ' + error.message);
    });
}

// Delete lecture
function deleteLecture(lectureId) {
    if (!confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
        return;
    }

    fetch(`/api/lectures/admin/lectures/${lectureId}`, {
        method: 'DELETE',
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
        alert('Lecture deleted successfully!');
        loadRecordedLectures(); // Reload the lectures list
    })
    .catch(error => {
        console.error('Error deleting lecture:', error);
        alert('Error deleting lecture: ' + error.message);
    });
}

// Manage lecture access
function manageLectureAccess(lectureId) {
    // This will be implemented in the next phase
    alert('Access management feature will be implemented in the next phase.');
}

// ===== VIDEO RECORDING FUNCTIONS =====

// Start recording
function startRecording() {
    if (!localStream && !screenStream) {
        alert('Please start streaming first before recording.');
        return;
    }

    // Get the current lecture ID from the form or create a new one
    const lectureTitle = document.getElementById('lectureTitle')?.value || 'Live Stream Recording';
    const lectureDescription = document.getElementById('lectureDescription')?.value || 'Recording from live stream';
    const lectureCategory = document.getElementById('lectureCategory')?.value || 'general';
    const lectureQuality = document.getElementById('lectureQuality')?.value || '1080p';

    // Create lecture entry first
    const lectureData = {
        title: lectureTitle,
        description: lectureDescription,
        category: lectureCategory,
        quality: lectureQuality,
        filePath: '' // Explicitly set empty filePath
    };

    console.log('🎬 Creating lecture for recording:', lectureData);

    fetch('/api/lectures/admin/lectures', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(lectureData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(lecture => {
        console.log('✅ Lecture created successfully:', lecture);
        
        // Start MediaRecorder with the lecture ID
        startMediaRecorder(lecture._id);
        
        // Notify server that recording has started
        socket.emit('admin-start-recording', lecture._id);
        
        // Update UI
        document.getElementById('startRecordingBtn').disabled = true;
        document.getElementById('stopRecordingBtn').disabled = false;
        document.getElementById('recordingStatus').style.display = 'block';
        document.getElementById('recordingInfo').style.display = 'block';
        
        // Store lecture ID for later use
        window.currentRecordingLectureId = lecture._id;
        
        alert('Recording started! Lecture: ' + lecture.title);
    })
    .catch(error => {
        console.error('❌ Error creating lecture for recording:', error);
        alert('Error starting recording: ' + error.message);
    });
}

// Stop recording
function stopRecording() {
    if (window.mediaRecorder && window.mediaRecorder.state === 'recording') {
        window.mediaRecorder.stop();
        
        // Notify server that recording has stopped
        socket.emit('admin-stop-recording');
        
        // Update UI
        document.getElementById('startRecordingBtn').disabled = false;
        document.getElementById('stopRecordingBtn').disabled = true;
        document.getElementById('recordingStatus').style.display = 'none';
        document.getElementById('recordingInfo').style.display = 'none';
        
        // Clear current lecture ID
        window.currentRecordingLectureId = null;
        
        alert('Recording stopped! Video is being processed...');
    }
}

// Start MediaRecorder with 1080p quality
function startMediaRecorder(lectureId) {
    try {
        console.log('🎬 Starting MediaRecorder for lecture:', lectureId);
        
        // Get the active stream (either camera or screen)
        const activeStream = screenStream || localStream;
        
        if (!activeStream) {
            throw new Error('No active stream available for recording');
        }

        // Check MediaRecorder support
        if (!window.MediaRecorder) {
            throw new Error('MediaRecorder API not supported in this browser');
        }

        // Configure MediaRecorder with high quality settings
        let options = {
            mimeType: 'video/webm;codecs=vp9', // High quality codec
            videoBitsPerSecond: 8000000, // 8 Mbps for 1080p quality
            audioBitsPerSecond: 128000   // 128 kbps audio
        };

        // Fallback to VP8 if VP9 is not supported
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.log('⚠️ VP9 not supported, falling back to VP8');
            options.mimeType = 'video/webm;codecs=vp8';
            
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                // Final fallback to basic webm
                options.mimeType = 'video/webm';
                delete options.videoBitsPerSecond;
                delete options.audioBitsPerSecond;
                console.log('⚠️ VP8 not supported, using basic webm format');
            }
        }

        console.log('🎬 Creating MediaRecorder with options:', options);

        window.mediaRecorder = new MediaRecorder(activeStream, options);
        window.recordedChunks = [];

        // Handle data available event
        window.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                window.recordedChunks.push(event.data);
                console.log('📹 Recording chunk received, size:', event.data.size);
            }
        };

        // Handle recording stop event
        window.mediaRecorder.onstop = () => {
            console.log('⏹️ MediaRecorder stopped, processing recording...');
            if (window.recordedChunks.length > 0) {
                const totalSize = window.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
                console.log('📊 Total recording size:', totalSize, 'bytes');
                saveRecording(lectureId);
            } else {
                console.warn('⚠️ No recording chunks available');
                alert('Recording failed - no data captured. Please try again.');
            }
        };

        // Handle recording error
        window.mediaRecorder.onerror = (event) => {
            console.error('❌ MediaRecorder error:', event);
            alert('Recording error occurred: ' + (event.error?.message || 'Unknown error') + '. Please try again.');
        };

        // Handle recording start
        window.mediaRecorder.onstart = () => {
            console.log('✅ MediaRecorder started successfully');
        };

        // Start recording with 1-second intervals for better chunk management
        window.mediaRecorder.start(1000);
        
        console.log('🎬 MediaRecorder started with options:', options);
        
    } catch (error) {
        console.error('❌ Error starting MediaRecorder:', error);
        alert('Error starting recording: ' + error.message);
    }
}

// Save the recorded video
function saveRecording(lectureId) {
    try {
        const blob = new Blob(window.recordedChunks, { type: 'video/webm' });
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('video', blob, `lecture-${lectureId}-${Date.now()}.webm`);

        // Upload video to server
        fetch(`/api/lectures/admin/lectures/${lectureId}/video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Video uploaded successfully:', data);
            
            // Update lecture with duration and other metadata
            updateLectureMetadata(lectureId, blob.size);
            
            // Clear recorded chunks
            window.recordedChunks = [];
            
            alert('Recording saved successfully!');
        })
        .catch(error => {
            console.error('Error uploading video:', error);
            alert('Error saving recording: ' + error.message);
        });
        
    } catch (error) {
        console.error('Error saving recording:', error);
        alert('Error saving recording: ' + error.message);
    }
}

// Update lecture metadata after recording
function updateLectureMetadata(lectureId, fileSize) {
    // Calculate duration from recorded chunks (approximate)
    const duration = Math.floor(window.recordedChunks.length); // 1 second per chunk
    
    fetch(`/api/lectures/admin/lectures/${lectureId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
            duration: duration,
            fileSize: fileSize
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Lecture metadata updated:', data);
    })
    .catch(error => {
        console.error('Error updating lecture metadata:', error);
    });
}

function startScreenShare() {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(stream => {
            screenStream = stream;
            
            // Update local video display
            document.getElementById('localVideo').srcObject = stream;
            document.getElementById('shareScreenBtn').textContent = 'Stop Sharing';
            isScreenSharing = true;
            
            // Update all existing peer connections with screen stream
            Object.keys(peerConnections).forEach(socketId => {
                const pc = peerConnections[socketId];
                if (pc && pc.connectionState === 'connected') {
                    // Remove existing video tracks
                    const senders = pc.getSenders();
                    senders.forEach(sender => {
                        if (sender.track && sender.track.kind === 'video') {
                            pc.removeTrack(sender);
                        }
                    });
                    
                    // Add screen stream video track
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        pc.addTrack(videoTrack, stream);
                    }
                }
            });
            
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
    
    // Restore camera stream to local video
    if (localStream) {
        document.getElementById('localVideo').srcObject = localStream;
        
        // Update all peer connections back to camera stream
        Object.keys(peerConnections).forEach(socketId => {
            const pc = peerConnections[socketId];
            if (pc && pc.connectionState === 'connected') {
                // Remove existing video tracks
                const senders = pc.getSenders();
                senders.forEach(sender => {
                    if (sender.track && sender.track.kind === 'video') {
                        pc.removeTrack(sender);
                    }
                });
                
                // Add camera stream video track
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    pc.addTrack(videoTrack, localStream);
                }
            }
        });
    }
    
    document.getElementById('shareScreenBtn').textContent = 'Share Screen';
    isScreenSharing = false;
}

// Test streaming setup and provide debugging info
function testStreamingSetup() {
    console.log('🧪 Testing streaming setup...');
    
    const testResults = {
        socket: false,
        mediaDevices: false,
        getUserMedia: false,
        MediaRecorder: false,
        requiredElements: false,
        permissions: 'unknown'
    };
    
    // Test socket connection
    if (socket && socket.connected) {
        testResults.socket = true;
        console.log('✅ Socket connected with ID:', socket.id);
    } else {
        console.error('❌ Socket not connected');
    }
    
    // Test media devices API
    if (navigator.mediaDevices) {
        testResults.mediaDevices = true;
        console.log('✅ MediaDevices API available');
        
        if (navigator.mediaDevices.getUserMedia) {
            testResults.getUserMedia = true;
            console.log('✅ getUserMedia available');
        } else {
            console.error('❌ getUserMedia not available');
        }
    } else {
        console.error('❌ MediaDevices API not available');
    }
    
    // Test MediaRecorder
    if (window.MediaRecorder) {
        testResults.MediaRecorder = true;
        console.log('✅ MediaRecorder API available');
        
        // Test supported formats
        const formats = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm'
        ];
        
        formats.forEach(format => {
            if (MediaRecorder.isTypeSupported(format)) {
                console.log('✅ Format supported:', format);
            } else {
                console.log('❌ Format not supported:', format);
            }
        });
    } else {
        console.error('❌ MediaRecorder API not available');
    }
    
    // Test required DOM elements
    const requiredElements = [
        'startLiveBtn', 'endLiveBtn', 'shareScreenBtn',
        'startRecordingBtn', 'stopRecordingBtn', 'localVideo',
        'streamStatus', 'recordingStatus', 'viewerCount', 'liveViewers'
    ];
    
    const missingElements = [];
    requiredElements.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length === 0) {
        testResults.requiredElements = true;
        console.log('✅ All required DOM elements found');
    } else {
        console.error('❌ Missing DOM elements:', missingElements);
    }
    
    // Test permissions
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' })
            .then(result => {
                testResults.permissions = result.state;
                console.log('📷 Camera permission state:', result.state);
            })
            .catch(err => {
                console.log('📷 Camera permission check failed:', err);
            });
            
        navigator.permissions.query({ name: 'microphone' })
            .then(result => {
                console.log('🎤 Microphone permission state:', result.state);
            })
            .catch(err => {
                console.log('🎤 Microphone permission check failed:', err);
            });
    }
    
    // Display test results
    console.table(testResults);
    
    // Provide recommendations
    if (!testResults.socket) {
        console.warn('⚠️ Socket connection issue - check server and network');
    }
    if (!testResults.mediaDevices) {
        console.warn('⚠️ Media devices not supported - use modern browser');
    }
    if (!testResults.MediaRecorder) {
        console.warn('⚠️ Recording not supported - use modern browser');
    }
    if (!testResults.requiredElements) {
        console.warn('⚠️ Missing UI elements - check HTML structure');
    }
    
    return testResults;
}

// Make test function globally accessible
window.testStreamingSetup = testStreamingSetup;

// Show upload progress
function showUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = '0%';
    }
}

// Update upload progress
function updateUploadProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (progressFill && progressText) {
        progressFill.style.width = percent + '%';
        progressText.textContent = Math.round(percent) + '%';
    }
}

// Hide upload progress
function hideUploadProgress() {
    const progressDiv = document.getElementById('uploadProgress');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}

// Upload video to existing lecture