"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderbookEntry {
  price: number;
  size: number;
  total: number;
  percentage: number;
}

interface OrderbookData {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  timestamp: number;
}

// Create default entry factory function to prevent undefined values
const createDefaultEntry = (price: number): OrderbookEntry => ({
  price: price,
  size: 0,
  total: 0,
  percentage: 0,
});

interface OrderbookVisualizationProps {
  data?: OrderbookData;
  maxDepth?: number;
}

const OrderbookVisualization = ({
  data = {
    bids: Array(10)
      .fill(0)
      .map((_, i) => ({
        price: 50000 - i * 10,
        size: Math.random() * 5 + 0.5,
        total: 0,
        percentage: 0,
      })),
    asks: Array(10)
      .fill(0)
      .map((_, i) => ({
        price: 50010 + i * 10,
        size: Math.random() * 5 + 0.5,
        total: 0,
        percentage: 0,
      })),
    timestamp: Date.now(),
  },
  maxDepth = 10,
}: OrderbookVisualizationProps) => {
  // Initialize with safe default data
  const [processedData, setProcessedData] = useState<OrderbookData>({
    bids: data?.bids || [],
    asks: data?.asks || [],
    timestamp: data?.timestamp || Date.now(),
  });
  const [activeTab, setActiveTab] = useState<string>("orderbook");

  // Process the orderbook data to calculate totals and percentages
  useEffect(() => {
    if (!data) return;

    const processData = (entries: OrderbookEntry[] = []) => {
      let runningTotal = 0;
      return entries.map((entry) => {
        // Ensure entry has all required properties with defaults
        const safeEntry = {
          price: entry?.price ?? 0,
          size: entry?.size ?? 0,
          total: 0,
          percentage: 0,
        };

        runningTotal += safeEntry.size;
        return {
          ...safeEntry,
          total: runningTotal,
          percentage: 0, // Will be calculated after finding max total
        };
      });
    };

    const processedBids = processData((data.bids || []).slice(0, maxDepth));
    const processedAsks = processData((data.asks || []).slice(0, maxDepth));

    // Calculate percentages based on the maximum total value
    const maxTotal = Math.max(
      processedBids.length > 0
        ? processedBids[processedBids.length - 1].total
        : 0,
      processedAsks.length > 0
        ? processedAsks[processedAsks.length - 1].total
        : 0,
    );

    const calculatePercentages = (entries: OrderbookEntry[]) => {
      return entries.map((entry) => ({
        ...entry,
        percentage: maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0,
      }));
    };

    setProcessedData({
      bids: calculatePercentages(processedBids),
      asks: calculatePercentages(processedAsks),
      timestamp: data.timestamp || Date.now(),
    });
  }, [data, maxDepth]);

  // Safely get price from first ask or bid with fallback
  const getFirstAskPrice = () => {
    return processedData?.asks && processedData.asks.length > 0
      ? (processedData.asks[0]?.price ?? 0)
      : 0;
  };

  const getFirstBidPrice = () => {
    return processedData?.bids && processedData.bids.length > 0
      ? (processedData.bids[0]?.price ?? 0)
      : 0;
  };
  // Calculate spread
  const calculateSpread = () => {
    const askPrice = getFirstAskPrice();
    const bidPrice = getFirstBidPrice();

    return {
      absolute: askPrice - bidPrice,
      percentage: bidPrice !== 0 ? ((askPrice - bidPrice) / bidPrice) * 100 : 0,
    };
  };

  const spread = calculateSpread();
  // For timestamp display - avoiding hydration errors
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This will only run on the client, not during server rendering
    setMounted(true);
  }, []);

  return (
    <Card className="w-full h-full bg-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Orderbook Visualization</span>
          {mounted ? (
            <span className="text-sm text-muted-foreground">
              Last updated:{" "}
              {new Date(
                processedData.timestamp || Date.now(),
              ).toLocaleTimeString()}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Last updated: Loading...
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-[300px]">
            <TabsTrigger value="orderbook">Orderbook</TabsTrigger>
            <TabsTrigger value="depth">Depth Chart</TabsTrigger>
          </TabsList>
          <TabsContent value="orderbook" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 grid grid-cols-3 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Price (USDT)</div>
                <div className="text-center">Size (BTC)</div>
                <div className="text-right">Total</div>
              </div>

              {/* Asks (sell orders) - displayed in reverse order */}
              <div className="col-span-3">
                {(processedData.asks || [])
                  .slice()
                  .reverse()
                  .map((ask, index) => {
                    // Ensure ask has all required properties
                    const safeAsk = {
                      price: ask?.price ?? 0,
                      size: ask?.size ?? 0,
                      total: ask?.total ?? 0,
                      percentage: ask?.percentage ?? 0,
                    };

                    return (
                      <div
                        key={`ask-${index}`}
                        className="grid grid-cols-3 text-sm py-1 relative"
                      >
                        <div className="text-red-500">
                          {safeAsk.price.toFixed(2)}
                        </div>
                        <div className="text-center">
                          {safeAsk.size.toFixed(4)}
                        </div>
                        <div className="text-right">
                          {safeAsk.total.toFixed(4)}
                        </div>
                        <div
                          className="absolute right-0 top-0 h-full bg-red-500/10"
                          style={{ width: `${safeAsk.percentage}%` }}
                        />
                      </div>
                    );
                  })}
              </div>

              {/* Spread indicator */}
              <div className="col-span-3 text-center text-sm text-muted-foreground py-2 border-y">
                Spread: {(spread?.absolute ?? 0).toFixed(2)}(
                {(spread?.percentage ?? 0).toFixed(3)}%)
              </div>

              {/* Bids (buy orders) */}
              <div className="col-span-3">
                {(processedData.bids || []).map((bid, index) => {
                  // Ensure bid has all required properties
                  const safeBid = {
                    price: bid?.price ?? 0,
                    size: bid?.size ?? 0,
                    total: bid?.total ?? 0,
                    percentage: bid?.percentage ?? 0,
                  };

                  return (
                    <div
                      key={`bid-${index}`}
                      className="grid grid-cols-3 text-sm py-1 relative"
                    >
                      <div className="text-green-500">
                        {safeBid.price.toFixed(2)}
                      </div>
                      <div className="text-center">
                        {safeBid.size.toFixed(4)}
                      </div>
                      <div className="text-right">
                        {safeBid.total.toFixed(4)}
                      </div>
                      <div
                        className="absolute right-0 top-0 h-full bg-green-500/10"
                        style={{ width: `${safeBid.percentage}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="depth" className="mt-4">
            <div className="h-[350px] relative">
              {/* SVG for depth chart */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 700 350"
                preserveAspectRatio="none"
              >
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <line
                    key={`grid-${percent}`}
                    x1="0"
                    y1={350 - (percent / 100) * 350}
                    x2="700"
                    y2={350 - (percent / 100) * 350}
                    stroke="#333"
                    strokeWidth="0.5"
                    strokeDasharray="5,5"
                  />
                ))}

                {/* Asks depth curve */}
                <path
                  d={`M${350},${350} ${(processedData.asks || [])
                    .map((ask, i) => {
                      const x =
                        350 + i * (350 / (processedData.asks?.length || 1));
                      const y = 350 - ((ask?.percentage ?? 0) / 100) * 350;
                      return `L${x},${y}`;
                    })
                    .join(" ")} L700,350 Z`}
                  fill="rgba(239, 68, 68, 0.2)"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth="1.5"
                />

                {/* Bids depth curve */}
                <path
                  d={`M${350},${350} ${(processedData.bids || [])
                    .map((bid, i) => {
                      const x =
                        350 -
                        (i + 1) * (350 / (processedData.bids?.length || 1));
                      const y = 350 - ((bid?.percentage ?? 0) / 100) * 350;
                      return `L${x},${y}`;
                    })
                    .join(" ")} L0,350 Z`}
                  fill="rgba(34, 197, 94, 0.2)"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="1.5"
                />

                {/* Center line */}
                <line
                  x1="350"
                  y1="0"
                  x2="350"
                  y2="350"
                  stroke="#666"
                  strokeWidth="1"
                />
              </svg>

              {/* Labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-muted-foreground px-4">
                <div>Bids</div>
                <div>Price</div>
                <div>Asks</div>
              </div>

              {/* Y-axis labels */}
              <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-2">
                <div>100%</div>
                <div>75%</div>
                <div>50%</div>
                <div>25%</div>
                <div>0%</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrderbookVisualization;

// This function is not used and can be removed
