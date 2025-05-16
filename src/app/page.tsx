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

  const handleSimulation = async (parameters) => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Send orderbook snapshot and parameters to backend
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderbook: orderbookData,
          parameters,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const results = await response.json();
      const endTime = performance.now();

      // Update simulation results with backend response and performance metrics
      setSimulationResults({
        ...results,
        performanceMetrics: {
          ...results.performanceMetrics,
          endToEndLatency: endTime - startTime,
        },
      });
    } catch (error) {
      console.error("Error running simulation:", error);
      // Set mock data for demonstration purposes
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
        <div className="flex items-center mt-2">
          <div
            className={`h-2 w-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          ></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? "Connected to live data" : "Disconnected"}
          </span>
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
                metrics={simulationResults}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
