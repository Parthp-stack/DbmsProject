/**
 * ============================================================================
 * SAMS Database Service
 * Bridges Supabase PostgreSQL queries with local fallback demo mode
 * ============================================================================
 */

// Initial Seed Data for Demo fallback
const INITIAL_STUDENTS = [
  { id: '22222222-2222-2222-2222-222222222201', roll_no: 'CS2026-01', enrollment_no: 'EN20260001', name: 'Aarav Sharma', email: 'aarav.sharma@college.edu', phone: '9876543210', course: 'B.Tech CSE', semester: 3, division: 'A', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222202', roll_no: 'CS2026-02', enrollment_no: 'EN20260002', name: 'Diya Patel', email: 'diya.patel@college.edu', phone: '9876543211', course: 'B.Tech CSE', semester: 3, division: 'A', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222203', roll_no: 'CS2026-03', enrollment_no: 'EN20260003', name: 'Rohan Verma', email: 'rohan.verma@college.edu', phone: '9876543212', course: 'B.Tech CSE', semester: 3, division: 'A', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222204', roll_no: 'CS2026-04', enrollment_no: 'EN20260004', name: 'Ananya Iyer', email: 'ananya.iyer@college.edu', phone: '9876543213', course: 'B.Tech CSE', semester: 3, division: 'A', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222205', roll_no: 'CS2026-05', enrollment_no: 'EN20260005', name: 'Kabir Mehta', email: 'kabir.mehta@college.edu', phone: '9876543214', course: 'B.Tech CSE', semester: 3, division: 'B', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222206', roll_no: 'CS2026-06', enrollment_no: 'EN20260006', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@college.edu', phone: '9876543215', course: 'B.Tech CSE', semester: 3, division: 'B', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222207', roll_no: 'CS2026-07', enrollment_no: 'EN20260007', name: 'Vikram Singh', email: 'vikram.singh@college.edu', phone: '9876543216', course: 'B.Tech CSE', semester: 3, division: 'B', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222208', roll_no: 'CS2026-08', enrollment_no: 'EN20260008', name: 'Pooja Nair', email: 'pooja.nair@college.edu', phone: '9876543217', course: 'B.Tech CSE', semester: 3, division: 'B', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222209', roll_no: 'CS2026-09', enrollment_no: 'EN20260009', name: 'Aditya Joshi', email: 'aditya.joshi@college.edu', phone: '9876543218', course: 'B.Tech CSE', semester: 3, division: 'A', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222210', roll_no: 'CS2026-10', enrollment_no: 'EN20260010', name: 'Meera Reddy', email: 'meera.reddy@college.edu', phone: '9876543219', course: 'B.Tech CSE', semester: 3, division: 'A', created_at: new Date().toISOString() }
];

const INITIAL_SUBJECTS = [
  { id: '11111111-1111-1111-1111-111111111101', subject_code: 'CS301', subject_name: 'Database Management Systems', semester: 3, credits: 4 },
  { id: '11111111-1111-1111-1111-111111111102', subject_code: 'CS302', subject_name: 'Data Structures & Algorithms', semester: 3, credits: 4 },
  { id: '11111111-1111-1111-1111-111111111103', subject_code: 'CS303', subject_name: 'Operating Systems', semester: 3, credits: 3 },
  { id: '11111111-1111-1111-1111-111111111104', subject_code: 'CS304', subject_name: 'Computer Networks', semester: 3, credits: 3 },
  { id: '11111111-1111-1111-1111-111111111105', subject_code: 'CS305', subject_name: 'Object Oriented Programming with Java', semester: 3, credits: 4 },
  { id: '11111111-1111-1111-1111-111111111106', subject_code: 'CS306', subject_name: 'Software Engineering', semester: 3, credits: 3 }
];

function calculateGrade(total) {
  if (total >= 90) return 'A+';
  if (total >= 80) return 'A';
  if (total >= 70) return 'B+';
  if (total >= 60) return 'B';
  if (total >= 50) return 'C';
  if (total >= 40) return 'D';
  return 'F';
}

function calculateAttendancePct(present, total) {
  if (!total || total === 0) return 0;
  return Number(((present / total) * 100).toFixed(2));
}

// Generate marks for demo
function generateInitialMarks() {
  const marks = [];
  const subs = INITIAL_SUBJECTS;
  INITIAL_STUDENTS.forEach((st, sIdx) => {
    subs.slice(0, 5).forEach((sub, mIdx) => {
      const internal = 20 + ((sIdx * 3 + mIdx * 5) % 19);
      const external = 32 + ((sIdx * 5 + mIdx * 7) % 27);
      const total = internal + external;
      marks.push({
        id: `mark-${sIdx}-${mIdx}`,
        student_id: st.id,
        subject_id: sub.id,
        internal_marks: internal,
        external_marks: external,
        total_marks: total,
        grade: calculateGrade(total),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  });
  return marks;
}

// Generate attendance for demo
function generateInitialAttendance() {
  const att = [];
  const subs = INITIAL_SUBJECTS;
  INITIAL_STUDENTS.forEach((st, sIdx) => {
    subs.slice(0, 5).forEach((sub, aIdx) => {
      const total = 40;
      const present = Math.min(40, 24 + ((sIdx * 4 + aIdx * 3) % 17));
      att.push({
        id: `att-${sIdx}-${aIdx}`,
        student_id: st.id,
        subject_id: sub.id,
        total_classes: total,
        present_classes: present,
        attendance_percentage: calculateAttendancePct(present, total),
        updated_at: new Date().toISOString()
      });
    });
  });
  return att;
}

// Storage helpers for demo
function getLocal(key, defaultVal) {
  const v = localStorage.getItem('sams_' + key);
  if (!v) {
    localStorage.setItem('sams_' + key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try { return JSON.parse(v); } catch (e) { return defaultVal; }
}

function setLocal(key, val) {
  localStorage.setItem('sams_' + key, JSON.stringify(val));
}

const db = {
  // ----------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------
  async getStudents() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('students').select('*').order('roll_no', { ascending: true });
        if (!error && data && data.length > 0) return data;
        if (error) console.warn("Supabase query failed, falling back to local store:", error.message);
      } catch (err) {
        console.warn("Supabase getStudents network error, using local fallback:", err.message);
      }
    }
    return getLocal('students', INITIAL_STUDENTS);
  },

  async getStudentById(id) {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('students').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (err) {
        console.warn("Supabase getStudentById network error:", err.message);
      }
    }
    const students = getLocal('students', INITIAL_STUDENTS);
    return students.find(s => s.id === id) || null;
  },

  async addStudent(studentData) {
    const newStudent = {
      ...studentData,
      semester: parseInt(studentData.semester, 10),
      created_at: new Date().toISOString()
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('students').insert([newStudent]).select().single();
        if (!error && data) return data;
        if (error) console.warn("Supabase insert error, saving locally:", error.message);
      } catch (err) {
        console.warn("Supabase addStudent network error, saving locally:", err.message);
      }
    }

    const students = getLocal('students', INITIAL_STUDENTS);
    // Unique check
    if (students.some(s => s.roll_no.toLowerCase() === newStudent.roll_no.toLowerCase())) {
      throw new Error(`Roll No '${newStudent.roll_no}' already exists.`);
    }
    if (students.some(s => s.enrollment_no.toLowerCase() === newStudent.enrollment_no.toLowerCase())) {
      throw new Error(`Enrollment No '${newStudent.enrollment_no}' already exists.`);
    }
    if (students.some(s => s.email.toLowerCase() === newStudent.email.toLowerCase())) {
      throw new Error(`Email '${newStudent.email}' already exists.`);
    }

    newStudent.id = 'std-' + Date.now();
    students.push(newStudent);
    setLocal('students', students);
    return newStudent;
  },

  async updateStudent(id, studentData) {
    const updated = {
      ...studentData,
      semester: parseInt(studentData.semester, 10)
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('students').update(updated).eq('id', id).select().single();
        if (!error && data) return data;
        if (error) console.warn("Supabase update error, updating locally:", error.message);
      } catch (err) {
        console.warn("Supabase updateStudent network error:", err.message);
      }
    }

    const students = getLocal('students', INITIAL_STUDENTS);
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Student not found");
    students[idx] = { ...students[idx], ...updated };
    setLocal('students', students);
    return students[idx];
  },

  async deleteStudent(id) {
    if (supabaseClient) {
      try {
        const { error } = await supabaseClient.from('students').delete().eq('id', id);
        if (error) console.warn("Supabase delete error:", error.message);
      } catch (err) {
        console.warn("Supabase deleteStudent network error:", err.message);
      }
    }

    let students = getLocal('students', INITIAL_STUDENTS);
    students = students.filter(s => s.id !== id);
    setLocal('students', students);

    // Cascading delete on marks and attendance in local store
    let marks = getLocal('marks', generateInitialMarks());
    setLocal('marks', marks.filter(m => m.student_id !== id));

    let att = getLocal('attendance', generateInitialAttendance());
    setLocal('attendance', att.filter(a => a.student_id !== id));

    return true;
  },

  // ----------------------------------------------------
  // SUBJECTS
  // ----------------------------------------------------
  async getSubjects() {
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('subjects').select('*').order('subject_code', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn("Supabase getSubjects error:", err.message);
      }
    }
    return getLocal('subjects', INITIAL_SUBJECTS);
  },

  async addSubject(subData) {
    const newSub = {
      ...subData,
      semester: parseInt(subData.semester, 10),
      credits: parseInt(subData.credits, 10),
      created_at: new Date().toISOString()
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('subjects').insert([newSub]).select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn("Supabase addSubject error, saving locally:", err.message);
      }
    }

    const subs = getLocal('subjects', INITIAL_SUBJECTS);
    if (subs.some(s => s.subject_code.toLowerCase() === newSub.subject_code.toLowerCase())) {
      throw new Error(`Subject code '${newSub.subject_code}' already exists.`);
    }
    newSub.id = 'sub-' + Date.now();
    subs.push(newSub);
    setLocal('subjects', subs);
    return newSub;
  },

  async updateSubject(id, subData) {
    const updated = {
      ...subData,
      semester: parseInt(subData.semester, 10),
      credits: parseInt(subData.credits, 10)
    };

    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient.from('subjects').update(updated).eq('id', id).select().single();
        if (!error && data) return data;
      } catch (err) {
        console.warn("Supabase updateSubject error:", err.message);
      }
    }

    const subs = getLocal('subjects', INITIAL_SUBJECTS);
    const idx = subs.findIndex(s => s.id === id);
    if (idx === -1) throw new Error("Subject not found");
    subs[idx] = { ...subs[idx], ...updated };
    setLocal('subjects', subs);
    return subs[idx];
  },

  async deleteSubject(id) {
    if (supabaseClient) {
      try {
        await supabaseClient.from('subjects').delete().eq('id', id);
      } catch (err) {
        console.warn("Supabase deleteSubject error:", err.message);
      }
    }

    let subs = getLocal('subjects', INITIAL_SUBJECTS);
    subs = subs.filter(s => s.id !== id);
    setLocal('subjects', subs);
    return true;
  },

  // ----------------------------------------------------
  // MARKS
  // ----------------------------------------------------
  async getMarks(studentId = null) {
    if (supabaseClient) {
      try {
        let query = supabaseClient.from('student_marks_view').select('*');
        if (studentId) query = query.eq('student_id', studentId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn("Supabase getMarks error:", err.message);
      }
    }

    // Local fallback join
    const marks = getLocal('marks', generateInitialMarks());
    const students = getLocal('students', INITIAL_STUDENTS);
    const subjects = getLocal('subjects', INITIAL_SUBJECTS);

    let joined = marks.map(m => {
      const st = students.find(s => s.id === m.student_id) || {};
      const sub = subjects.find(s => s.id === m.subject_id) || {};
      return {
        mark_id: m.id,
        id: m.id,
        student_id: m.student_id,
        student_name: st.name || 'Unknown',
        roll_no: st.roll_no || 'N/A',
        enrollment_no: st.enrollment_no || 'N/A',
        course: st.course || 'N/A',
        semester: st.semester || 3,
        division: st.division || 'A',
        subject_id: m.subject_id,
        subject_code: sub.subject_code || 'N/A',
        subject_name: sub.subject_name || 'N/A',
        credits: sub.credits || 3,
        internal_marks: Number(m.internal_marks),
        external_marks: Number(m.external_marks),
        total_marks: Number(m.total_marks),
        grade: m.grade,
        updated_at: m.updated_at
      };
    });

    if (studentId) {
      joined = joined.filter(m => m.student_id === studentId);
    }
    return joined;
  },

  async saveMarks(data) {
    const internal = parseFloat(data.internal_marks) || 0;
    const external = parseFloat(data.external_marks) || 0;
    const total = internal + external;
    const grade = calculateGrade(total);

    const record = {
      student_id: data.student_id,
      subject_id: data.subject_id,
      internal_marks: internal,
      external_marks: external,
      total_marks: total,
      grade: grade,
      updated_at: new Date().toISOString()
    };

    if (supabaseClient) {
      try {
        const { data: res, error } = await supabaseClient
          .from('marks')
          .upsert(record, { onConflict: 'student_id,subject_id' })
          .select();
        if (!error && res) return res;
      } catch (err) {
        console.warn("Supabase saveMarks error, storing locally:", err.message);
      }
    }

    const marks = getLocal('marks', generateInitialMarks());
    const existingIdx = marks.findIndex(m => m.student_id === data.student_id && m.subject_id === data.subject_id);

    if (existingIdx !== -1) {
      marks[existingIdx] = { ...marks[existingIdx], ...record };
    } else {
      record.id = 'mark-' + Date.now();
      record.created_at = new Date().toISOString();
      marks.push(record);
    }
    setLocal('marks', marks);
    return record;
  },

  async deleteMarks(id) {
    if (supabaseClient) {
      try {
        await supabaseClient.from('marks').delete().eq('id', id);
      } catch (err) {
        console.warn("Supabase deleteMarks error:", err.message);
      }
    }
    let marks = getLocal('marks', generateInitialMarks());
    marks = marks.filter(m => m.id !== id);
    setLocal('marks', marks);
    return true;
  },

  // ----------------------------------------------------
  // ATTENDANCE
  // ----------------------------------------------------
  async getAttendance(studentId = null) {
    if (supabaseClient) {
      try {
        let query = supabaseClient.from('student_attendance_view').select('*');
        if (studentId) query = query.eq('student_id', studentId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn("Supabase getAttendance error:", err.message);
      }
    }

    const att = getLocal('attendance', generateInitialAttendance());
    const students = getLocal('students', INITIAL_STUDENTS);
    const subjects = getLocal('subjects', INITIAL_SUBJECTS);

    let joined = att.map(a => {
      const st = students.find(s => s.id === a.student_id) || {};
      const sub = subjects.find(s => s.id === a.subject_id) || {};
      const pct = Number(a.attendance_percentage);
      return {
        attendance_id: a.id,
        id: a.id,
        student_id: a.student_id,
        student_name: st.name || 'Unknown',
        roll_no: st.roll_no || 'N/A',
        enrollment_no: st.enrollment_no || 'N/A',
        course: st.course || 'N/A',
        semester: st.semester || 3,
        subject_id: a.subject_id,
        subject_code: sub.subject_code || 'N/A',
        subject_name: sub.subject_name || 'N/A',
        total_classes: a.total_classes,
        present_classes: a.present_classes,
        attendance_percentage: pct,
        status: pct >= 75 ? 'Good' : (pct >= 60 ? 'Average' : 'Low'),
        updated_at: a.updated_at
      };
    });

    if (studentId) {
      joined = joined.filter(a => a.student_id === studentId);
    }
    return joined;
  },

  async saveAttendance(data) {
    const total = parseInt(data.total_classes, 10) || 0;
    const present = parseInt(data.present_classes, 10) || 0;
    if (present > total) throw new Error("Present classes cannot exceed total classes");
    
    const pct = calculateAttendancePct(present, total);

    const record = {
      student_id: data.student_id,
      subject_id: data.subject_id,
      total_classes: total,
      present_classes: present,
      attendance_percentage: pct,
      updated_at: new Date().toISOString()
    };

    if (supabaseClient) {
      try {
        const { data: res, error } = await supabaseClient
          .from('attendance')
          .upsert(record, { onConflict: 'student_id,subject_id' })
          .select();
        if (!error && res) return res;
      } catch (err) {
        console.warn("Supabase saveAttendance error, storing locally:", err.message);
      }
    }

    const att = getLocal('attendance', generateInitialAttendance());
    const existingIdx = att.findIndex(a => a.student_id === data.student_id && a.subject_id === data.subject_id);

    if (existingIdx !== -1) {
      att[existingIdx] = { ...att[existingIdx], ...record };
    } else {
      record.id = 'att-' + Date.now();
      att.push(record);
    }
    setLocal('attendance', att);
    return record;
  },

  async deleteAttendance(id) {
    if (supabaseClient) {
      try {
        await supabaseClient.from('attendance').delete().eq('id', id);
      } catch (err) {
        console.warn("Supabase deleteAttendance error:", err.message);
      }
    }
    let att = getLocal('attendance', generateInitialAttendance());
    att = att.filter(a => a.id !== id);
    setLocal('attendance', att);
    return true;
  },

  // ----------------------------------------------------
  // DASHBOARD AGGREGATES
  // ----------------------------------------------------
  async getDashboardStats() {
    const [students, subjects, marks, attendance] = await Promise.all([
      this.getStudents(),
      this.getSubjects(),
      this.getMarks(),
      this.getAttendance()
    ]);

    const totalStudents = students.length;
    const totalSubjects = subjects.length;

    let avgAttendance = 0;
    if (attendance.length > 0) {
      const sum = attendance.reduce((acc, curr) => acc + Number(curr.attendance_percentage || 0), 0);
      avgAttendance = (sum / attendance.length).toFixed(1);
    }

    let avgPerformance = 0;
    if (marks.length > 0) {
      const sum = marks.reduce((acc, curr) => acc + Number(curr.total_marks || 0), 0);
      avgPerformance = (sum / marks.length).toFixed(1);
    }

    return {
      totalStudents,
      totalSubjects,
      avgAttendance: avgAttendance + '%',
      avgPerformance: avgPerformance + '%'
    };
  }
};

window.dbService = db;
