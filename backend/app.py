from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from os import environ
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = environ.get('DATABASE_URL') or 'sqlite:///doctors.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False

db = SQLAlchemy(app)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    specialty = db.Column(db.String(80))
    experience = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'specialty': self.specialty,
            'experience': self.experience,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

# Helper functions
def validate_email(email):
    """Validate email format"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

def validate_user_data(data, is_update=False):
    """Validate user data"""
    errors = []
    
    if not is_update or 'name' in data:
        if not data.get('name') or len(data['name']) < 2:
            errors.append('Name must be at least 2 characters')
    
    if not is_update or 'email' in data:
        if not data.get('email'):
            errors.append('Email is required')
        elif not validate_email(data['email']):
            errors.append('Invalid email format')
    
    if 'experience' in data and data['experience'] is not None:
        try:
            experience = int(data['experience'])
            if experience < 0 or experience > 50:
                errors.append('Experience must be between 0 and 50 years')
        except ValueError:
            errors.append('Experience must be a number')
    
    return errors

# Routes
@app.route('/api/flask/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'database': 'connected' if db.session.query('1').from_statement('SELECT 1').all() else 'disconnected'
    })

@app.route('/api/flask/users', methods=['POST'])
def create_user():
    try:
        data = request.get_json()
        
        # Validation
        errors = validate_user_data(data)
        if errors:
            return make_response(jsonify({'errors': errors}), 400)
        
        # Check for existing email
        if User.query.filter_by(email=data['email']).first():
            return make_response(jsonify({'error': 'Email already exists'}), 409)
        
        # Create user
        new_user = User(
            name=data['name'],
            email=data['email'],
            specialty=data.get('specialty'),
            experience=data.get('experience')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return make_response(jsonify(new_user.to_dict()), 201)
    
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error creating user: {str(e)}')
        return make_response(jsonify({'error': 'Internal server error'}), 500)

@app.route('/api/flask/users', methods=['GET'])
def get_users():
    try:
        # Pagination
        page = request.args.get('_page', 1, type=int)
        per_page = request.args.get('_limit', 5, type=int)
        
        # Filters
        name_filter = request.args.get('name', '')
        email_filter = request.args.get('email', '')
        specialty_filter = request.args.get('specialty', '')
        min_experience = request.args.get('min_experience', type=int)
        
        # Build query
        query = User.query
        
        if name_filter:
            query = query.filter(User.name.ilike(f'%{name_filter}%'))
        if email_filter:
            query = query.filter(User.email.ilike(f'%{email_filter}%'))
        if specialty_filter:
            query = query.filter(User.specialty == specialty_filter)
        if min_experience is not None:
            query = query.filter(User.experience >= min_experience)
        
        # Paginate results
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        users = [user.to_dict() for user in pagination.items]
        
        # Return with pagination metadata
        return jsonify({
            'items': users,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page,
            'per_page': pagination.per_page
        })
    
    except Exception as e:
        app.logger.error(f'Error fetching users: {str(e)}')
        return make_response(jsonify({'error': 'Internal server error'}), 500)

@app.route('/api/flask/users/<int:id>', methods=['GET'])
def get_user(id):
    try:
        user = User.query.get(id)
        if user:
            return jsonify(user.to_dict())
        return make_response(jsonify({'error': 'User not found'}), 404)
    except Exception as e:
        app.logger.error(f'Error fetching user {id}: {str(e)}')
        return make_response(jsonify({'error': 'Internal server error'}), 500)

@app.route('/api/flask/users/<int:id>', methods=['PUT'])
def update_user(id):
    try:
        user = User.query.get(id)
        if not user:
            return make_response(jsonify({'error': 'User not found'}), 404)
        
        data = request.get_json()
        
        # Validation
        errors = validate_user_data(data, is_update=True)
        if errors:
            return make_response(jsonify({'errors': errors}), 400)
        
        # Update fields
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            if User.query.filter(User.email == data['email'], User.id != id).first():
                return make_response(jsonify({'error': 'Email already in use'}), 409)
            user.email = data['email']
        if 'specialty' in data:
            user.specialty = data['specialty']
        if 'experience' in data:
            user.experience = data['experience']
        
        db.session.commit()
        return jsonify(user.to_dict())
    
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error updating user {id}: {str(e)}')
        return make_response(jsonify({'error': 'Internal server error'}), 500)

@app.route('/api/flask/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    try:
        user = User.query.get(id)
        if not user:
            return make_response(jsonify({'error': 'User not found'}), 404)
        
        db.session.delete(user)
        db.session.commit()
        return make_response('', 204)
    
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error deleting user {id}: {str(e)}')
        return make_response(jsonify({'error': 'Internal server error'}), 500)

# Initialize database
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)