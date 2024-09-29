from flask import Flask, jsonify, request
import numpy as np
from kmeans import KMeans  # Import the KMeans implementation

app = Flask(__name__)

# Endpoint to generate a new dataset
@app.route('/generate', methods=['POST'])
def generate_data():
    data = np.random.rand(300, 2)  # Generate 300 random 2D points
    return jsonify(data.tolist())

# Endpoint to run KMeans with different initialization methods
@app.route('/cluster', methods=['POST'])
def cluster_data():
    data = np.array(request.json['data'])
    init_method = request.json['init_method']
    kmeans = KMeans(k=3, init_method=init_method)
    labels, centroids = kmeans.fit(data)
    return jsonify({'labels': labels.tolist(), 'centroids': centroids.tolist()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug = True, port=5000)
