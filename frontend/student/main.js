// Student Portal - Isolated from main application
class StudentPortal {
  constructor() {
    this.currentView = 'login';
    this.studentData = null;
    this.init();
  }

  init() {
    document.getElementById('root').innerHTML = this.renderApp();
    this.attachEventListeners();
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);
  }

  updateDateTime() {
    const now = new Date();
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    const dateTimeElement = document.getElementById('datetime');
    if (dateTimeElement) {
      dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
  }

  renderApp() {
    return `
      <div class="min-h-screen bg-gray-900">
        ${this.renderHeader()}
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          ${this.currentView === 'login' ? this.renderLogin() : this.renderDashboard()}
        </div>
      </div>
    `;
  }

  renderHeader() {
    return `
      <header class="bg-gray-800 border-b border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">SM</span>
              </div>
              <h1 class="text-xl font-bold text-white">
                Student Portal
              </h1>
            </div>
            
            <div class="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg">
              <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div class="text-sm text-white" id="datetime"></div>
            </div>
            
            <div class="flex items-center space-x-4">
              ${this.currentView === 'dashboard' ? `
                <button onclick="studentPortal.logout()" class="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-200" title="Logout">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </header>
    `;
  }

  renderLogin() {
    return `
      <div class="max-w-2xl mx-auto">
        <!-- Welcome Section -->
        <div class="text-center mb-12">
          <div class="flex justify-center mb-6">
            <div class="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
              <span class="text-2xl">👨‍🎓</span>
            </div>
          </div>
          <h1 class="text-3xl font-bold text-white mb-4">
            Student Portal
          </h1>
          <p class="text-lg text-gray-400">
            Access your academic dashboard and view your progress
          </p>
        </div>

        <!-- Login Form -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-8">
          <div class="text-center mb-8">
            <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m0 0v12"></path>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white mb-2">
              Student Login
            </h2>
            <p class="text-gray-400">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onsubmit="studentPortal.handleLogin(event)" class="space-y-6">
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-300">
                University <span class="text-red-500">*</span>
              </label>
              <select id="university" class="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200" required>
                <option value="BCU">BCU (Bengaluru City University)</option>
                <option value="BNU">BNU (Bengaluru North University)</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-300">
                Username <span class="text-red-500">*</span>
              </label>
              <input type="text" id="username" placeholder="Enter your name (lowercase)" class="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200" required>
            </div>

            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-300">
                Password <span class="text-red-500">*</span>
              </label>
              <input type="password" id="password" placeholder="Your date of birth (DD/MM/YYYY)" class="w-full px-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200" required>
            </div>

            <div class="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
              <p class="text-sm text-green-300">
                <strong>Login Info:</strong> Your username is your name in lowercase, 
                and your password is your date of birth in <strong>DD/MM/YYYY</strong> format.
              </p>
            </div>

            <button type="submit" class="w-full inline-flex items-center justify-center px-6 py-3 text-base rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 bg-green-500 hover:bg-green-600 text-white focus:ring-green-500">
              Login to Dashboard
            </button>
          </form>
        </div>

        <!-- Help Section -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-8">
          <h3 class="text-lg font-semibold text-white mb-4">
            Need Help?
          </h3>
          <div class="space-y-2 text-sm text-gray-400">
            <p>• If you forgot your credentials, contact your class teacher</p>
            <p>• Your login details are generated from the student data uploaded by your teacher</p>
            <p>• Make sure to use your full name in lowercase as the username</p>
            <p>• Password format: <strong>DD/MM/YYYY</strong> (e.g., 15/03/2000)</p>
          </div>
        </div>
      </div>
    `;
  }

  renderDashboard() {
    return `
      <div>
        <!-- Welcome Section -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-white">
              Welcome back, ${this.studentData.name}!
            </h1>
            <p class="text-gray-400">
              ${this.studentData.course} • ${this.studentData.university} • ${this.studentData.classCode}
            </p>
          </div>
          <button onclick="studentPortal.downloadReport()" class="inline-flex items-center justify-center px-6 py-3 text-base rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 bg-green-500 hover:bg-green-600 text-white focus:ring-green-500">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Download Report
          </button>
        </div>

        <!-- Personal Information -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Personal Information
          </h3>
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p class="text-sm text-gray-400">Date of Birth</p>
              <p class="font-medium text-white">${this.studentData.dob}</p>
            </div>
            <div>
              <p class="text-sm text-gray-400">Parent Name</p>
              <p class="font-medium text-white">${this.studentData.parentName}</p>
            </div>
            <div>
              <p class="text-sm text-gray-400">University</p>
              <p class="font-medium text-white">${this.studentData.university}</p>
            </div>
            <div>
              <p class="text-sm text-gray-400">Address</p>
              <p class="font-medium text-white">${this.studentData.address}</p>
            </div>
          </div>
        </div>

        <!-- Attendance Overview -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Attendance Overview
          </h3>
          
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h4 class="text-lg font-medium text-gray-400 mb-2">
              Attendance Not Uploaded
            </h4>
            <p class="text-gray-500">
              Your teacher hasn't uploaded attendance records yet. Check back later.
            </p>
          </div>
        </div>

        <!-- Academic Performance -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            Academic Performance
          </h3>
          
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
            <h4 class="text-lg font-medium text-gray-400 mb-2">
              Academic Marks Not Uploaded
            </h4>
            <p class="text-gray-500">
              Your teacher hasn't uploaded academic marks yet. Check back later.
            </p>
          </div>
        </div>

        <!-- Course Suggestions -->
        <div class="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            Recommended Career Paths
          </h3>
          
          <div class="text-center py-12">
            <svg class="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            <h4 class="text-lg font-medium text-gray-400 mb-2">
              Career Recommendations Not Available
            </h4>
            <p class="text-gray-500">
              Career recommendations will be generated once your academic marks are uploaded by your teacher.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Event listeners are handled through onclick attributes in the HTML
  }

  handleLogin(event) {
    event.preventDefault();
    
    const university = document.getElementById('university').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Mock authentication - in production, this would call your backend
    if (username && password) {
      this.studentData = {
        name: 'John Doe',
        dob: '15/03/2000',
        parentName: 'Jane Doe',
        address: '123 Main St, Bengaluru',
        university: university,
        classCode: 'BCU-CS-1-SEM1',
        course: 'Computer Science'
      };
      
      this.currentView = 'dashboard';
      this.init();
      this.showToast('Login successful!', 'success');
    } else {
      this.showToast('Please enter valid credentials', 'error');
    }
  }

  logout() {
    this.studentData = null;
    this.currentView = 'login';
    this.init();
    this.showToast('Logged out successfully', 'success');
  }

  downloadReport() {
    // Mock PDF generation
    this.showToast('Report card downloaded successfully!', 'success');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transition-all duration-300 transform translate-x-full ${
      type === 'success' ? 'bg-green-600' : 
      type === 'error' ? 'bg-red-600' : 'bg-blue-600'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
}

// Initialize the student portal
const studentPortal = new StudentPortal();