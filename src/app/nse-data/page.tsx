import { getStockDetails, getEquityHistoricalData } from "@/utils/nse";
import { redirect } from "next/navigation";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ symbol?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const symbol = params.symbol || "INFY";
  const start = params.start || "2020-01-01";
  const end = params.end || "2023-12-31";

  let details: any = null;
  let historical: any = null;

  try {
    details = await getStockDetails(symbol);
    historical = await getEquityHistoricalData(symbol, { start, end });
  } catch (err) {
    console.error("Error fetching stock data:", err);
  }

  // 🔹 Search by symbol
  async function searchStock(formData: FormData) {
    "use server";
    const newSymbol = formData.get("symbol")?.toString().toUpperCase();
    if (!newSymbol) return;
    redirect(`/nse-data?symbol=${newSymbol}&start=${start}&end=${end}`);
  }

  // 🔹 Search by range
  async function searchRange(formData: FormData) {
    "use server";
    const newStart = formData.get("start")?.toString();
    const newEnd = formData.get("end")?.toString();
    redirect(`/nse-data?symbol=${symbol}&start=${newStart}&end=${newEnd}`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Stock Search</h1>

      {/* Symbol Search Form */}
      <form action={searchStock} className="flex gap-2 mb-6">
        <input
          type="text"
          name="symbol"
          defaultValue={symbol}
          placeholder="Enter stock symbol (e.g., TCS, IRCTC)"
          className="border p-2 rounded flex-1"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {/* Range Search Form */}
      <form action={searchRange} className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            name="start"
            defaultValue={start}
            className="border p-2 rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="date"
            name="end"
            defaultValue={end}
            className="border p-2 rounded w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-green-600 text-white px-4 rounded self-end hover:bg-green-700"
        >
          Get History
        </button>
      </form>

      {/* Stock Details */}
      {details && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">
            Stock Details for {symbol}
          </h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      )}

      {/* Historical Data */}
      {historical && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Historical Data ({start} → {end})
          </h2>
          <pre className="bg-gray-900 text-yellow-300 p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(historical, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
