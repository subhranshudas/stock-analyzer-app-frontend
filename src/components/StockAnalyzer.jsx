// src/components/StockAnalyzer.jsx
import { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Bar,
} from "recharts";
import { Listbox } from "@headlessui/react";

const PERIODS = [
  { value: "7d", label: "7 Days" },
  { value: "1mo", label: "1 Month" },
  { value: "6mo", label: "6 Months" },
  { value: "2y", label: "2 Years" },
  { value: "5y", label: "5 Years" },
  { value: "10y", label: "10 Years" },
];

const formatNumber = (number) => {
  return number ? number.toFixed(2) : "0.00";
};

const StockAnalyzer = () => {
  const [ticker, setTicker] = useState("");
  const [period, setPeriod] = useState(PERIODS[1]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!ticker) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/stock/${ticker}?period=${period.value}`
      );
      console.log("API Response:", response.data);
      setData(response.data);
    } catch (err) {
      console.error("API Error:", err);
      setError(err.response?.data?.detail || "Error fetching data");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const renderMovingAveragesChart = () => {
    if (!data?.timeseries?.dates || !data?.timeseries?.price) return null;

    const chartData = data.timeseries.dates.map((date, i) => ({
      date,
      price: data.timeseries.price[i] || 0,
      ma50: data.timeseries.fifty_ma?.[i] || 0,
      ma200: data.timeseries.twohundred_ma?.[i] || 0,
    }));

    const movingAverages = data.analysis?.moving_averages || {};
    const {
      latest_price = 0,
      latest_50ma = 0,
      latest_200ma = 0,
      is_golden_cross = false,
    } = movingAverages;

    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Moving Averages</h2>
        <p className="text-gray-600 my-2">
          Moving averages help identify trends by smoothing out price
          fluctuations. The 50-day and 200-day moving averages are widely used
          indicators. When the 50-day crosses above the 200-day (Golden Cross),
          it&apos;s considered bullish; when it crosses below (Death Cross),
          it&apos;s considered bearish.
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              name="Price"
            />
            <Line
              type="monotone"
              dataKey="ma50"
              stroke="#16a34a"
              name="50 MA"
            />
            <Line
              type="monotone"
              dataKey="ma200"
              stroke="#dc2626"
              name="200 MA"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <h3 className="font-semibold">Analysis</h3>
          <p>Current Price: ${formatNumber(latest_price)}</p>
          <p>50-day MA: ${formatNumber(latest_50ma)}</p>
          <p>200-day MA: ${formatNumber(latest_200ma)}</p>
          <p className={is_golden_cross ? "text-green-600" : "text-red-600"}>
            {is_golden_cross
              ? "Golden Cross (Bullish)"
              : "Death Cross (Bearish)"}
          </p>
        </div>
      </div>
    );
  };

  const renderRSIChart = () => {
    if (!data?.timeseries?.dates || !data?.timeseries?.rsi) return null;

    const chartData = data.timeseries.dates.map((date, i) => ({
      date,
      rsi: data.timeseries.rsi[i] || 0,
    }));

    const rsiData = data.analysis?.rsi || {};
    const {
      current_rsi = 0,
      is_overbought = false,
      is_oversold = false,
    } = rsiData;

    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">
          RSI (Relative Strength Index)
        </h2>
        <p className="text-gray-600 my-2">
          RSI measures the speed and magnitude of recent price changes to
          evaluate whether a stock is overbought or oversold. Values above 70
          suggest the stock might be overbought (potentially overvalued), while
          values below 30 suggest it might be oversold (potentially
          undervalued).
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rsi" stroke="#8b5cf6" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <h3 className="font-semibold">Analysis</h3>
          <p>Current RSI: {formatNumber(current_rsi)}</p>
          <p
            className={
              is_overbought
                ? "text-red-600"
                : is_oversold
                ? "text-green-600"
                : "text-gray-600"
            }
          >
            {is_overbought
              ? "Overbought"
              : is_oversold
              ? "Oversold"
              : "Neutral"}
          </p>
        </div>
      </div>
    );
  };

  const renderVWAPChart = () => {
    if (!data?.timeseries?.dates || !data?.timeseries?.vwap) return null;

    const chartData = data.timeseries.dates.map((date, i) => ({
      date,
      price: data.timeseries.price[i] || 0,
      vwap: data.timeseries.vwap[i] || 0,
      volume: data.timeseries.volume[i] || 0,
    }));

    const vwapData = data.analysis?.vwap || {};
    const { current_vwap = 0, price_above_vwap = false } = vwapData;

    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">VWAP & Volume Analysis</h2>
        <p className="text-gray-600 my-2">
          Volume Weighted Average Price (VWAP) combines price and volume data to
          show the average price a stock has traded at throughout the day,
          weighted by volume. When price is above VWAP, it suggests buying
          pressure; when below, it suggests selling pressure. Volume bars show
          trading activity - higher volumes often validate price movements.
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="price"
              stroke="#2563eb"
              name="Price"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="vwap"
              stroke="#16a34a"
              name="VWAP"
            />
            <Bar
              yAxisId="right"
              dataKey="volume"
              fill="#6b7280"
              opacity={0.3}
              name="Volume"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <h3 className="font-semibold">Analysis</h3>
          <p>Current VWAP: ${formatNumber(current_vwap)}</p>
          <p className={price_above_vwap ? "text-green-600" : "text-red-600"}>
            Price is {price_above_vwap ? "above" : "below"} VWAP (
            {price_above_vwap ? "Bullish" : "Bearish"})
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker symbol (e.g., AAPL)"
            className="px-4 py-2 border rounded-lg"
          />
          <Listbox value={period} onChange={setPeriod}>
            <div className="relative">
              <Listbox.Button className="px-4 py-2 border rounded-lg bg-white">
                {period.label}
              </Listbox.Button>
              <Listbox.Options className="absolute mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                {PERIODS.map((period) => (
                  <Listbox.Option
                    key={period.value}
                    value={period}
                    className={({ active }) =>
                      `${active ? "bg-blue-100" : ""} px-4 py-2 cursor-pointer`
                    }
                  >
                    {period.label}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
          <button
            onClick={fetchData}
            disabled={loading || !ticker}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? "Loading..." : "Analyze"}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {data?.metadata && (
          <div className="space-y-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h1 className="text-2xl font-bold">
                {data.metadata.company_name || data.metadata.ticker} (
                {data.metadata.ticker})
              </h1>
              <p className="text-gray-600">
                {data.metadata.sector || "N/A"} |{" "}
                {data.metadata.industry || "N/A"}
              </p>
            </div>
            {renderMovingAveragesChart()}
            {renderRSIChart()}
            {renderVWAPChart()}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAnalyzer;
