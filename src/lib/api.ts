import { SimulationParameters } from "@/components/ParameterControls";

// Define types for the API
export interface OrderbookEntry {
  price: number;
  size: number;
  total?: number;
  percentage?: number;
}

export interface OrderbookData {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  timestamp: number;
}

export interface MakerTakerProportion {
  maker: number;
  taker: number;
}

export interface PerformanceMetrics {
  processingLatency: number;
  uiUpdateLatency: number;
  endToEndLatency: number;
}

export interface SimulationResponse {
  slippage: number;
  fees: number;
  marketImpact: number;
  netCost: number;
  makerTakerProportion: MakerTakerProportion;
  performanceMetrics: PerformanceMetrics;
  timestamp: number;
}

export interface SimulationRequest {
  orderbookData: OrderbookData;
  parameters: SimulationParameters;
}

// API URL - can be configured based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Sends a simulation request to the backend API
 * @param orderbookData Current orderbook data
 * @param parameters Simulation parameters
 * @returns Simulation results
 */
export async function simulateTrade(
  orderbookData: OrderbookData,
  parameters: SimulationParameters,
): Promise<SimulationResponse> {
  try {
    const startTime = performance.now();

    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderbookData,
        parameters,
      } as SimulationRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Calculate client-side latency
    const endTime = performance.now();
    const clientLatency = endTime - startTime;

    console.log(`API request completed in ${clientLatency.toFixed(2)}ms`);
    console.log("Simulation results:", data);

    return data;
  } catch (error) {
    console.error("Error simulating trade:", error);
    throw error;
  }
}

/**
 * Checks if the backend API is available
 * @returns True if the API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
}
