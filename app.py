from flask import Flask, render_template, request, jsonify, session
import requests
import json
from datetime import datetime
import uuid
import re
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from rouge_score import rouge_scorer
import nltk
import os
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'default_secret_change_me')

DEEPINFRA_API_KEY = os.environ.get('DEEPINFRA_API_KEY')
if not DEEPINFRA_API_KEY:
    raise ValueError("DEEPINFRA_API_KEY is not set in environment variables.")

# File path for persistent storage
EVALUATIONS_FILE = 'evaluations.json'

# Load evaluations from file
def load_evaluations():
    if os.path.exists(EVALUATIONS_FILE):
        with open(EVALUATIONS_FILE, 'r') as f:
            return json.load(f)
    return []

# Save evaluations to file
def save_evaluations():
    with open(EVALUATIONS_FILE, 'w') as f:
        json.dump(evaluations, f, indent=4)

# In-memory list
evaluations = load_evaluations()

# Settings
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

def get_deepinfra_response(prompt):
    try:
        url = "https://api.deepinfra.com/v1/openai/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPINFRA_API_KEY}"
        }
        data = {
            "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content']
        else:
            return f"Error: {response.status_code} - {response.text}"
    except Exception as e:
        return f"Error: {str(e)}"

def calculate_bleu_score(reference, candidate):
    try:
        reference_tokens = nltk.word_tokenize(reference.lower())
        candidate_tokens = nltk.word_tokenize(candidate.lower())
        smoothie = SmoothingFunction().method4
        score = sentence_bleu([reference_tokens], candidate_tokens, smoothing_function=smoothie)
        return round(score, 3)
    except:
        return 0.0

def calculate_rouge_score(reference, candidate):
    try:
        scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
        scores = scorer.score(reference, candidate)
        return round(scores['rougeL'].fmeasure, 3)
    except:
        return 0.0

def evaluate_with_llm_judge(question, answer):
    try:
        prompt = f"""
        Evaluate the following answer on a scale of 0 to 1 for each criterion:

        Question: {question}
        Answer: {answer}

        Rate the answer for:
        1. Relevance (0-1): How well does it address the question?
        2. Clarity (0-1): How clear and understandable is it?
        3. Actionability (0-1): How practical and actionable is it?

        Respond only with three numbers separated by commas (relevance,clarity,actionability).
        Example: 0.8,0.7,0.9
        """
        url = "https://api.deepinfra.com/v1/openai/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {DEEPINFRA_API_KEY}"
        }
        data = {
            "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 50,
            "temperature": 0.1
        }
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code == 200:
            result = response.json()
            scores_text = result['choices'][0]['message']['content'].strip()
            scores = [float(x.strip()) for x in scores_text.split(',')]
            return {
                'relevance': round(scores[0], 3),
                'clarity': round(scores[1], 3),
                'actionability': round(scores[2], 3),
                'llm_judge': round(sum(scores) / 3, 3)
            }
        else:
            return {'relevance': 0.5, 'clarity': 0.5, 'actionability': 0.5, 'llm_judge': 0.5}
    except:
        return {'relevance': 0.5, 'clarity': 0.5, 'actionability': 0.5, 'llm_judge': 0.5}

def calculate_overall_score(scores):
    active_scores = []
    for metric, enabled in settings['metrics'].items():
        if enabled and metric in scores:
            active_scores.append(scores[metric])
    return round(sum(active_scores) / len(active_scores), 3) if active_scores else 0.0

@app.route('/')
def dashboard():
    total_evaluations = len(evaluations)
    positive_feedback = sum(1 for e in evaluations if e.get('overall_score', 0) >= 0.5)
    issues_identified = sum(1 for e in evaluations if e.get('overall_score', 0) < 0.5)
    overall_quality = round(sum(e.get('overall_score', 0) for e in evaluations) / len(evaluations), 2) if evaluations else 0
    chart_data = [{'date': e.get('date', ''), 'score': e.get('overall_score', 0)} for e in evaluations[-10:]]
    feedback_data = {'positive': positive_feedback, 'negative': total_evaluations - positive_feedback}
    return render_template('dashboard.html',
                           overall_quality=overall_quality,
                           total_evaluations=total_evaluations,
                           positive_feedback=positive_feedback,
                           issues_identified=issues_identified,
                           chart_data=chart_data,
                           feedback_data=feedback_data)

@app.route('/evaluate')
def evaluate():
    return render_template('evaluate.html')

@app.route('/api/evaluate', methods=['POST'])
def api_evaluate():
    try:
        data = request.json
        question = data.get('question', '')
        user_answer = data.get('user_answer', '')
        reference_answer = get_deepinfra_response(question)

        scores = {}
        if settings['metrics']['bleu']:
            scores['bleu'] = calculate_bleu_score(reference_answer, user_answer)
        if settings['metrics']['rouge']:
            scores['rouge'] = calculate_rouge_score(reference_answer, user_answer)
        if any(settings['metrics'][k] for k in ['relevance', 'clarity', 'actionability', 'llm_judge']):
            llm_scores = evaluate_with_llm_judge(question, user_answer)
            scores.update(llm_scores)

        overall_score = calculate_overall_score(scores)
        scores['overall_score'] = overall_score

        evaluation = {
            'id': str(uuid.uuid4()),
            'question': question,
            'user_answer': user_answer,
            'reference_answer': reference_answer,
            'scores': scores,
            'overall_score': overall_score,
            'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'feedback': None
        }
        evaluations.append(evaluation)
        save_evaluations()

        return jsonify({
            'success': True,
            'scores': scores,
            'reference_answer': reference_answer,
            'overall_score': overall_score
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/results')
def results():
    search_query = request.args.get('search', '')
    filtered_evaluations = [e for e in evaluations if search_query.lower() in e['question'].lower()] if search_query else evaluations
    return render_template('results.html', evaluations=filtered_evaluations, search_query=search_query)

@app.route('/api/feedback', methods=['POST'])
def api_feedback():
    try:
        data = request.json
        eval_id = data.get('eval_id')
        feedback = data.get('feedback')
        for evaluation in evaluations:
            if evaluation['id'] == eval_id:
                evaluation['feedback'] = feedback
                save_evaluations()
                break
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/settings')
def settings_page():
    return render_template('settings.html', settings=settings)

@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    try:
        data = request.json
        if 'metrics' in data:
            settings['metrics'].update(data['metrics'])
        if 'thresholds' in data:
            settings['thresholds'].update(data['thresholds'])
        if 'improvement_loop' in data:
            settings['improvement_loop'].update(data['improvement_loop'])
        return jsonify({'success': True, 'settings': settings})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reset_settings', methods=['POST'])
def api_reset_settings():
    global settings
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
    return jsonify({'success': True, 'settings': settings})

@app.route('/api/evaluations', methods=['GET'])
def get_evaluations():
    return jsonify(evaluations)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
