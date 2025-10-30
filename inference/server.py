# server.py
from concurrent import futures
import grpc
import time
import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import inference_pb2 as inference_pb2
import inference_pb2_grpc as inference_pb2_grpc

# ======== Model Initialization ========
LOCAL_MODEL_PATH = "./distilbert-base-uncased-finetuned-sst-2-english/"

print("[inference-service] Loading DistilBERT model...")
try:
    tokenizer = AutoTokenizer.from_pretrained(LOCAL_MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(
        LOCAL_MODEL_PATH,
        local_files_only=True
    )
    model.eval()
    print(f"[inference-service] Model loaded successfully from {LOCAL_MODEL_PATH}")
except OSError as e:
    print(f"[ERROR] Could not load model from {LOCAL_MODEL_PATH}")
    print(f"Reason: {e}")
    exit(1)

# Label mapping for SST-2
LABEL_MAP = {0: "NEGATIVE", 1: "POSITIVE"}

# ======== gRPC Servicer ========
class InferenceServicer(inference_pb2_grpc.InferenceServicer):
    def Predict(self, request, context):
        text = request.text.strip()
        if not text:
            return inference_pb2.PredictResponse(
                score=0.0, label="NEUTRAL", model="distilbert-sst2"
            )

        # Tokenize and predict
        inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
            pred_idx = torch.argmax(probs).item()
            confidence = probs[0, pred_idx].item()

        label = LABEL_MAP.get(pred_idx, "UNKNOWN")

        print(f"[inference-service] Text: '{text}'=>{label} ({confidence:.4f})")

        # Build response
        return inference_pb2.PredictResponse(
            score=confidence,
            label=label,
            model="distilbert-sst2"
        )

# ======== gRPC Server ========
def serve():
    port = int(os.environ.get("SERVICE_PORT", 50051))
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    inference_pb2_grpc.add_InferenceServicer_to_server(InferenceServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    print(f"[inference-service] gRPC server started on port {port}")
    server.start()

    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        print("\n[inference-service] Shutting down...")
        server.stop(0)

if __name__ == "__main__":
    serve()
