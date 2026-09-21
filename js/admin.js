/**
 * ============================================================================
 * Admin Dashboard Controller
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is authenticated admin
  auth.protectRoute('admin');

  await loadDashboardOverview();
});

async function loadDashboardOverview() {
  try {
    const stats = await window.dbService.getDashboardStats();
    
    document.getElementById('stat-total-students').textContent = stats.totalStudents;
    document.getElementById('stat-total-subjects').textContent = stats.totalSubjects;
    document.getElementById('stat-avg-attendance').textContent = stats.avgAttendance;
    document.getElementById('stat-avg-performance').textContent = stats.avgPerformance;

    // Load recent student enrollments
    const students = await window.dbService.getStudents();
    const recentStudents = students.slice(0, 5);
    const tbody = document.getElementById('recent-students-table');
    if (tbody) {
      if (recentStudents.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">No students found.</td></tr>`;
      } else {
        tbody.innerHTML = recentStudents.map(s => `
          <tr>
            <td><strong>${s.roll_no}</strong></td>
            <td>${s.name}</td>
            <td>${s.course}</td>
            <td>Semester ${s.semester}</td>
            <td><span class="badge badge-primary">Division ${s.division || 'A'}</span></td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error("Error loading admin dashboard stats:", err);
    showToast("Failed to load dashboard statistics", "error");
  }
}
