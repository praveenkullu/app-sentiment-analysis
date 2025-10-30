# Use a prebuilt image with PyTorch + Transformers + dependencies
FROM huggingface/transformers-pytorch-cpu:latest

WORKDIR /app

# FIX: Create a symlink for 'python' to 'python3' as the original command uses 'python'
# This fixes the "/bin/sh: 1: python: not found" error
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Copy proto, model, and server
COPY ./proto ./proto
COPY inference/server.py .
COPY inference/requirements.txt .

# Install only the lightweight deps (gRPC + protobuf)
RUN pip install --no-cache-dir -r requirements.txt

COPY ./inference/distilbert-base-uncased-finetuned-sst-2-english ./distilbert-base-uncased-finetuned-sst-2-english

# Compile proto
RUN python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/inference.proto

ENV INFERENCE_PORT=50051
EXPOSE 50051

CMD ["python", "server.py"]
