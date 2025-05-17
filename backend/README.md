# L2 Orderbook Trading Simulator Backend

This FastAPI backend provides simulation capabilities for the L2 Orderbook Trading Simulator.

## Features

- POST `/simulate` endpoint for trade simulation
- Calculation of slippage, fees, market impact, and maker/taker proportion
- Performance metrics tracking
- CORS support for frontend integration

## Setup and Installation

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the server:
   ```
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Models

### Request Model

```json
{
  "orderbookData": {
    "bids": [
      {
        "price": 50000,
        "size": 1.5
      }
    ],
    "asks": [
      {
        "price": 50010,
        "size": 1.2
      }
    ],
    "timestamp": 1635739200000
  },
  "parameters": {
    "orderSize": 1.0,
    "volatility": 50,
    "feeTier": "standard"
  }
}
```

### Response Model

```json
{
  "slippage": 0.00025,
  "fees": 0.0005,
  "marketImpact": 0.00012,
  "netCost": 0.00087,
  "makerTakerProportion": {
    "maker": 0.5,
    "taker": 0.5
  },
  "performanceMetrics": {
    "processingLatency": 12.5,
    "uiUpdateLatency": 5.2,
    "endToEndLatency": 45.7
  },
  "timestamp": 1635739200000
}
```

## Extending the Backend

To add support for additional asset types or exchanges:

1. Create new model classes in `main.py` or separate them into modules
2. Implement exchange-specific calculation methods
3. Add new endpoints or parameters to the existing `/simulate` endpoint
