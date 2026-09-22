import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const RoleDistributionChart = ({ data }) => {
  const chartData = {
    labels: ['Farmers', 'Staff', 'Admins'],
    datasets: [
      {
        data: [data.farmers, data.staff, data.admins],
        backgroundColor: ['#28a745', '#007bff', '#343a40'],
        borderColor: '#fff',
        borderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    },
    cutout: '60%',
  };

  return <Doughnut data={chartData} options={options} />;
};

export default RoleDistributionChart;