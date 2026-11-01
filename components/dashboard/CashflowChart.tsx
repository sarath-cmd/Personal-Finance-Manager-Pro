"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

export default function CashflowChart({
  series,
}: {
  series: { label: string; income: number; expense: number }[];
}) {
  return (
    <Bar
      data={{
        labels: series.map((s) => s.label),
        datasets: [
          {
            label: "Income",
            data: series.map((s) => s.income),
            backgroundColor: "#10b981",
            borderRadius: 6,
          },
          {
            label: "Expenses",
            data: series.map((s) => s.expense),
            backgroundColor: "#ef4444",
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: { y: { beginAtZero: true } },
      }}
    />
  );
}
