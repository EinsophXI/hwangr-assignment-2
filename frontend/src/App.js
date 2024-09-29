import React, { useState, useRef} from 'react';
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

// Registering the necessary components
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const App = () => {
  const [dataset, setDataset] = useState([]);
  const [centroids, setCentroids] = useState([]);
  const [initializationMethod, setInitializationMethod] = useState('Random');
  const [numClusters, setNumClusters] = useState(3);
  const [clusterAssignments, setClusterAssignments] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleInitializationChange = (event) => {
    setInitializationMethod(event.target.value);
    setCurrentStep(0);
    setCentroids([]);
    setClusterAssignments(new Array(dataset.length).fill(-1));
  };

  const handleNumClustersChange = (event) => {
    const value = Number(event.target.value);
    if (value < 1) {
      alert('Number of clusters must be at least 1.');
      return;
    }
    if (value > dataset.length) {
      alert('Number of clusters cannot exceed number of data points.');
      return;
    }
    setNumClusters(value);
    setCurrentStep(0);
    setCentroids([]);
    setClusterAssignments(new Array(dataset.length).fill(-1));
  };

  const generateDataset = () => {
    if (isRunning) {
      alert('Cannot generate a new dataset while the algorithm is running.');
      return;
    }
    const data = Array.from({ length: 100 }, () => ({
      x: Math.random() * 20 - 10,
      y: Math.random() * 20 - 10,
    }));
    setDataset(data);
    setCurrentStep(0);
    setIsRunning(false);
    setClusterAssignments(new Array(data.length).fill(-1));
    setCentroids([]);
  };

  const selectCentroidsManually = (x, y) => {
    if (initializationMethod !== 'Manual') return;
    if (centroids.length >= numClusters) {
      alert(`You have already selected ${numClusters} centroids.`);
      return;
    }
    setCentroids((prev) => [...prev, { x, y }]);
  };

// Check if there are any changes in cluster assignments
const hasClusterChanged = (oldAssignments, newAssignments) => {
  return !oldAssignments.every((assignment, index) => assignment === newAssignments[index]);
};

const stepThroughKMeans = () => {
  if (isRunning) {
    console.log('Algorithm is already running.');
    return;
  }
  
  setIsRunning(true);
  console.log('Stepping through KMeans...');

  if (currentStep === 0) {
    if (initializationMethod === 'Manual' && centroids.length !== numClusters) {
      alert(`Please select ${numClusters} centroids manually.`);
      setIsRunning(false);
      return;
    }
    initializeCentroids();
    setCurrentStep(1);
    setIsRunning(false);
    return; // Exit after initialization
  }

  if (currentStep >= dataset.length) {
    alert('There are no more steps to perform.');
    setIsRunning(false);
    return; // Exit if no more steps
  }

  // Assign clusters and update centroids
  const newAssignments = assignClusters();

  // Check for changes in cluster assignments
  if (!hasClusterChanged(clusterAssignments, newAssignments)) {
    alert('No changes in cluster assignments. Please reset or modify the dataset.');
    setIsRunning(false);
    return;
  }

  setClusterAssignments(newAssignments);
  updateCentroids(newAssignments);
  setCurrentStep(prevStep => prevStep + 1);
  setIsRunning(false);
};

const convergeToFinal = async () => {
  initializeCentroids();
  setCurrentStep(1);
  setIsRunning(false);
  if (isRunning) {
    console.log('Algorithm is already running.');
    return;
  }
  setIsRunning(true);
  console.log('Converging to final result...');
  
  let localAssignments = clusterAssignments.slice();
  let localCentroids = centroids.slice();
  let hasConverged = false;
  let iteration = 0;
  const maxIterations = 1000; // Prevent infinite loops

  while (!hasConverged && iteration < maxIterations) {
    iteration++;
    console.log(`Iteration ${iteration}`);
    setCurrentStep(prevStep => prevStep + 1);
    const newAssignments = dataset.map(point => {
      let closestCentroidIndex = -1;
      let minDistance = Infinity;
      localCentroids.forEach((centroid, index) => {
        const distance = Math.sqrt((point.x - centroid.x) ** 2 + (point.y - centroid.y) ** 2);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroidIndex = index;
        }
      });
      return closestCentroidIndex;
    });

    // Check for convergence
    const isSame = newAssignments.every((assignment, idx) => assignment === localAssignments[idx]);
    if (isSame) {
      hasConverged = true;
      console.log('Convergence achieved.');
    } else {
      // Check for changes in cluster assignments
      if (!hasClusterChanged(localAssignments, newAssignments)) {
        alert('No changes in cluster assignments. Please reset or modify the dataset.');
        break; // Exit loop if no changes
      }
      localAssignments = newAssignments;
      setClusterAssignments(newAssignments);

      const newCentroids = localCentroids.map((centroid, index) => {
        const pointsInCluster = dataset.filter((_, i) => newAssignments[i] === index);
        if (pointsInCluster.length === 0) return centroid; // No change if no points are assigned
        const avgX = pointsInCluster.reduce((sum, point) => sum + point.x, 0) / pointsInCluster.length;
        const avgY = pointsInCluster.reduce((sum, point) => sum + point.y, 0) / pointsInCluster.length;
        return { x: avgX, y: avgY };
      });

      localCentroids = newCentroids;
      setCentroids(newCentroids);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!hasConverged) {
    console.log(`Reached maximum iterations (${maxIterations}) without convergence.`);
  }

  setCurrentStep(iteration);
  setIsRunning(false);
};



  const resetAlgorithm = () => {
    setCurrentStep(0);
    setIsRunning(false);
    setCentroids([]);
    setClusterAssignments(new Array(dataset.length).fill(-1));
  };

  const initializeCentroids = () => {
    let initialCentroids = [];
    if (initializationMethod === 'Random') {
      initialCentroids = dataset.sort(() => 0.5 - Math.random()).slice(0, numClusters);
    } else if (initializationMethod === 'Farthest First') {
      initialCentroids = farthestFirstInitialization();
    } else if (initializationMethod === 'KMeans++') {
      initialCentroids = kMeansPlusPlusInitialization();
    }
    setCentroids(initialCentroids);
  };

  const assignClusters = () => {
    return dataset.map(point => {
      let closestCentroidIndex = -1;
      let minDistance = Infinity;
      centroids.forEach((centroid, index) => {
        const distance = Math.sqrt((point.x - centroid.x) ** 2 + (point.y - centroid.y) ** 2);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroidIndex = index;
        }
      });
      return closestCentroidIndex;
    });
  };

  const updateCentroids = (assignments) => {
    const newCentroids = centroids.map((centroid, index) => {
      const pointsInCluster = dataset.filter((_, i) => assignments[i] === index);
      if (pointsInCluster.length === 0) return centroid;
      const avgX = pointsInCluster.reduce((sum, point) => sum + point.x, 0) / pointsInCluster.length;
      const avgY = pointsInCluster.reduce((sum, point) => sum + point.y, 0) / pointsInCluster.length;
      return { x: avgX, y: avgY };
    });
    setCentroids(newCentroids);
  };

  const farthestFirstInitialization = () => {
    const firstCentroid = dataset[Math.floor(Math.random() * dataset.length)];
    const centroids = [firstCentroid];

    while (centroids.length < numClusters) {
      const distances = dataset.map(point => Math.min(...centroids.map(c => Math.sqrt((point.x - c.x) ** 2 + (point.y - c.y) ** 2))));
      const nextCentroid = dataset[distances.indexOf(Math.max(...distances))];
      centroids.push(nextCentroid);
    }
    return centroids;
  };

  const kMeansPlusPlusInitialization = () => {
    const centroids = [];
    const firstCentroid = dataset[Math.floor(Math.random() * dataset.length)];
    centroids.push(firstCentroid);

    for (let i = 1; i < numClusters; i++) {
      const distances = dataset.map(point =>
        Math.min(...centroids.map(c => (point.x - c.x) ** 2 + (point.y - c.y) ** 2))
      );
      const nextCentroid = dataset[weightedRandomChoice(distances)];
      centroids.push(nextCentroid);
    }
    return centroids;
  };

  const weightedRandomChoice = (distances) => {
    const total = distances.reduce((acc, d) => acc + d, 0);
    const rand = Math.random() * total;
    let cumulative = 0;
    for (let i = 0; i < distances.length; i++) {
      cumulative += distances[i];
      if (cumulative >= rand) {
        return i;
      }
    }
    return distances.length - 1;
  };

  const colorPalette = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    // Add more colors if needed
  ];

  const PlotVisualization = ({ dataset, centroids, clusterAssignments, onClick }) => {
    const chartRef = useRef(null);

    const handleClick = (event) => {
      const { offsetX, offsetY } = event.native;
      const chart = chartRef.current;

      if (!chart) return;

      // Get the chart instance and the scales
      const xScale = chart.scales.x;
      const yScale = chart.scales.y;

      // Convert the click position to data point coordinates
      const x = xScale.getValueForPixel(offsetX);
      const y = yScale.getValueForPixel(offsetY);

      // Call the function to select centroids manually
      onClick(x, y);
    };

    const chartData = React.useMemo(() => ({
      datasets: [
        {
          label: 'Data Points',
          data: dataset.map((point, index) => ({
            x: point.x,
            y: point.y,
            cluster: clusterAssignments[index],
          })),
          backgroundColor: dataset.map((_, index) =>
            clusterAssignments[index] === -1
              ? 'rgba(75, 192, 192, 1)'
              : colorPalette[clusterAssignments[index] % colorPalette.length]
          ),
          pointRadius: 4,
        },
        {
          label: 'Centroids',
          data: centroids,
          backgroundColor: 'rgba(255, 0, 0, 1)',
          pointRadius: 6,
        },
      ],
    }), [dataset, centroids, clusterAssignments]);

    const options = {
      responsive: true,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'X Axis', // X Axis Title
            font: {
              weight: 'bold',
            },
          },
          grid: {
            drawOnChartArea: true, // Draw grid lines in the chart area
            drawBorder: true, // Draw the border line on the axis
            color: 'rgba(0, 0, 0, 0.1)', // Color of the grid lines
            lineWidth: 1, // Width of the grid lines
          },
          ticks: {
            font: {
              weight: 'bold',
            },
            min: -10, // Set minimum value for X-axis
            max: 10, // Set maximum value for X-axis
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Y Axis', // Y Axis Title
            font: {
              weight: 'bold',
            },
          },
          grid: {
            drawOnChartArea: true, // Draw grid lines in the chart area
            drawBorder: true, // Draw the border line on the axis
            color: 'rgba(0, 0, 0, 0.1)', // Color of the grid lines
            lineWidth: 1, // Width of the grid lines
          },
          ticks: {
            font: {
              weight: 'bold',
            },
            min: -10, // Set minimum value for Y-axis
            max: 10, // Set maximum value for Y-axis
          },
        },
      },
      onClick: handleClick,
    };


    return (
      <div style={{ cursor: 'pointer', width: '800px', height: '450px' }}>
        <h2>KMeans Clustering Visualization</h2>
        <Scatter ref={chartRef} data={chartData} options={options} />
      </div>
    );
  };

  return (
    <div>
      <h1>KMeans Clustering Algorithm</h1>
      <div>
        <button onClick={generateDataset} disabled={isRunning}>Generate Dataset</button>
        <button onClick={stepThroughKMeans} disabled={isRunning}>Step Through KMeans</button>
        <button onClick={convergeToFinal} disabled={isRunning}>Converge to Final</button>
        <button onClick={resetAlgorithm} disabled={isRunning}>Reset</button>
      </div>
      <div>
        <label>Initialization Method:</label>
        <select value={initializationMethod} onChange={handleInitializationChange} disabled={isRunning}>
          <option value="Random">Random</option>
          <option value="Farthest First">Farthest First</option>
          <option value="KMeans++">KMeans++</option>
          <option value="Manual">Manual</option>
        </select>
      </div>
      <div>
        <label>Number of Clusters:</label>
        <input type="number" value={numClusters} min="1" max={dataset.length} onChange={handleNumClustersChange} disabled={isRunning} />
      </div>
      <div>
        {initializationMethod === 'Manual' && (
          <p>Click on the plot to select {numClusters} centroids.</p>
        )}
      </div>
      <div>
        <PlotVisualization
          dataset={dataset}
          centroids={centroids}
          clusterAssignments={clusterAssignments}
          onClick={selectCentroidsManually}
        />
      </div>
      <div>
        <p>Current Step: {currentStep}</p>
      </div>
      <div>
        {Array.from({ length: numClusters }, (_, i) => (
          <p key={i}>Cluster {i + 1}: {clusterAssignments.filter(a => a === i).length} points</p>
        ))}
      </div>
    </div>
  );
};

export default App;
