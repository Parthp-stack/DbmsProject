/**
 * ============================================================================
 * Attendance Management Controller (Admin)
 * ============================================================================
 */

let allAttendance = [];
let studentsList = [];
let subjectsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  auth.protectRoute('admin');
  await Promise.all([loadStudentsAndSubjects(), loadAttendance()]);
  setupAttendanceEvents();
});

async function loadStudentsAndSubjects() {
  try {
    [studentsList, subjectsList] = await Promise.all([
      window.dbService.getStudents(),
      window.dbService.getSubjects()
    ]);
    populateAttendanceDropdowns();
  } catch (err) {
    console.error("Error loading dropdowns:", err);
  }
}

function populateAttendanceDropdowns() {
  const studentSelect = document.getElementById('input-att-student');
  const subjectSelect = document.getElementById('input-att-subject');
  const filterStudent = document.getElementById('filter-att-student');

  if (studentSelect) {
    studentSelect.innerHTML = '<option value="">-- Choose Student --</option>' +
      studentsList.map(s => `<option value="${s.id}">${s.roll_no} - ${s.name}</option>`).join('');
  }

  if (subjectSelect) {
    subjectSelect.innerHTML = '<option value="">-- Choose Subject --</option>' +
      subjectsList.map(sub => `<option value="${sub.id}">${sub.subject_code} - ${sub.subject_name}</option>`).join('');
  }

  if (filterStudent) {
    filterStudent.innerHTML = '<option value="">All Students</option>' +
      studentsList.map(s => `<option value="${s.id}">${s.roll_no} - ${s.name}</option>`).join('');
  }
}

async function loadAttendance() {
  try {
    allAttendance = await window.dbService.getAttendance();
    renderAttendance(allAttendance);
  } catch (err) {
    console.error("Error loading attendance:", err);
    showToast("Error loading attendance list", "error");
  }
}

function renderAttendance(records) {
  const tbody = document.getElementById('attendance-table-body');
  const badge = document.getElementById('attendance-count-badge');
  if (badge) badge.textContent = `${records.length} Records`;

  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-icon">📅</div>
          <div class="empty-title">No Attendance Recorded</div>
          <p class="empty-desc">Record attendance sessions with the button above.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map(a => {
    let statusClass = 'badge-success';
    if (a.attendance_percentage < 60) statusClass = 'badge-danger';
    else if (a.attendance_percentage < 75) statusClass = 'badge-warning';

    return `
      <tr>
        <td><strong>${escapeHtml(a.roll_no)}</strong></td>
        <td>${escapeHtml(a.student_name)}</td>
        <td>
          <span class="badge badge-primary">${escapeHtml(a.subject_code)}</span>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(a.subject_name)}</div>
        </td>
        <td>${a.total_classes}</td>
        <td>${a.present_classes}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="flex: 1; height: 7px; background: var(--bg-hover); border-radius: 4px; overflow: hidden; min-width: 60px;">
              <div style="width: ${Math.min(100, a.attendance_percentage)}%; height: 100%; background: ${a.attendance_percentage >= 75 ? 'var(--success)' : (a.attendance_percentage >= 60 ? 'var(--warning)' : 'var(--danger)')};"></div>
            </div>
            <strong>${a.attendance_percentage}%</strong>
          </div>
        </td>
        <td><span class="badge ${statusClass}">${a.status || (a.attendance_percentage >= 75 ? 'Good' : (a.attendance_percentage >= 60 ? 'Average' : 'Low'))}</span></td>
        <td>
          <div class="table-actions">
            <button onclick="openEditAttendanceModal('${a.student_id}', '${a.subject_id}', ${a.total_classes}, ${a.present_classes})" class="btn btn-sm btn-secondary" title="Edit">✏️</button>
            <button onclick="confirmDeleteAttendance('${a.id || a.attendance_id}')" class="btn btn-sm btn-danger" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupAttendanceEvents() {
  const totalInput = document.getElementById('input-total-classes');
  const presentInput = document.getElementById('input-present-classes');

  function updatePctPreview() {
    const total = parseInt(totalInput?.value, 10) || 0;
    const present = parseInt(presentInput?.value, 10) || 0;
    let pct = 0;
    if (total > 0) {
      pct = ((present / total) * 100).toFixed(2);
    }

    const pctEl = document.getElementById('preview-attendance-pct');
    const badgeEl = document.getElementById('preview-attendance-status');
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (badgeEl) {
      if (pct >= 75) {
        badgeEl.className = 'badge badge-success';
        badgeEl.textContent = 'Good (>= 75%)';
      } else if (pct >= 60) {
        badgeEl.className = 'badge badge-warning';
        badgeEl.textContent = 'Average (60-74%)';
      } else {
        badgeEl.className = 'badge badge-danger';
        badgeEl.textContent = 'Low (< 60%)';
      }
    }
  }

  if (totalInput) totalInput.addEventListener('input', updatePctPreview);
  if (presentInput) presentInput.addEventListener('input', updatePctPreview);

  // Filters
  const filterStudent = document.getElementById('filter-att-student');
  const searchInput = document.getElementById('attendance-search');

  function applyAttendanceFilter() {
    const studentId = filterStudent?.value || '';
    const q = (searchInput?.value || '').trim().toLowerCase();

    const filtered = allAttendance.filter(a => {
      const matchStudent = !studentId || a.student_id === studentId;
      const matchSearch = !q ||
        a.student_name.toLowerCase().includes(q) ||
        a.roll_no.toLowerCase().includes(q) ||
        a.subject_name.toLowerCase().includes(q) ||
        a.subject_code.toLowerCase().includes(q);
      return matchStudent && matchSearch;
    });

    renderAttendance(filtered);
  }

  if (filterStudent) filterStudent.addEventListener('change', applyAttendanceFilter);
  if (searchInput) searchInput.addEventListener('input', applyAttendanceFilter);

  const form = document.getElementById('attendance-form');
  if (form) form.addEventListener('submit', handleAttendanceFormSubmit);
}

function openAddAttendanceModal() {
  document.getElementById('modal-att-title').textContent = 'Record Student Attendance';
  document.getElementById('attendance-form').reset();
  document.getElementById('input-att-student').disabled = false;
  document.getElementById('input-att-subject').disabled = false;
  document.getElementById('preview-attendance-pct').textContent = '0%';
  document.getElementById('preview-attendance-status').className = 'badge badge-danger';
  document.getElementById('preview-attendance-status').textContent = 'Low (< 60%)';
  document.getElementById('attendance-modal-backdrop').classList.add('active');
}

function openEditAttendanceModal(studentId, subjectId, total, present) {
  document.getElementById('modal-att-title').textContent = 'Edit Attendance Record';
  document.getElementById('input-att-student').value = studentId;
  document.getElementById('input-att-subject').value = subjectId;
  document.getElementById('input-total-classes').value = total;
  document.getElementById('input-present-classes').value = present;

  document.getElementById('input-present-classes').dispatchEvent(new Event('input'));
  document.getElementById('attendance-modal-backdrop').classList.add('active');
}

function closeAttendanceModal() {
  document.getElementById('attendance-modal-backdrop').classList.remove('active');
}

async function handleAttendanceFormSubmit(e) {
  e.preventDefault();
  const studentId = document.getElementById('input-att-student').value;
  const subjectId = document.getElementById('input-att-subject').value;
  const total = parseInt(document.getElementById('input-total-classes').value, 10);
  const present = parseInt(document.getElementById('input-present-classes').value, 10);

  if (!studentId || !subjectId) {
    showToast("Please select a student and a subject", "warning");
    return;
  }

  if (present < 0 || total <= 0) {
    showToast("Please enter valid positive numbers", "warning");
    return;
  }

  if (present > total) {
    showToast("Present classes cannot exceed total classes", "warning");
    return;
  }

  try {
    await window.dbService.saveAttendance({
      student_id: studentId,
      subject_id: subjectId,
      total_classes: total,
      present_classes: present
    });
    showToast("Attendance updated successfully!", "success");
    closeAttendanceModal();
    await loadAttendance();
  } catch (err) {
    console.error("Failed to save attendance:", err);
    showToast(err.message || "Failed to save attendance", "error");
  }
}

async function confirmDeleteAttendance(id) {
  if (confirm("Are you sure you want to delete this attendance record?")) {
    try {
      await window.dbService.deleteAttendance(id);
      showToast("Attendance record removed", "success");
      await loadAttendance();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast(err.message || "Failed to delete attendance", "error");
    }
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
