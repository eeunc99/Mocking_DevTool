const path = require('path');
const fastify = require('fastify')({ logger: true });
const { match } = require('path-to-regexp');

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
});

const matchUserById = match('/users/:id', { decode: decodeURIComponent });

// ponytail: 프로젝트별 목데이터 하드코딩, DB/캐시는 이후 단계에서
const mockData = {
  'test-project': {
    users: [
      { id: 1, name: '김민준', email: 'kim.mj@mailinator.com' },
      { id: 2, name: '이서연', email: 'lee.sy@mailinator.com' },
    ],
  },
};

fastify.get('/', (req, reply) => reply.sendFile('index.html'));

fastify.get('/health', async () => ({ status: 'ok' }));

fastify.get('/p/:projectId/users', async (req, reply) => {
  const project = mockData[req.params.projectId];
  if (!project) return reply.code(404).send({ error: 'unknown project' });
  return project.users;
});

fastify.post('/p/:projectId/users', async (req, reply) => {
  const project = mockData[req.params.projectId];
  if (!project) return reply.code(404).send({ error: 'unknown project' });

  const nextId = project.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  const newUser = { id: nextId, ...req.body };
  project.users.push(newUser); // 같은 배열을 참조하므로 이후 GET에 즉시 반영됨
  return reply.code(201).send(newUser);
});

// catch-all: /users 같은 정적 경로는 위 라우트가 먼저 채가고,
// 여기는 그 외의 동적 경로(/users/:id 등)를 path-to-regexp로 직접 매칭
fastify.get('/p/:projectId/*', async (req, reply) => {
  const project = mockData[req.params.projectId];
  if (!project) return reply.code(404).send({ error: 'unknown project' });

  const subPath = '/' + (req.params['*'] || '');
  const hit = matchUserById(subPath);
  if (!hit) return reply.code(404).send({ error: 'no matching mock route', path: subPath });

  const user = project.users.find((u) => u.id === Number(hit.params.id));
  if (!user) return reply.code(404).send({ error: 'user not found' });
  return user;
});

fastify.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
