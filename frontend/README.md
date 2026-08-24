# Campus Recycle frontend

React frontend for the Campus Recycle marketplace, built with Vite.

## Local development

```bash
npm install
npm start
```

The development server runs on `http://localhost:5173` by default. Set either `VITE_BASE_URL` or the legacy-compatible `REACT_APP_BASE_URL` to the backend API root; otherwise it uses `http://localhost:4000/api/v1`.

## Quality checks

```bash
npm run lint
npm test
npm run build
```

The production output is written to `dist/`. The included Dockerfile builds that directory and serves it as a single-page application on port 3000.
