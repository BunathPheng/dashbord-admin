# Deploy Admin Dashboard

Build completed successfully. Follow these steps to deploy.

---

## Option 1: Vercel (Recommended)

Vercel is built for Next.js and deploys with one command.

### 1. Install Vercel CLI (if needed)
```bash
npm i -g vercel
```

### 2. Deploy
```bash
cd d:\installtion\Adminzip
vercel
```

- First time: you’ll be prompted to log in (create a free account at [vercel.com](https://vercel.com))
- Answer the prompts (link to existing project or create new)
- Your app will be deployed and you’ll get a URL like `https://your-app.vercel.app`

### 3. Set environment variables in Vercel

In the Vercel dashboard → Project → Settings → Environment Variables, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `AUTH_SECRET` | (generate with `openssl rand -base64 32`) | Required |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your deployed URL |
| `USE_MOCK_DATA` | `true` | For mock mode (no DB) |
| `DATABASE_URL` | (optional) | Only if using real DB |

### 4. Redeploy after adding env vars
```bash
vercel --prod
```

---

## Option 2: Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git
3. Build command: `npm run build`
4. Publish directory: `.next` (or use Next.js runtime)
5. Add the same environment variables as above

---

## Option 3: Self-hosted (Node.js server)

```bash
cd d:\installtion\Adminzip
npm run build
npm run start
```

Runs on `http://localhost:3000`. Use a process manager (PM2) and reverse proxy (nginx) for production.

---

## Production checklist

- [ ] Set `AUTH_SECRET` (never use the mock secret in production)
- [ ] Set `NEXTAUTH_URL` to your real domain
- [ ] If using a database: set `DATABASE_URL` and `USE_MOCK_DATA=false`
- [ ] Remove or change demo credentials from the login page
