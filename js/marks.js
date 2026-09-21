/**
 * ============================================================================
 * Marks Management Controller (Admin)
 * ============================================================================
 */

let allMarks = [];
let studentsList = [];
let subjectsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  auth.protectRoute('admin');
  await Promise.all([loadStudentsAndSubjects(), loadMarks()]);
  setupMarksEvents();
});

async function loadStudentsAndSubjects() {
  try {
    [studentsList, subjectsList] = await Promise.all([
      window.dbService.getStudents(),
      window.dbService.getSubjects()
    ]);

    // Populate dropdowns in the modal and filter
    populateDropdowns();
  } catch (err) {
    console.error("Error loading dropdown data:", err);
  }
}

function populateDropdowns() {
  const studentSelect = document.getElementById('input-mark-student');
  const subjectSelect = document.getElementById('input-mark-subject');
  const filterStudent = document.getElementById('filter-marks-student');

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

async function loadMarks() {
  try {
    allMarks = await window.dbService.getMarks();
    renderMarks(allMarks);
  } catch (err) {
    console.error("Error loading marks:", err);
    showToast("Error loading marks", "error");
  }
}

function renderMarks(marks) {
  const tbody = document.getElementById('marks-table-body');
  const badge = document.getElementById('marks-count-badge');
  if (badge) badge.textContent = `${marks.length} Records`;

  if (!tbody) return;

  if (marks.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-icon">📝</div>
          <div class="empty-title">No Marks Recorded</div>
          <p class="empty-desc">Enter marks using the 'Add / Update Marks' button.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = marks.map(m => {
    let gradeBadge = 'badge-success';
    if (m.grade === 'F') gradeBadge = 'badge-danger';
    else if (m.grade === 'C' || m.grade === 'D') gradeBadge = 'badge-warning';

    return `
      <tr>
        <td><strong>${escapeHtml(m.roll_no)}</strong></td>
        <td>${escapeHtml(m.student_name)}</td>
        <td>
          <span class="badge badge-primary">${escapeHtml(m.subject_code)}</span>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(m.subject_name)}</div>
        </td>
        <td>${m.internal_marks} / 40</td>
        <td>${m.external_marks} / 60</td>
        <td><strong>${m.total_marks} / 100</strong></td>
        <td><span class="badge ${gradeBadge}">${m.grade}</span></td>
        <td>
          <div class="table-actions">
            <button onclick="openEditMarksModal('${m.student_id}', '${m.subject_id}', ${m.internal_marks}, ${m.external_marks})" class="btn btn-sm btn-secondary" title="Edit">✏️</button>
            <button onclick="confirmDeleteMarks('${m.id || m.mark_id}')" class="btn btn-sm btn-danger" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function setupMarksEvents() {
  const internalInput = document.getElementById('input-internal-marks');
  const externalInput = document.getElementById('input-external-marks');

  function updateCalculatedPreview() {
    const internal = Math.min(40, Math.max(0, parseFloat(internalInput?.value) || 0));
    const external = Math.min(60, Math.max(0, parseFloat(externalInput?.value) || 0));
    const total = internal + external;

    let grade = 'F';
    if (total >= 90) grade = 'A+';
    else if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B+';
    else if (total >= 60) grade = 'B';
    else if (total >= 50) grade = 'C';
    else if (total >= 40) grade = 'D';

    const totalEl = document.getElementById('preview-total-marks');
    const gradeEl = document.getElementById('preview-grade');
    if (totalEl) totalEl.textContent = total;
    if (gradeEl) gradeEl.textContent = grade;
  }

  if (internalInput) internalInput.addEventListener('input', updateCalculatedPreview);
  if (externalInput) externalInput.addEventListener('input', updateCalculatedPreview);

  // Filters
  const filterStudent = document.getElementById('filter-marks-student');
  const searchInput = document.getElementById('marks-search');

  function applyMarksFilter() {
    const studentId = filterStudent?.value || '';
    const q = (searchInput?.value || '').trim().toLowerCase();

    const filtered = allMarks.filter(m => {
      const matchStudent = !studentId || m.student_id === studentId;
      const matchSearch = !q ||
        m.student_name.toLowerCase().includes(q) ||
        m.roll_no.toLowerCase().includes(q) ||
        m.subject_name.toLowerCase().includes(q) ||
        m.subject_code.toLowerCase().includes(q);
      return matchStudent && matchSearch;
    });

    renderMarks(filtered);
  }

  if (filterStudent) filterStudent.addEventListener('change', applyMarksFilter);
  if (searchInput) searchInput.addEventListener('input', applyMarksFilter);

  const form = document.getElementById('marks-form');
  if (form) form.addEventListener('submit', handleMarksFormSubmit);
}

function openAddMarksModal() {
  document.getElementById('modal-marks-title').textContent = 'Enter / Update Student Marks';
  document.getElementById('marks-form').reset();
  document.getElementById('input-mark-student').disabled = false;
  document.getElementById('input-mark-subject').disabled = false;
  document.getElementById('preview-total-marks').textContent = '0';
  document.getElementById('preview-grade').textContent = 'F';
  document.getElementById('marks-modal-backdrop').classList.add('active');
}

function openEditMarksModal(studentId, subjectId, internal, external) {
  document.getElementById('modal-marks-title').textContent = 'Edit Student Marks';
  document.getElementById('input-mark-student').value = studentId;
  document.getElementById('input-mark-subject').value = subjectId;
  document.getElementById('input-internal-marks').value = internal;
  document.getElementById('input-external-marks').value = external;
  
  // Trigger preview update
  document.getElementById('input-internal-marks').dispatchEvent(new Event('input'));
  document.getElementById('marks-modal-backdrop').classList.add('active');
}

function closeMarksModal() {
  document.getElementById('marks-modal-backdrop').classList.remove('active');
}

async function handleMarksFormSubmit(e) {
  e.preventDefault();
  const studentId = document.getElementById('input-mark-student').value;
  const subjectId = document.getElementById('input-mark-subject').value;
  const internal = parseFloat(document.getElementById('input-internal-marks').value);
  const external = parseFloat(document.getElementById('input-external-marks').value);

  if (!studentId || !subjectId) {
    showToast("Please select both a student and a subject", "warning");
    return;
  }

  if (internal < 0 || internal > 40) {
    showToast("Internal marks must be between 0 and 40", "warning");
    return;
  }

  if (external < 0 || external > 60) {
    showToast("External marks must be between 0 and 60", "warning");
    return;
  }

  try {
    await window.dbService.saveMarks({
      student_id: studentId,
      subject_id: subjectId,
      internal_marks: internal,
      external_marks: external
    });
    showToast("Marks recorded successfully!", "success");
    closeMarksModal();
    await loadMarks();
  } catch (err) {
    console.error("Failed to save marks:", err);
    showToast(err.message || "Failed to save marks", "error");
  }
}

async function confirmDeleteMarks(id) {
  if (confirm("Are you sure you want to delete this marks entry?")) {
    try {
      await window.dbService.deleteMarks(id);
      showToast("Marks entry removed", "success");
      await loadMarks();
    } catch (err) {
      console.error("Delete failed:", err);
      showToast(err.message || "Failed to delete marks", "error");
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
