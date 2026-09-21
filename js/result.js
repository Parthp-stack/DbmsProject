/**
 * ============================================================================
 * Official Marksheet / Result Controller
 * ============================================================================
 */

let allStudentsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = auth.getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const selectorContainer = document.getElementById('admin-student-selector-container');
  const studentSelect = document.getElementById('select-result-student');

  if (user.role === 'admin') {
    if (selectorContainer) selectorContainer.style.display = 'block';
    allStudentsList = await window.dbService.getStudents();
    
    if (studentSelect) {
      studentSelect.innerHTML = allStudentsList.map(s => 
        `<option value="${s.id}">${s.roll_no} - ${s.name} (${s.course})</option>`
      ).join('');

      studentSelect.addEventListener('change', (e) => {
        loadResultForStudent(e.target.value);
      });

      if (allStudentsList.length > 0) {
        loadResultForStudent(allStudentsList[0].id);
      }
    }
  } else {
    // Logged in as student
    if (selectorContainer) selectorContainer.style.display = 'none';
    if (user.studentId) {
      loadResultForStudent(user.studentId);
    } else {
      showToast("No student profile linked to this user", "error");
    }
  }

  // Print button listener
  const printBtn = document.getElementById('btn-print-result');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
});

async function loadResultForStudent(studentId) {
  try {
    const [student, marks] = await Promise.all([
      window.dbService.getStudentById(studentId),
      window.dbService.getMarks(studentId)
    ]);

    if (!student) {
      showToast("Student not found", "error");
      return;
    }

    // Populate Meta Information
    document.getElementById('res-student-name').textContent = student.name;
    document.getElementById('res-roll-no').textContent = student.roll_no;
    document.getElementById('res-enrollment-no').textContent = student.enrollment_no;
    document.getElementById('res-course').textContent = student.course;
    document.getElementById('res-semester').textContent = `Semester ${student.semester}`;
    document.getElementById('res-division').textContent = `Division ${student.division || 'A'}`;

    const tbody = document.getElementById('res-table-body');
    if (!tbody) return;

    if (marks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 2rem;">No marks recorded for this semester examination.</td></tr>`;
      document.getElementById('res-total-score').textContent = '0 / 0';
      document.getElementById('res-percentage').textContent = '0%';
      document.getElementById('res-status').textContent = 'INCOMPLETE';
      document.getElementById('res-status').className = 'badge badge-warning';
      return;
    }

    let totalObtained = 0;
    let maxTotal = marks.length * 100;
    let hasFailed = false;

    // Grade points mapping
    const gradePointsMap = {
      'A+': 10,
      'A': 9,
      'B+': 8,
      'B': 7,
      'C': 6,
      'D': 5,
      'F': 0
    };

    tbody.innerHTML = marks.map((m, idx) => {
      const tot = Number(m.total_marks);
      totalObtained += tot;
      if (tot < 40) hasFailed = true;

      const gp = gradePointsMap[m.grade] || 0;

      return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${escapeHtml(m.subject_code)}</strong></td>
          <td class="text-left">${escapeHtml(m.subject_name)}</td>
          <td>${m.internal_marks} / 40</td>
          <td>${m.external_marks} / 60</td>
          <td><strong>${m.total_marks} / 100</strong></td>
          <td><span class="badge ${m.grade === 'F' ? 'badge-danger' : 'badge-success'}">${m.grade} (${gp})</span></td>
        </tr>
      `;
    }).join('');

    const percentage = ((totalObtained / maxTotal) * 100).toFixed(2);
    document.getElementById('res-total-score').textContent = `${totalObtained} / ${maxTotal}`;
    document.getElementById('res-percentage').textContent = `${percentage}%`;

    const statusEl = document.getElementById('res-status');
    if (hasFailed) {
      statusEl.textContent = 'FAIL';
      statusEl.className = 'badge badge-danger';
    } else {
      statusEl.textContent = 'PASS';
      statusEl.className = 'badge badge-success';
    }

  } catch (err) {
    console.error("Error loading marksheet:", err);
    showToast("Failed to load result statement", "error");
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
