// server.js
const express = require('express');
// import express from 'express';
// import cors from 'cors';
// import grpc from '@grpc/grpc-js';
// import protoLoader from '@grpc/proto-loader';
// import path from 'path';
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const app = express();
app.use(express.json());

// ✅ Step 1 — Load gRPC client
const PROTO_PATH = path.join(__dirname, 'proto', 'inference.proto');
const INFERENCE_ADDR = process.env.INFERENCE_ADDR || 'inference-service:50051';

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const proto = grpc.loadPackageDefinition(packageDef).inference;
const client = new proto.Inference(INFERENCE_ADDR, grpc.credentials.createInsecure());

// ✅ Step 2 — CORS setup (MUST come before routes)
const corsOptions = {
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// ✅ Step 3 — Handle all OPTIONS requests globally
app.options('*', cors(corsOptions));

// ✅ Step 4 — API route
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

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[api-gateway] HTTP server listening on ${port}, gRPC target ${INFERENCE_ADDR}`);
});
