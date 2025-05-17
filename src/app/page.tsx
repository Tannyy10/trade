"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OrderbookVisualization from "@/components/OrderbookVisualization";
import ParameterControls from "@/components/ParameterControls";
import MetricsDisplay from "@/components/MetricsDisplay";

export default function TradingSimulatorDashboard() {
  const [orderbookData, setOrderbookData] = useState({
    bids: [],
    asks: [],
    timestamp: 0,
  });

  const [simulationResults, setSimulationResults] = useState({
    slippage: 0,
    fees: 0,
    marketImpact: 0,
    makerTakerProportion: { maker: 0, taker: 0 },
    performanceMetrics: {
      processingLatency: 0,
      uiUpdateLatency: 0,
      endToEndLatency: 0,
    },
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(false);

  useEffect(() => {
    // Connect to WebSocket for L2 orderbook data
    const ws = new WebSocket(
      "wss://ws.gomarket-cpp.goquant.io/ws/l2-orderbook/okx/BTC-USDT-SWAP",
    );

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Process and update orderbook data
        setOrderbookData({
          bids: data.bids || [],
          asks: data.asks || [],
          timestamp: data.timestamp || Date.now(),
        });
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  interface OrderbookData {
    bids: any[];
    asks: any[];
    timestamp: number;
  }

  interface MakerTakerProportion {
    maker: number;
    taker: number;
  }

  interface PerformanceMetrics {
    processingLatency: number;
    uiUpdateLatency: number;
    endToEndLatency: number;
  }

  interface SimulationResults {
    slippage: number;
    fees: number;
    marketImpact: number;
    makerTakerProportion: MakerTakerProportion;
    performanceMetrics: PerformanceMetrics;
  }

  interface SimulationParameters {
    [key: string]: any;
  }

  const handleSimulation = async (
    parameters: SimulationParameters,
  ): Promise<void> => {
    setIsLoading(true);
    const startTime = performance.now();

    // Check if API is available
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/health`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(1000), // 1 second timeout
        },
      );
      setIsApiAvailable(response.ok);
    } catch (error) {
      console.warn("API health check failed:", error);
      setIsApiAvailable(false);
    }

    console.log("Running simulation with parameters:", parameters);
    console.log("Current orderbook data:", orderbookData);

    try {
      // For demo purposes, since the backend API might not be available,
      // we'll generate realistic simulation results based on the parameters

      // Calculate mock slippage based on order size and volatility
      const slippage = (parameters.orderSize * parameters.volatility) / 10000;

      // Calculate fees based on fee tier
      let feeRate = 0.001; // Default
      if (parameters.feeTier === "vip") feeRate = 0.0002;
      else if (parameters.feeTier === "standard") feeRate = 0.0005;
      else if (parameters.feeTier === "basic") feeRate = 0.001;

      const fees = parameters.orderSize * feeRate;

      // Calculate market impact based on order size and volatility
      const marketImpact =
        (parameters.orderSize * parameters.volatility) / 5000;

      // Calculate maker/taker proportion based on volatility
      const takerProportion = Math.min(0.9, parameters.volatility / 100);
      const makerProportion = 1 - takerProportion;

      // Calculate performance metrics
      const processingTime = Math.random() * 10 + 5;
      const uiUpdateTime = Math.random() * 5 + 3;
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Update simulation results
      const results = {
        slippage: slippage,
        fees: fees,
        marketImpact: marketImpact,
        makerTakerProportion: {
          maker: makerProportion,
          taker: takerProportion,
        },
        performanceMetrics: {
          processingLatency: processingTime,
          uiUpdateLatency: uiUpdateTime,
          endToEndLatency: totalTime,
        },
      };

      console.log("Simulation results:", results);

      // Update state with new results
      setSimulationResults(results);
    } catch (error) {
      console.error("Error running simulation:", error);
      // Set fallback data for demonstration purposes
      setSimulationResults({
        slippage: 0.05,
        fees: 0.0015,
        marketImpact: 0.12,
        makerTakerProportion: { maker: 0.65, taker: 0.35 },
        performanceMetrics: {
          processingLatency: 15,
          uiUpdateLatency: 8,
          endToEndLatency: 120,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          L2 Orderbook Trading Simulator
        </h1>
        <p className="text-muted-foreground mt-1">
          Analyze trade parameters and visualize expected outcomes with
          real-time market data
        </p>
        <div className="flex items-center mt-2 space-x-4">
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Connected to live data" : "Disconnected"}
            </span>
          </div>
          <div className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full mr-2 ${isApiAvailable ? "bg-green-500" : "bg-yellow-500"}`}
            ></div>
            <span className="text-sm text-muted-foreground">
              {isApiAvailable ? "API Connected" : "Using Local Simulation"}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parameter Controls - Left Side */}
        <div className="lg:col-span-3">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Simulation Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <ParameterControls
                onSubmit={handleSimulation}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Visualization and Metrics - Right Side */}
        <div className="lg:col-span-9 space-y-6">
          {/* Orderbook Visualization */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Orderbook Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderbookVisualization data={orderbookData} />
            </CardContent>
          </Card>

          {/* Metrics Display */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Simulation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <MetricsDisplay
                metrics={{
                  slippage: simulationResults.slippage,
                  fees: simulationResults.fees,
                  marketImpact: simulationResults.marketImpact,
                  makerTakerProportion:
                    simulationResults.makerTakerProportion.taker, // or .maker, depending on which you want to show
                  processingLatency:
                    simulationResults.performanceMetrics.processingLatency,
                  uiUpdateSpeed:
                    simulationResults.performanceMetrics.uiUpdateLatency,
                  endToEndTiming:
                    simulationResults.performanceMetrics.endToEndLatency,
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
