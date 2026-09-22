import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MonthlyDeliveriesChart = ({ data = [] }) => {
  // ⭐ Adaptive width based on number of points
  const pointCount = data.length;
  const maxThickness =
    pointCount <= 2 ? 160 :
    pointCount <= 3 ? 120 :
    pointCount <= 6 ? 70 :
    pointCount <= 12 ? 45 :
    30;

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Weight (kg)',
        data: data.map((d) => d.weight),
        backgroundColor: 'rgba(40, 167, 69, 0.85)',
        hoverBackgroundColor: 'rgba(40, 167, 69, 1)',
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: maxThickness,
        categoryPercentage: 0.95,   // ⭐ Bars fill almost the entire category
        barPercentage: 0.9,         // ⭐ Bars fill almost the entire slot
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 12,
        bottom: 8,
        left: 40,      // ⭐ Push chart inward from edges
        right: 40,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        cornerRadius: 6,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 12 },
        displayColors: false,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y.toLocaleString()} kg`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#6b7280',
          padding: 8,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
          drawBorder: false,
        },
        border: { display: false },
        ticks: {
          font: { size: 11 },
          color: '#6b7280',
          padding: 8,
          callback: (v) => `${v} kg`,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default MonthlyDeliveriesChart;