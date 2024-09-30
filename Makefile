# Define your virtual environment and flask app
VENV = venv
FLASK_APP = app.py

# Install Python and JavaScript dependencies
install:
	# Create a virtual environment and install Python packages
	python3 -m venv $(VENV)
	# Check if venv/bin/pip exists before using it
	@if [ -f ./$(VENV)/bin/pip ]; then \
		./$(VENV)/bin/pip install --upgrade pip; \
		./$(VENV)/bin/pip install -r requirements.txt; \
	else \
		echo "Virtual environment pip not found."; \
		exit 1; \
	fi
	# Install JavaScript dependencies using npm
	npm install chart.js react react-dom react-chartjs-2 
	npm install react-scripts --save

# Run the Flask application
run:
	FLASK_APP=$(FLASK_APP) FLASK_ENV=development ./$(VENV)/bin/flask run --port 5000
	
# Clean up virtual environment
clean:
	rm -rf $(VENV)

# Reinstall all dependencies
reinstall: clean install
