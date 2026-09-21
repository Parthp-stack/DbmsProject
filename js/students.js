/**
 * ============================================================================
 * Student Management Controller (Admin)
 * ============================================================================
 */

let allStudents = [];

document.addEventListener('DOMContentLoaded', async () => {
  auth.protectRoute('admin');
  await loadStudents();
  setupEventListeners();
});

async function loadStudents() {
  try {
    allStudents = await window.dbService.getStudents();
    renderStudents(allStudents);
  } catch (err) {
    console.error("Error loading students:", err);
    showToast("Error loading students list", "error");
  }
}

function renderStudents(students) {
  const tbody = document.getElementById('students-table-body');
  const countEl = document.getElementById('student-count-badge');
  if (countEl) countEl.textContent = `${students.length} Students`;

  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-icon">🎓</div>
          <div class="empty-title">No Students Found</div>
          <p class="empty-desc">No student records match your current search or filter criteria.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(s => `
    <tr>
      <td><strong>${escapeHtml(s.roll_no)}</strong></td>
      <td>${escapeHtml(s.enrollment_no)}</td>
      <td>
        <div style="font-weight: 600;">${escapeHtml(s.name)}</div>
        <small style="color: var(--text-muted);">${escapeHtml(s.email)}</small>
      </td>
      <td>${escapeHtml(s.course)}</td>
      <td>Sem ${s.semester}</td>
      <td><span class="badge badge-primary">${escapeHtml(s.division || 'A')}</span></td>
      <td>${escapeHtml(s.phone || '-')}</td>
      <td>
        <div class="table-actions">
          <button onclick="viewStudent('${s.id}')" class="btn btn-sm btn-secondary" title="View Profile">👁️</button>
          <button onclick="openEditModal('${s.id}')" class="btn btn-sm btn-secondary" title="Edit Student">✏️</button>
          <button onclick="confirmDelete('${s.id}', '${escapeHtml(s.name)}')" class="btn btn-sm btn-danger" title="Delete Student">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function setupEventListeners() {
  const searchInput = document.getElementById('student-search');
  const semesterFilter = document.getElementById('semester-filter');

  function applyFilters() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    const sem = semesterFilter?.value || '';

    const filtered = allStudents.filter(s => {
      const matchQuery = !q || 
        s.name.toLowerCase().includes(q) ||
        s.roll_no.toLowerCase().includes(q) ||
        s.enrollment_no.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q);

      const matchSem = !sem || s.semester.toString() === sem;
      return matchQuery && matchSem;
    });

    renderStudents(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (semesterFilter) semesterFilter.addEventListener('change', applyFilters);

  // Student Form Submit (Add / Edit)
  const studentForm = document.getElementById('student-form');
  if (studentForm) {
    studentForm.addEventListener('submit', handleStudentFormSubmit);
  }
}

function openAddModal() {
  document.getElementById('modal-student-title').textContent = 'Add New Student';
  document.getElementById('student-form').reset();
  document.getElementById('student-id-field').value = '';
  document.getElementById('student-modal-backdrop').classList.add('active');
}

async function openEditModal(id) {
  const student = allStudents.find(s => s.id === id);
  if (!student) return;

  document.getElementById('modal-student-title').textContent = 'Edit Student Details';
  document.getElementById('student-id-field').value = student.id;
  document.getElementById('input-roll-no').value = student.roll_no;
  document.getElementById('input-enrollment-no').value = student.enrollment_no;
  document.getElementById('input-name').value = student.name;
  document.getElementById('input-email').value = student.email;
  document.getElementById('input-phone').value = student.phone || '';
  document.getElementById('input-course').value = student.course;
  document.getElementById('input-semester').value = student.semester;
  document.getElementById('input-division').value = student.division || 'A';

  document.getElementById('student-modal-backdrop').classList.add('active');
}

function closeStudentModal() {
  document.getElementById('student-modal-backdrop').classList.remove('active');
}

async function handleStudentFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('student-id-field').value;

  const studentData = {
    roll_no: document.getElementById('input-roll-no').value.trim(),
    enrollment_no: document.getElementById('input-enrollment-no').value.trim(),
    name: document.getElementById('input-name').value.trim(),
    email: document.getElementById('input-email').value.trim(),
    phone: document.getElementById('input-phone').value.trim(),
    course: document.getElementById('input-course').value.trim(),
    semester: document.getElementById('input-semester').value,
    division: document.getElementById('input-division').value.trim()
  };

  try {
    if (id) {
      await window.dbService.updateStudent(id, studentData);
      showToast("Student profile updated successfully!", "success");
    } else {
      await window.dbService.addStudent(studentData);
      showToast("Student enrolled successfully!", "success");
    }
    closeStudentModal();
    await loadStudents();
  } catch (err) {
    console.error("Error saving student:", err);
    showToast(err.message || "Failed to save student record", "error");
  }
}

async function confirmDelete(id, name) {
  if (confirm(`Are you sure you want to delete student '${name}'?\nThis will also delete associated marks and attendance records.`)) {
    try {
      await window.dbService.deleteStudent(id);
      showToast("Student deleted successfully", "success");
      await loadStudents();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast(err.message || "Failed to delete student", "error");
    }
  }
}

function viewStudent(id) {
  const student = allStudents.find(s => s.id === id);
  if (!student) return;

  const content = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <div class="avatar-large" style="margin: 0 auto 0.75rem;">${student.name.charAt(0)}</div>
      <h3>${escapeHtml(student.name)}</h3>
      <p style="color: var(--text-muted);">${escapeHtml(student.email)}</p>
    </div>
    <div class="detail-list">
      <div><div class="detail-item-label">Roll Number</div><div class="detail-item-value">${escapeHtml(student.roll_no)}</div></div>
      <div><div class="detail-item-label">Enrollment Number</div><div class="detail-item-value">${escapeHtml(student.enrollment_no)}</div></div>
      <div><div class="detail-item-label">Course</div><div class="detail-item-value">${escapeHtml(student.course)}</div></div>
      <div><div class="detail-item-label">Semester</div><div class="detail-item-value">Semester ${student.semester}</div></div>
      <div><div class="detail-item-label">Division</div><div class="detail-item-value">${escapeHtml(student.division || 'A')}</div></div>
      <div><div class="detail-item-label">Phone</div><div class="detail-item-value">${escapeHtml(student.phone || 'N/A')}</div></div>
    </div>
  `;

  document.getElementById('view-modal-body').innerHTML = content;
  document.getElementById('view-modal-backdrop').classList.add('active');
}

function closeViewModal() {
  document.getElementById('view-modal-backdrop').classList.remove('active');
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
