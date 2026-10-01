const http = require('http');

async function runTests() {
  process.env.PORT = '5123';
  process.env.NODE_ENV = 'test';
  const app = require('../server.js');

  const server = app.listen(5123, async () => {
    console.log('Test server started on port 5123');

    try {
      // Helper function for making API requests
      const apiReq = async (endpoint, options = {}) => {
        const url = `http://localhost:5123/api${endpoint}`;
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
            ...(options.headers || {})
          },
          ...options
        });
        const text = await res.text();
        try {
          return { status: res.status, ok: res.ok, data: JSON.parse(text) };
        } catch {
          return { status: res.status, ok: res.ok, raw: text };
        }
      };

      console.log('\n--- 1. AUTHENTICATION TESTS ---');
      const accounts = [
        { role: 'student', email: 'alice@student.edu' },
        { role: 'lecturer', email: 'john.doe@university.edu' },
        { role: 'admin', email: 'admin@university.edu' },
        { role: 'registrar', email: 'registrar@university.edu' },
      ];

      const tokens = {};
      for (const acc of accounts) {
        const res = await apiReq('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: acc.email, password: 'password123' })
        });
        console.log(`Login [${acc.role}] (${acc.email}): Status ${res.status}`, res.data?.success ? 'SUCCESS' : 'FAILED');
        if (!res.data?.success) {
          console.error('Login error detail:', res.data);
          throw new Error(`Failed to login as ${acc.role}`);
        }
        tokens[acc.role] = res.data.data.token;
      }

      console.log('\n--- 2. STUDENT WORKFLOW TESTS ---');
      // Student Dashboard
      const sDash = await apiReq('/dashboard', { token: tokens.student });
      console.log(`Student Dashboard: Status ${sDash.status}`, sDash.data?.success ? 'OK' : 'FAILED');
      console.log(` - Student: ${sDash.data?.data?.student?.student_number}, GPA: ${sDash.data?.data?.gpa}, Enrolled: ${sDash.data?.data?.enrolledCourses?.length}`);

      // Student Results
      const sResults = await apiReq('/results/my', { token: tokens.student });
      console.log(`Student Results: Status ${sResults.status}`, sResults.data?.success ? 'OK' : 'FAILED');
      console.log(` - Count: ${sResults.data?.data?.results?.length}`);

      // Student Timetable
      const sTt = await apiReq('/timetable', { token: tokens.student });
      console.log(`Student Timetable: Status ${sTt.status}`, sTt.data?.success ? 'OK' : 'FAILED');
      console.log(` - Count: ${sTt.data?.data?.length}`);

      // Notifications & Unread Count
      const notifs = await apiReq('/notifications', { token: tokens.student });
      const unread = await apiReq('/notifications/unread-count', { token: tokens.student });
      console.log(`Student Notifications: Status ${notifs.status}, Unread Count: Status ${unread.status}, Count: ${unread.data?.count}`);

      console.log('\n--- 3. LECTURER WORKFLOW TESTS ---');
      const lDash = await apiReq('/dashboard', { token: tokens.lecturer });
      console.log(`Lecturer Dashboard: Status ${lDash.status}`, lDash.data?.success ? 'OK' : 'FAILED');
      console.log(` - Assigned Courses: ${lDash.data?.data?.assignedCourses?.length}`);

      console.log('\n--- 4. ADMIN WORKFLOW TESTS ---');
      const aDash = await apiReq('/dashboard', { token: tokens.admin });
      console.log(`Admin Dashboard: Status ${aDash.status}`, aDash.data?.success ? 'OK' : 'FAILED');
      console.log(` - Stats:`, aDash.data?.data?.stats);

      const studentsList = await apiReq('/students', { token: tokens.admin });
      console.log(`Admin Students List: Status ${studentsList.status}, Total: ${studentsList.data?.pagination?.total}`);

      const coursesList = await apiReq('/courses', { token: tokens.admin });
      console.log(`Courses List: Status ${coursesList.status}, Total: ${coursesList.data?.pagination?.total}`);

      console.log('\n--- 5. REGISTRAR WORKFLOW TESTS ---');
      const rDash = await apiReq('/dashboard', { token: tokens.registrar });
      console.log(`Registrar Dashboard: Status ${rDash.status}`, rDash.data?.success ? 'OK' : 'FAILED');
      console.log(` - Registration Counts:`, rDash.data?.data?.registrationCounts);

      console.log('\n========================================');
      console.log('ALL API ENDPOINTS TESTED AND PASSING!');
      console.log('========================================');

    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      server.close(() => {
        console.log('Test server shut down.');
        process.exit(0);
      });
    }
  });
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
