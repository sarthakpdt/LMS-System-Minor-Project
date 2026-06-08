#!/bin/bash
# Test if backend API is responding

echo "Testing backend API..."
curl -s http://localhost:5000/api/notifications/test/teacher \
  -H "Content-Type: application/json" | jq . || echo "Backend not responding or invalid response"

echo ""
echo "Testing POST endpoint..."
curl -s -X POST http://localhost:5000/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Test message","type":"info","targetRole":"student","createdBy":"testid","createdByName":"Test"}' | jq .

echo ""
echo "Done"
