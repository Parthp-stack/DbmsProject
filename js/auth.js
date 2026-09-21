/**
 * ============================================================================
 * SAMS Authentication & Authorization Service
 * ============================================================================
 */

const auth = {
  getCurrentUser() {
    const raw = localStorage.getItem('sams_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  async login(email, password) {
    email = email.trim().toLowerCase();

    // 1. If Supabase is connected, try real Supabase Auth
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (authError) throw authError;

        // Query custom users table for role & student_id
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        let role = 'student';
        let studentId = null;
        let name = email.split('@')[0];

        if (!userError && userData) {
          role = userData.role;
          studentId = userData.student_id;
        } else if (email.includes('admin')) {
          role = 'admin';
        }

        // If student, fetch student details
        if (studentId) {
          const { data: stData } = await supabaseClient
            .from('students')
            .select('name')
            .eq('id', studentId)
            .single();
          if (stData) name = stData.name;
        }

        const userObj = {
          id: authData.user.id,
          email: authData.user.email,
          role: role,
          studentId: studentId,
          name: name
        };

        localStorage.setItem('sams_user', JSON.stringify(userObj));
        return userObj;
      } catch (err) {
        console.warn("Supabase auth failed or not configured, testing demo credentials:", err.message);
        // If demo credentials match, don't fail on Supabase fetch error!
        if (email === 'admin@college.edu' && password === 'admin123') {
          console.log("Supabase failed, but demo admin credentials matched. Falling back to demo mode.");
        } else if (email === 'aarav.sharma@college.edu' && (password === 'student123' || password === 'admin123')) {
          console.log("Supabase failed, but demo student credentials matched. Falling back to demo mode.");
        } else if (err.message && err.message.toLowerCase().includes('failed to fetch')) {
          throw new Error("Cannot connect to Supabase (Failed to fetch). Please check your Project URL and anon key in js/supabase.js, or use the Demo Accounts below.");
        } else if (isConfigured) {
          throw new Error(err.message || "Invalid email or password");
        }
      }
    }

    // 2. Check locally registered users (created via Signup)
    const registeredUsers = JSON.parse(localStorage.getItem('sams_registered_users') || '[]');
    const registeredMatch = registeredUsers.find(u => u.email.toLowerCase() === email && u.password === password);
    if (registeredMatch) {
      const user = {
        id: registeredMatch.id || ('usr-' + Date.now()),
        email: registeredMatch.email,
        role: registeredMatch.role,
        name: registeredMatch.name,
        studentId: registeredMatch.studentId || null
      };
      localStorage.setItem('sams_user', JSON.stringify(user));
      return user;
    }

    // 3. Demo fallback credentials
    if (email === 'admin@college.edu' && password === 'admin123') {
      const user = {
        id: 'admin-001',
        email: 'admin@college.edu',
        role: 'admin',
        name: 'System Administrator (Teacher)',
        studentId: null
      };
      localStorage.setItem('sams_user', JSON.stringify(user));
      return user;
    }

    if (email === 'aarav.sharma@college.edu' && (password === 'student123' || password === 'admin123')) {
      const user = {
        id: 'std-user-001',
        email: 'aarav.sharma@college.edu',
        role: 'student',
        name: 'Aarav Sharma',
        studentId: '22222222-2222-2222-2222-222222222201'
      };
      localStorage.setItem('sams_user', JSON.stringify(user));
      return user;
    }

    // 4. Check if matching any student email in database
    if (window.dbService) {
      const students = await window.dbService.getStudents();
      const matched = students.find(s => s.email.toLowerCase() === email);
      if (matched && (password === 'student123' || password === 'admin123')) {
        const user = {
          id: 'std-' + matched.id,
          email: matched.email,
          role: 'student',
          name: matched.name,
          studentId: matched.id
        };
        localStorage.setItem('sams_user', JSON.stringify(user));
        return user;
      }
    }

    throw new Error("Invalid email or password. Please verify credentials or create an account via Sign Up.");
  },

  async signup(data) {
    const email = data.email.trim().toLowerCase();
    const role = data.role; // 'student' or 'admin'
    let studentId = null;

    // Check if email already registered locally
    const registeredUsers = JSON.parse(localStorage.getItem('sams_registered_users') || '[]');
    if (registeredUsers.some(u => u.email.toLowerCase() === email)) {
      throw new Error(`Account with email '${email}' already exists. Please sign in.`);
    }

    // 1. If Supabase is connected, try Supabase Auth signUp
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
          email: email,
          password: data.password,
          options: {
            data: {
              name: data.name,
              role: role
            }
          }
        });

        if (authError) {
          console.warn("Supabase signUp warning:", authError.message);
        } else if (authData && authData.user) {
          // If student, insert into students table in Supabase
          if (role === 'student') {
            try {
              const { data: stData } = await supabaseClient.from('students').insert([{
                name: data.name,
                email: email,
                roll_no: data.roll_no,
                enrollment_no: data.enrollment_no,
                course: data.course,
                semester: parseInt(data.semester, 10),
                division: data.division || 'A',
                phone: data.phone || null
              }]).select().single();

              if (stData) studentId = stData.id;

              // Insert into users table
              await supabaseClient.from('users').upsert({
                id: authData.user.id,
                email: email,
                role: 'student',
                student_id: studentId
              });
            } catch (stErr) {
              console.warn("Supabase student record insert warning:", stErr.message);
            }
          } else {
            // Teacher / Admin
            try {
              await supabaseClient.from('users').upsert({
                id: authData.user.id,
                email: email,
                role: 'admin'
              });
            } catch (uErr) {
              console.warn("Supabase teacher user record warning:", uErr.message);
            }
          }
        }
      } catch (sbErr) {
        console.warn("Supabase auth signUp error (saving user locally):", sbErr.message);
      }
    }

    // 2. Also register in local/demo storage
    if (role === 'student') {
      try {
        const st = await window.dbService.addStudent({
          name: data.name,
          email: email,
          roll_no: data.roll_no,
          enrollment_no: data.enrollment_no,
          course: data.course,
          semester: data.semester,
          division: data.division || 'A',
          phone: data.phone || ''
        });
        studentId = st.id;
      } catch (err) {
        // If student already exists in store, find studentId
        const students = await window.dbService.getStudents();
        const existing = students.find(s => s.email.toLowerCase() === email);
        if (existing) studentId = existing.id;
      }
    }

    const newUserRecord = {
      id: 'usr-' + Date.now(),
      email: email,
      password: data.password,
      role: role,
      name: data.name,
      studentId: studentId,
      department: data.department || null,
      faculty_id: data.faculty_id || null,
      created_at: new Date().toISOString()
    };

    registeredUsers.push(newUserRecord);
    localStorage.setItem('sams_registered_users', JSON.stringify(registeredUsers));

    // Auto-login newly signed up user
    const sessionUser = {
      id: newUserRecord.id,
      email: newUserRecord.email,
      role: newUserRecord.role,
      name: newUserRecord.name,
      studentId: newUserRecord.studentId
    };
    localStorage.setItem('sams_user', JSON.stringify(sessionUser));

    return sessionUser;
  },

  async logout() {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.warn("Supabase signOut error:", e);
      }
    }
    localStorage.removeItem('sams_user');
    window.location.href = 'login.html';
  },

  protectRoute(requiredRole = null) {
    const user = this.getCurrentUser();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Public pages
    if (currentPage === 'login.html' || currentPage === 'index.html' || currentPage === '') {
      if (user && currentPage === 'login.html') {
        window.location.href = user.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html';
      }
      return;
    }

    // Protected pages check
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    if (requiredRole && user.role !== requiredRole) {
      if (user.role === 'student' && requiredRole === 'admin') {
        alert("Access Denied: You do not have administrator permissions.");
        window.location.href = 'student-dashboard.html';
      } else if (user.role === 'admin' && requiredRole === 'student') {
        window.location.href = 'admin-dashboard.html';
      }
    }

    // Populate user details in topbar / sidebar if present
    this.renderUserInfo(user);
  },

  renderUserInfo(user) {
    const nameEls = document.querySelectorAll('.user-name, #display-user-name');
    const roleEls = document.querySelectorAll('.user-role-badge, #display-user-role');
    const avatarEls = document.querySelectorAll('.user-avatar, #display-user-avatar');

    nameEls.forEach(el => el.textContent = user.name || user.email);
    roleEls.forEach(el => el.textContent = user.role.toUpperCase());
    avatarEls.forEach(el => {
      const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
      el.textContent = initial;
    });
  }
};

window.auth = auth;
