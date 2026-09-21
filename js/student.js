/**
 * ============================================================================
 * Student Portal Dashboard Controller
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is student
  auth.protectRoute('student');

  const user = auth.getCurrentUser();
  if (!user || !user.studentId) {
    showToast("No student profile linked to this account", "warning");
    return;
  }

  await loadStudentPortal(user.studentId);
});

async function loadStudentPortal(studentId) {
  try {
    const [student, marks, attendance, allSubjects] = await Promise.all([
      window.dbService.getStudentById(studentId),
      window.dbService.getMarks(studentId),
      window.dbService.getAttendance(studentId),
      window.dbService.getSubjects()
    ]);

    if (!student) {
      showToast("Student profile not found", "error");
      return;
    }

    // 1. Render Profile Header & Details
    const welcomeEl = document.getElementById('student-welcome-name');
    if (welcomeEl) welcomeEl.textContent = student.name;

    const initials = student.name.charAt(0).toUpperCase();
    const avatarEl = document.getElementById('student-avatar-letter');
    if (avatarEl) avatarEl.textContent = initials;

    document.getElementById('profile-name').textContent = student.name;
    document.getElementById('profile-roll').textContent = student.roll_no;
    document.getElementById('profile-enrollment').textContent = student.enrollment_no;
    document.getElementById('profile-email').textContent = student.email;
    document.getElementById('profile-phone').textContent = student.phone || 'N/A';
    document.getElementById('profile-course').textContent = student.course;
    document.getElementById('profile-sem').textContent = `Semester ${student.semester}`;
    document.getElementById('profile-div').textContent = `Division ${student.division || 'A'}`;

    // 2. Aggregate KPI Metrics
    let totalMarks = 0;
    let maxMarks = marks.length * 100;
    let avgMarks = 0;
    let isPass = marks.length > 0;

    marks.forEach(m => {
      totalMarks += Number(m.total_marks || 0);
      if (Number(m.total_marks || 0) < 40) isPass = false;
    });

    if (marks.length > 0) {
      avgMarks = (totalMarks / marks.length).toFixed(1);
    }

    let overallAtt = 0;
    if (attendance.length > 0) {
      const sum = attendance.reduce((acc, curr) => acc + Number(curr.attendance_percentage || 0), 0);
      overallAtt = (sum / attendance.length).toFixed(1);
    }

    // Update KPI cards
    document.getElementById('student-stat-attendance').textContent = `${overallAtt}%`;
    document.getElementById('student-stat-marks').textContent = `${avgMarks}%`;
    document.getElementById('student-stat-subjects').textContent = marks.length;

    const resultStatusEl = document.getElementById('student-stat-result');
    if (resultStatusEl) {
      if (marks.length === 0) {
        resultStatusEl.textContent = 'Pending';
        resultStatusEl.className = 'stat-value text-muted';
      } else if (isPass) {
        resultStatusEl.textContent = 'PASS';
        resultStatusEl.style.color = 'var(--success)';
      } else {
        resultStatusEl.textContent = 'FAIL';
        resultStatusEl.style.color = 'var(--danger)';
      }
    }

    // 3. Render Marks Table
    const marksTbody = document.getElementById('student-marks-body');
    if (marksTbody) {
      if (marks.length === 0) {
        marksTbody.innerHTML = `<tr><td colspan="6" class="text-center">No examination marks published yet.</td></tr>`;
      } else {
        marksTbody.innerHTML = marks.map(m => `
          <tr>
            <td><span class="badge badge-primary">${escapeHtml(m.subject_code)}</span></td>
            <td><strong>${escapeHtml(m.subject_name)}</strong></td>
            <td>${m.internal_marks} / 40</td>
            <td>${m.external_marks} / 60</td>
            <td><strong>${m.total_marks} / 100</strong></td>
            <td><span class="badge ${m.grade === 'F' ? 'badge-danger' : 'badge-success'}">${m.grade}</span></td>
          </tr>
        `).join('');
      }
    }

    // 4. Render Attendance Table
    const attTbody = document.getElementById('student-attendance-body');
    if (attTbody) {
      if (attendance.length === 0) {
        attTbody.innerHTML = `<tr><td colspan="5" class="text-center">No attendance records found.</td></tr>`;
      } else {
        attTbody.innerHTML = attendance.map(a => {
          const pct = Number(a.attendance_percentage);
          const badgeClass = pct >= 75 ? 'badge-success' : (pct >= 60 ? 'badge-warning' : 'badge-danger');
          return `
            <tr>
              <td><strong>${escapeHtml(a.subject_name)}</strong></td>
              <td>${a.total_classes}</td>
              <td>${a.present_classes}</td>
              <td><strong>${pct}%</strong></td>
              <td><span class="badge ${badgeClass}">${pct >= 75 ? 'Good' : (pct >= 60 ? 'Average' : 'Low')}</span></td>
            </tr>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error("Error loading student portal:", err);
    showToast("Failed to load student details", "error");
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
