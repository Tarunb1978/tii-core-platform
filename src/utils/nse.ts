// lib/nse.ts
import { NseIndia } from "stock-nse-india";

const nse = new NseIndia();

export async function getStockDetails(symbol: string) {
  return await nse.getEquityDetails(symbol);
}

export async function getAllSymbols() {
  return await nse.getAllStockSymbols();
}

export async function getEquityHistoricalData(symbol: string, range: any) {
  return await nse.getEquityHistoricalData(symbol, range);
}