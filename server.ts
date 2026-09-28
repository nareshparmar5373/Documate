import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health Check API
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'DocuMate — PDF & Document Tools',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    clientSidePrivacy: true,
  });
});

// Admin System Diagnostics API
app.get('/api/admin/metrics', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    uptimeSeconds: Math.round(process.uptime()),
    memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    features: {
      pdfProcessing: 'active',
      imageProcessing: 'active',
      documentScanning: 'active',
      letterGeneration: 'active',
      emiCalculation: 'active',
    },
  });
});

// Serve Vite production build artifacts
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`DocuMate server listening on port ${PORT}`);
});
