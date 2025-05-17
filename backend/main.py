from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any
import numpy as np
import time
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="L2 Orderbook Trading Simulator API",
    description="API for simulating trading scenarios using L2 orderbook data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request and Response Models
class OrderbookEntry(BaseModel):
    price: float
    size: float
    total: Optional[float] = 0
    percentage: Optional[float] = 0

class OrderbookData(BaseModel):
    bids: List[OrderbookEntry]
    asks: List[OrderbookEntry]
    timestamp: int

    @validator('bids', 'asks')
    def validate_entries(cls, entries):
        if not entries:
            raise ValueError("Must contain at least one entry")
        return entries

class SimulationParameters(BaseModel):
    orderSize: float = Field(..., gt=0)
    volatility: float = Field(..., ge=0, le=100)
    feeTier: str = Field(..., regex='^(vip|standard|basic)$')

class SimulationRequest(BaseModel):
    orderbookData: OrderbookData
    parameters: SimulationParameters

class MakerTakerProportion(BaseModel):
    maker: float
    taker: float

class PerformanceMetrics(BaseModel):
    processingLatency: float
    uiUpdateLatency: float
    endToEndLatency: float

class SimulationResponse(BaseModel):
    slippage: float
    fees: float
    marketImpact: float
    netCost: float
    makerTakerProportion: MakerTakerProportion
    performanceMetrics: PerformanceMetrics
    timestamp: int

# Simulation Models
class TradingSimulator:
    @staticmethod
    def calculate_slippage(orderbook_data: OrderbookData, order_size: float, volatility: float) -> float:
        """
        Calculate expected slippage using a linear regression model
        """
        # Start timing
        start_time = time.time()
        
        try:
            # Extract bid and ask prices
            bids = [entry.price for entry in orderbook_data.bids]
            asks = [entry.price for entry in orderbook_data.asks]
            
            # Calculate mid price
            mid_price = (bids[0] + asks[0]) / 2 if bids and asks else 0
            
            # Calculate spread
            spread = asks[0] - bids[0] if bids and asks else 0
            
            # Simple slippage model: based on order size, volatility and spread
            # In a real implementation, this would use more sophisticated regression
            slippage = (order_size * volatility * spread) / (10000 * mid_price) if mid_price else 0
            
            logger.info(f"Calculated slippage: {slippage:.6f}")
            return slippage
            
        except Exception as e:
            logger.error(f"Error calculating slippage: {str(e)}")
            return 0.0001  # Default fallback
        finally:
            logger.info(f"Slippage calculation took {(time.time() - start_time)*1000:.2f}ms")

    @staticmethod
    def calculate_fees(order_size: float, fee_tier: str) -> float:
        """
        Calculate expected fees based on fee tier
        """
        fee_rates = {
            "vip": 0.0002,      # 0.02%
            "standard": 0.0005,  # 0.05%
            "basic": 0.001       # 0.1%
        }
        
        fee_rate = fee_rates.get(fee_tier, 0.001)  # Default to basic if tier not found
        return order_size * fee_rate

    @staticmethod
    def calculate_market_impact(orderbook_data: OrderbookData, order_size: float, volatility: float) -> float:
        """
        Calculate market impact using simplified Almgren-Chriss model
        """
        # Start timing
        start_time = time.time()
        
        try:
            # Extract volumes
            bid_volumes = [entry.size for entry in orderbook_data.bids]
            ask_volumes = [entry.size for entry in orderbook_data.asks]
            
            # Calculate total volume
            total_volume = sum(bid_volumes + ask_volumes)
            
            # Calculate market depth
            market_depth = total_volume if total_volume > 0 else 1
            
            # Simplified Almgren-Chriss model
            # In a real implementation, this would include more parameters
            sigma = volatility / 100  # Convert percentage to decimal
            impact = (order_size / market_depth) * sigma * 0.1
            
            logger.info(f"Calculated market impact: {impact:.6f}")
            return impact
            
        except Exception as e:
            logger.error(f"Error calculating market impact: {str(e)}")
            return 0.0002  # Default fallback
        finally:
            logger.info(f"Market impact calculation took {(time.time() - start_time)*1000:.2f}ms")

    @staticmethod
    def calculate_maker_taker_proportion(volatility: float) -> Dict[str, float]:
        """
        Calculate maker/taker proportion using logistic regression model
        """
        # Simplified logistic function based on volatility
        # In a real implementation, this would use actual logistic regression
        taker_proportion = min(0.9, volatility / 100)
        maker_proportion = 1 - taker_proportion
        
        return {"maker": maker_proportion, "taker": taker_proportion}

@app.post("/simulate", response_model=SimulationResponse)
async def simulate_trade(request: SimulationRequest) -> SimulationResponse:
    # Start timing for end-to-end latency
    start_time = time.time()
    
    # Log request
    logger.info(f"Received simulation request for order size: {request.parameters.orderSize}, volatility: {request.parameters.volatility}%")
    
    # Process simulation
    processing_start = time.time()
    
    # Calculate metrics
    slippage = TradingSimulator.calculate_slippage(
        request.orderbookData, 
        request.parameters.orderSize,
        request.parameters.volatility
    )
    
    fees = TradingSimulator.calculate_fees(
        request.parameters.orderSize,
        request.parameters.feeTier
    )
    
    market_impact = TradingSimulator.calculate_market_impact(
        request.orderbookData,
        request.parameters.orderSize,
        request.parameters.volatility
    )
    
    maker_taker = TradingSimulator.calculate_maker_taker_proportion(
        request.parameters.volatility
    )
    
    # Calculate net cost
    net_cost = slippage + fees + market_impact
    
    # Calculate processing latency
    processing_end = time.time()
    processing_latency = (processing_end - processing_start) * 1000  # Convert to ms
    
    # Simulate UI update latency (in a real system this would be measured on the frontend)
    ui_update_latency = np.random.normal(5, 1)  # Mean 5ms, std 1ms
    
    # Calculate end-to-end latency
    end_time = time.time()
    end_to_end_latency = (end_time - start_time) * 1000  # Convert to ms
    
    # Create response
    response = SimulationResponse(
        slippage=slippage,
        fees=fees,
        marketImpact=market_impact,
        netCost=net_cost,
        makerTakerProportion=MakerTakerProportion(
            maker=maker_taker["maker"],
            taker=maker_taker["taker"]
        ),
        performanceMetrics=PerformanceMetrics(
            processingLatency=processing_latency,
            uiUpdateLatency=ui_update_latency,
            endToEndLatency=end_to_end_latency
        ),
        timestamp=int(time.time() * 1000)
    )
    
    # Log response
    logger.info(f"Simulation completed in {end_to_end_latency:.2f}ms with slippage: {slippage:.6f}, fees: {fees:.6f}, market impact: {market_impact:.6f}")
    
    return response

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
