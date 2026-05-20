const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve) => {
    const url = new URL(path, 'http://localhost:3000');
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, b: JSON.parse(data) }); }
        catch { resolve({ s: res.statusCode, b: data }); }
      });
    });
    r.on('error', e => resolve({ e: e.message }));
    r.setTimeout(8000, () => { r.destroy(); resolve({ e: 'timeout' }); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  const login = await req('POST', '/v1/auth/login', { username: 'admin', password: 'admin123' });
  console.log('Login:', login.s || login.e, login.b?.data?.token ? 'OK' : login.b?.message);
  if (!login.b?.data?.token) return;
  const token = login.b.data.token;

  const r1 = await req('GET', '/v1/recipes?page=1&pageSize=2', null, token);
  console.log('/recipes:', r1.s || r1.e, '| total:', r1.b?.data?.total, '| list:', r1.b?.data?.list?.length, '| msg:', r1.b?.message);

  const r2 = await req('GET', '/v1/analytics/dashboard', null, token);
  console.log('/analytics/dashboard:', r2.s || r2.e, '| totalRecipes:', r2.b?.data?.totalRecipes, '| msg:', r2.b?.message);
}

main().catch(e => console.error('Fatal:', e.message));
