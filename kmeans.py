# kmeans.py
import numpy as np
import random

class KMeans:
    def __init__(self, k=3, init_method='random'):
        self.k = k
        self.init_method = init_method
        self.centroids = None

    def initialize_centroids(self, data):
        if self.init_method == 'random':
            return data[random.sample(range(data.shape[0]), self.k)]
        elif self.init_method == 'farthest_first':
            centroids = [data[random.randint(0, data.shape[0] - 1)]]
            for _ in range(1, self.k):
                distances = np.array([min([np.linalg.norm(point - centroid) for centroid in centroids]) for point in data])
                centroids.append(data[np.argmax(distances)])
            return np.array(centroids)
        elif self.init_method == 'kmeans++':
            centroids = [data[random.randint(0, data.shape[0] - 1)]]
            for _ in range(1, self.k):
                distances = np.array([min([np.linalg.norm(point - centroid) for centroid in centroids]) for point in data])
                probabilities = distances / distances.sum()
                centroids.append(data[np.random.choice(range(data.shape[0]), p=probabilities)])
            return np.array(centroids)

    def fit(self, data):
        self.centroids = self.initialize_centroids(data)
        prev_centroids = np.zeros(self.centroids.shape)

        while not np.all(self.centroids == prev_centroids):
            prev_centroids = self.centroids.copy()
            distances = np.array([[np.linalg.norm(point - centroid) for centroid in self.centroids] for point in data])
            closest_centroids = np.argmin(distances, axis=1)
            self.centroids = np.array([data[closest_centroids == i].mean(axis=0) for i in range(self.k)])

        return closest_centroids