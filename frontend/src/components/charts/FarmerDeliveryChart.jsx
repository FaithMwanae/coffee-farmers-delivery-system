import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const FarmerDeliveryChart = ({ deliveries }) => {
  // Aggregate by month
  const byMonth = {};
  deliveries.forEach((d) => {
    const m = new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    byMonth[m] = (byMonth[m] || 0) + Number(d.weight);
  });

  const labels = Object.keys(byMonth);
  const values = Object.values(byMonth);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Weight (kg)',
        data: values,
        borderColor: 'rgba(40, 167, 69, 1)',
        backgroundColor: 'rgba(40, 167, 69, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.y} kg` } },
    },
    scales: { y: { beginAtZero: true } },
  };

  if (labels.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <div style={{ fontSize: '3rem' }}>📦</div>
        <p>No deliveries recorded yet</p>
      </div>
    );
  }

  return <Line data={chartData} options={options} />;
};

export default FarmerDeliveryChart;