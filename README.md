# Doorstep Frontend

Next.js frontend workspace for the Doorstep platform.

Stack:
- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Redux Toolkit

Run locally:

```bash
npm run dev
```

Required environment:

```env
AUTH_SECRET=replace-with-a-long-random-secret
SOCIAL_AUTH_SHARED_SECRET=replace-with-a-shared-secret-used-by-the-backend
BACKEND_URL=http://127.0.0.1:4000
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:4000
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
```

Optional social login environment:

```env
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
```

Useful commands:

```bash
npm run build
npm run lint
npm run typecheck
```
