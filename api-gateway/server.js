const express = require('express');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const app = express();
app.use(express.json());

// gRPC client
const PROTO_PATH = path.join(__dirname, 'proto', 'inference.proto');
const INFERENCE_ADDR = process.env.INFERENCE_ADDR || 'inference:50051';

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const proto = grpc.loadPackageDefinition(packageDef).inference;
const client = new proto.Inference(INFERENCE_ADDR, grpc.credentials.createInsecure());

// CORS setup
const corsOptions = {
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};
app.use(cors(corsOptions));
app.options('*', cors());

// Predict route
app.post('/api/predict', (req, res) => {
  const text = req.body?.text || '';
  if (!text.trim()) {
    return res.status(400).json({ error: 'Missing text input' });
  }

  client.Predict({ text }, (err, response) => {
    if (err) {
      console.error('gRPC error:', err);
      return res.status(500).json({ error: 'inference error', details: err.message });
    }
    res.json(response);
  });
});

// Health check
app.get("/", (req, res) => {
  res.send("API Gateway running");
});

// Start server
const port = process.env.PORT || 3001;
app.listen(port, "0.0.0.0", () => {
  console.log(`[api-gateway] HTTP server listening on ${port}, gRPC target ${INFERENCE_ADDR}`);
});
