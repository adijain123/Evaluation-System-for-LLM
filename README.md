# Evaluation-System-for-LLM's

A comprehensive Flask-based web application for evaluating and benchmarking Large Language Model (LLM) responses using multiple scoring metrics and automated judging criteria.

## 🚀 Features

- **Multi-metric Evaluation**: BLEU, ROUGE, Relevance, Clarity, Actionability scores
- **LLM-as-a-Judge**: Automated evaluation using Meta-Llama-3.1-8B-Instruct
- **Interactive Dashboard**: Real-time analytics and performance tracking
- **Persistent Storage**: JSON-based data persistence for evaluations
- **Quality Thresholds Configuration**: Customizable pass/fail thresholds for each metric with real-time adjustment
- **Evaluation Metrics Settings**: Toggle individual metrics on/off and configure scoring weights dynamically
- **Improvement Loop System**: Automated retry mechanism for low-scoring answers with configurable retry thresholds and maximum attempts
- **Configurable Settings**: Full system customization including metrics, thresholds, and improvement loops
- **Search & Filter**: Easy navigation through evaluation results
- **Feedback System**: Manual feedback collection for continuous improvement

## 📋 Table of Contents

- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Evaluation Metrics](#evaluation-metrics)
- [API Endpoints](#api-endpoints)
- [Web Interface](#web-interface)
- [Judging Criteria](#judging-criteria)
- [Contributing](#contributing)

## 🛠 Setup & Installation

### Prerequisites

- Python 3.7+
- DeepInfra API account and API key
- Internet connection for API calls

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/adijain123/Evaluation-System-for-LLM.git
   cd Evaluation-System-for-LLM
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download NLTK data**
   ```python
   import nltk
   nltk.download('punkt')
   ```

5. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   DEEPINFRA_API_KEY=your_deepinfra_api_key_here
   FLASK_SECRET_KEY=your_secret_key_here
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Access the application**
   Open your browser and navigate to `http://localhost:5000`

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEEPINFRA_API_KEY` | Your DeepInfra API key for LLM access | Yes |
| `FLASK_SECRET_KEY` | Secret key for Flask sessions | No (has default) |

### Default Settings

The system comes with pre-configured settings that can be modified via the web interface:

```python
settings = {
    'metrics': {
        'bleu': True,
        'rouge': True,
        'relevance': True,
        'clarity': True,
        'actionability': True,
        'llm_judge': True
    },
    'thresholds': {
        'bleu': 0.42,
        'rouge': 0.5,
        'relevance': 0.7,
        'clarity': 0.6,
        'actionability': 0.7,
        'llm_judge': 0.65,
        'overall': 0.7
    },
    'improvement_loop': {
        'enabled': True,
        'retry_threshold': 0.6,
        'max_retries': 2
    }
}
```

## 📖 Usage

### Basic Evaluation Workflow

1. **Navigate to Evaluation Page**: Click "Evaluate" in the navigation
2. **Enter Question**: Input the question you want to evaluate
3. **Provide Answer**: Enter the answer to be evaluated
4. **Submit**: Click "Evaluate Answer" to get comprehensive scores
5. **Review Results**: Analyze the multi-metric evaluation results
6. **Provide Feedback**: Optionally provide manual feedback for improvement

### Dashboard Analytics

The dashboard provides:
- Overall quality score across all evaluations
- Total number of evaluations performed
- Positive vs negative feedback ratio
- Issues identified (low-scoring evaluations)
- Performance trends over time
- Visual charts and statistics

## 📊 Evaluation Metrics

### 1. BLEU Score (0-1)
**Purpose**: Measures n-gram overlap between reference and candidate answers
- **Threshold**: 0.42 (default)
- **Usage**: Quantifies lexical similarity
- **Good for**: Factual accuracy, content overlap

### 2. ROUGE Score (0-1)
**Purpose**: Evaluates recall-oriented summarization quality
- **Threshold**: 0.5 (default)
- **Variants**: ROUGE-1, ROUGE-2, ROUGE-L
- **Good for**: Content coverage, summarization tasks

### 3. Relevance Score (0-1)
**Purpose**: LLM-judged relevance to the original question
- **Threshold**: 0.7 (default)
- **Evaluation**: How well the answer addresses the question
- **Good for**: Topic adherence, question-answer alignment

### 4. Clarity Score (0-1)
**Purpose**: LLM-judged clarity and understandability
- **Threshold**: 0.6 (default)
- **Evaluation**: How clear and comprehensible the answer is
- **Good for**: Communication effectiveness, readability

### 5. Actionability Score (0-1)
**Purpose**: LLM-judged practical applicability
- **Threshold**: 0.7 (default)
- **Evaluation**: How practical and actionable the answer is
- **Good for**: Usefulness, practical value

### 6. LLM Judge Score (0-1)
**Purpose**: Composite score from LLM evaluation
- **Threshold**: 0.65 (default)
- **Calculation**: Average of relevance, clarity, and actionability
- **Good for**: Overall quality assessment

### Overall Score
**Calculation**: Average of all enabled metrics
**Threshold**: 0.7 (default)

## 🔗 API Endpoints

### POST `/api/evaluate`
Evaluate an answer against a question
```json
{
  "question": "What is machine learning?",
  "user_answer": "Machine learning is a subset of AI..."
}
```

### GET `/api/evaluations`
Retrieve all stored evaluations

### POST `/api/feedback`
Submit feedback for an evaluation
```json
{
  "eval_id": "uuid-string",
  "feedback": "This evaluation was accurate"
}
```

### GET/POST `/api/settings`
Retrieve or update system settings

### POST `/api/reset_settings`
Reset all settings to default values

## 🖥 Web Interface

### Pages Available

1. **Dashboard** (`/`): Analytics and overview
2. **Evaluate** (`/evaluate`): Main evaluation interface
3. **Results** (`/results`): Browse and search evaluations
4. **Settings** (`/settings`): Configure metrics and thresholds

### Key Features

- **Responsive Design**: Works on desktop and mobile
- **Real-time Updates**: Immediate feedback after evaluation
- **Search Functionality**: Filter evaluations by question content
- **Visual Analytics**: Charts and graphs for performance tracking
- **Export Capability**: JSON-based data export

## ⚖️ Judging Criteria

### LLM Judge Evaluation Process

The system uses Meta-Llama-3.1-8B-Instruct as an automated judge with the following prompt structure:

```
Evaluate the following answer on a scale of 0 to 1 for each criterion:

Question: [USER_QUESTION]
Answer: [USER_ANSWER]

Rate the answer for:
1. Relevance (0-1): How well does it address the question?
2. Clarity (0-1): How clear and understandable is it?
3. Actionability (0-1): How practical and actionable is it?
```

### Scoring Guidelines

| Score Range | Quality Level | Description |
|-------------|---------------|-------------|
| 0.8 - 1.0 | Excellent | High-quality, comprehensive answers |
| 0.6 - 0.79 | Good | Solid answers with minor improvements needed |
| 0.4 - 0.59 | Fair | Adequate but needs significant improvement |
| 0.0 - 0.39 | Poor | Major issues requiring substantial revision |

### Quality Thresholds

The system uses configurable thresholds to determine pass/fail status:
- **BLEU**: 0.42 (lexical similarity benchmark)
- **ROUGE**: 0.5 (content coverage benchmark)
- **Relevance**: 0.7 (high relevance requirement)
- **Clarity**: 0.6 (moderate clarity requirement)
- **Actionability**: 0.7 (high practical value requirement)
- **Overall**: 0.7 (composite quality threshold)

## 📁 Data Storage

### File Structure
```
llm-evaluation-system/
├── app.py                 # Main Flask application
├── evaluations.json       # Persistent evaluation storage
├── .env                   # Environment variables
├── templates/             # HTML templates
│   ├── dashboard.html
│   ├── evaluate.html
│   ├── results.html
│   └── settings.html
└── static/               # CSS, JS, and other static files
```

### Data Format
Each evaluation is stored with:
- Unique UUID identifier
- Original question and user answer
- Reference answer from LLM
- All computed scores
- Timestamp
- Optional user feedback

## 🔧 Customization

### Adding New Metrics
1. Update the `settings['metrics']` dictionary
2. Implement the metric calculation function
3. Integrate into the evaluation pipeline
4. Update the UI to reflect new metrics

### Modifying Thresholds
Use the Settings page or directly modify the API:
```python
settings['thresholds']['your_metric'] = 0.75
```

### Changing LLM Models
Modify the DeepInfra API call in `get_deepinfra_response()`:
```python
data = {
    "model": "your-preferred-model",
    # ... other parameters
}
```

## 🚨 Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure `DEEPINFRA_API_KEY` is correctly set
2. **NLTK Download Issues**: Run `nltk.download('punkt')` manually
3. **Port Conflicts**: Change the port in `app.run(port=5000)`
4. **Timeout Errors**: Check internet connection and API limits

### Error Handling

The system includes comprehensive error handling:
- API timeout protection (30 seconds)
- Graceful degradation for failed metrics
- Default scores for unavailable services
- User-friendly error messages

## 📈 Performance Optimization

### Recommendations

- **Batch Processing**: Evaluate multiple answers simultaneously
- **Caching**: Implement Redis for frequently accessed data
- **Async Processing**: Use Celery for background evaluation tasks
- **Database Migration**: Move from JSON to PostgreSQL/MySQL for larger datasets

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- Follow PEP 8 guidelines
- Use meaningful variable names
- Add docstrings for functions
- Include error handling

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For questions, issues, or feature requests:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information
4. Contact the development team

---

**Built with ❤️ for the LLM evaluation community**