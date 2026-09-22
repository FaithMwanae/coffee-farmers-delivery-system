import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const TopFarmersChart = ({ data }) => {
  const chartData = {
    labels: data.map((f) => f.name),
    datasets: [
      {
        label: 'Total Delivered (kg)',
        data: data.map((f) => f.weight),
        backgroundColor: 'rgba(255, 193, 7, 0.8)',
        borderColor: 'rgba(255, 193, 7, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: 'y', // horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.parsed.x.toLocaleString()} kg` },
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { callback: (v) => `${v} kg` } },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default TopFarmersChart;