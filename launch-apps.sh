# Kill existing Metro bundlers
kill $(lsof -ti:8081) 2>/dev/null
kill $(lsof -ti:8082) 2>/dev/null
kill $(lsof -ti:8083) 2>/dev/null
kill $(lsof -ti:8084) 2>/dev/null
kill $(lsof -ti:8085) 2>/dev/null
sleep 2

# Customer on port 8081
cd customer && EXPO_PUBLIC_API_URL=http://localhost:3001 npx expo start --port 8081 --web --no-dev 2>&1 &
sleep 5
echo "Customer started"

# Vendor on port 8082
cd ../vendor && EXPO_PUBLIC_API_URL=http://localhost:3001 npx expo start --port 8082 --web --no-dev 2>&1 &
sleep 5
echo "Vendor started"

# Partner on port 8083
cd ../partner && EXPO_PUBLIC_API_URL=http://localhost:3001 npx expo start --port 8083 --web --no-dev 2>&1 &
sleep 5
echo "Partner started"

echo "All apps launched"
