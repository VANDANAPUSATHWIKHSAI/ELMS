const fetch = require('node-fetch');
async function test() {
  const r = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: '562', password: 'password123' })
  });
  const { token } = await r.json();
  const r2 = await fetch('http://localhost:5000/api/users/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ currentPassword: 'password123', newPassword: 'new' })
  });
  console.log(r2.status, await r2.json());
}
test();
