# SplitMint Frontend

## Environment Variables

Create a `.env` file in the frontend directory with the following:

```
VITE_API_URL=http://localhost:8080/api
```

For production on Render, set the environment variable in your Render dashboard:
- Key: `VITE_API_URL`
- Value: `https://your-backend-app.onrender.com/api`

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

The build output will be in the `dist` directory.

## Deployment on Render

1. Connect your GitHub repository to Render
2. Set the build command: `npm install && npm run build`
3. Set the publish directory: `dist`
4. Add environment variable: `VITE_API_URL` with your backend URL
5. Deploy!

## Project Structure

```
src/
├── components/     # Reusable React components
├── context/        # React Context providers
├── pages/          # Page components
├── services/       # API services
│   ├── api.js      # Centralized API configuration
│   ├── authService.js
│   ├── groupService.js
│   ├── expenseService.js
│   └── balanceService.js
└── utils/          # Utility functions
```
