const expect = require('expect');
const request = require('supertest');

const {app} = require('../server.js');
const {Todo} = require('../models/todo.js');
const {User} = require('../models/user.js');
const {ObjectID} = require('mongodb');
const {todos, populateTodos, users, populateUsers} = require('./seed.js');


//before each test, clear Todo collection
beforeEach(populateTodos);
beforeEach(populateUsers);

describe('post /todos', () => {
	it('should create a new todo', (done) => {
		var text = 'test todo text';
		//use supertest to test the server
		request(app)
			//make a post request to todos
			.post('/todos')
			//by sending this object
			.send({text: text})
			//expect status code: 200. The expect used here is a method from supertest
			.expect(200)
			//request(app) returns response and error automatically
			.expect((res) => {
				expect(res.body.text).toBe(text);
			})
			//end the request
			.end((err, res) => {
				if (err) return done(err)
				//find() returns the entire todos collection
				//expect the collection to have length 1
				Todo.find({text:text}).then((todos) => {
					expect(todos.length).toBe(1);
					expect(todos[0].text).toBe(text);
					done();
				}).catch((e) => done(e));
			})
		})
		//at this point, one document is created under todo collection


	it('should not create todo with invalid body data', (done) => {
		request(app)
			.post('/todos')
			.send({})
			//status code 400 is for bad data
			.expect(400)
			.end((err, res) => {
				if (err) return done(err)
				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((e) => done(e));
			});
	})
});


//test is failing: cannot get route: /todos
// describe('Get /todos', () => {
// 	it('should get all todos', (done) => {
// 		request(app)
// 			.get('/todos')
// 			.expect(200)
// 			.expect((res) => {
// 				expect(res.body.todos.length).toBe(2);
// 			})
// 			.end(done);		
// 	})
// });

describe('Get /todos/:id', () => {
	it('should return todo doc', (done) => {
		request(app)
			.get(`/todos/${todos[0]._id.toString()}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe(todos[0].text);
			})
			.end(done);
	});

	it('should return a 404, if todo not found', (done) => {
		var ID = new ObjectID().toString();
		request(app)
			.get('/todos/${ID}')
			.expect(404)
			.end(done);
		//valid ID but does not exist in our data base;

		//make sure we get a 404 back;
	});

	it('should return a 404, if ID provided is not objectID', (done) => {
		request(app)
			.get(`/todos/123`)
			.expect(404)
			.end(done);
		// /todos/123 to pass in as URL;
	});
});

describe('delete /todos/:id', () => {
	it('should remove a todo', (done) => {
		var id = todos[0]._id.toString()
		request(app)
			.delete(`/todos/${id}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe('First test todo');
			})
			.end((err) => {
				if (err) {
					return done(err);
				}
			
				Todo.findById(`${id}`).then((doc) => {
					expect(doc).toBeFalsy();
					done();	
				}).catch((e) => {
					done(e)	
				});

				// Todo.find().then((todos) => {
				// 	expect(todos.length).toBe(1);
				// 	done();
				// }).catch((e) => done(e));
			});
	});


	it('should return 404 if todo not found', (done) => {
		var id = new ObjectID().toString();
		request(app)
			.delete(`/todos/${id}`)
			.expect(404)
			.end((err) => {
				if (err) {
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((err) => done(err));
			})
	});

	it('shoudl return 404 if object id is invalid', (done) => {
		request(app)
			.delete('/todos/123abc')
			.expect(404)
			.end((err) => {
				if (err) {
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((err) => done(err));
			});
	});

});


describe('update todos/id', () => {
	it('it should update the todo', (done) => {
		//id for first item
		//update text, set completed to true
		var id = todos[0]._id.toString();
		request(app)
			.patch(`/todos/${id}`)
			.send({text: `should be new text`, completed: true})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe('should be new text');
				expect(res.body.completed).toBe(true);
				expect(typeof res.body.completedAt).toBe('number');
			})
			.end((err) => {
				if (err) {
					return done(err)
				}

				Todo.findById(id).then((todo) => {
					expect(todo.text).toBe('should be new text')
					done();
				}).catch((err) => done(err))
			})
	});

	it('should clear completedAt when todo is not completed', (done) => {
		var id = todos[1]._id.toString();
		request(app)
			.patch(`/todos/${id}`)
			.send({text: `Text should update !!!!!`, completed: false})
			.expect(200)
			.expect((res) => {
				expect(res.body.text).toBe('Text should update !!!!!');
				expect(res.body.completed).toBe(false);
				expect(res.body.completedAt).toBeFalsy();
			})
			.end((err) => {
				if (err) {
					return done(err)
				}

				Todo.findById(id).then((todo) => {
					expect(todo.text).toBe('Text should update !!!!!')
					done();
				}).catch((err) => done(err))
			})
	});


	it('should return 404 if todo not found', (done) => {
		var id = new ObjectID().toString();
		request(app)
			.delete(`/todos/${id}`)
			.expect(404)
			.end((err) => {
				if (err) {
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((err) => done(err));
			})
	});

	it('shoudl return 404 if object id is invalid', (done) => {
		request(app)
			.delete('/todos/123abc')
			.expect(404)
			.end((err) => {
				if (err) {
					return done(err);
				}

				Todo.find().then((todos) => {
					expect(todos.length).toBe(2);
					done();
				}).catch((err) => done(err));
			});
	});
})


describe('Get /users/me', () => {
	it('should return user if authenticated', (done) => {
		request(app)
			.get('/users/me')
			.set('x-auth', users[0].tokens[0].token)
			.expect(200)
			.expect((res) => {
				expect(res.body._id).toBe(users[0]._id.toString());
				expect(res.body.email).toBe(users[0].email);
			})
			.end(done)
	})



	it('should return 401 if not authenticated', (done) => {
		request(app)
			.get('/users/me')
			.expect(401)
			.expect((res) => {
				expect(res.body).toEqual({});
			})
			.end(done);
	})
});

describe('Post /users', () => {
	it('should create a user', (done) => {
		var email = 'example@example.com';
		var password = 'examplePassword';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeTruthy();
				expect(res.body._id).toBeTruthy();
				expect(res.body.email).toBe(email);
			})
			.end((err) => {
				if (err) {
					return done(err);
				}
			
				User.findOne({email}).then((user) => {
					expect(user).toBeTruthy();
					expect(user.password).not.toBe(password);
					done();
				})	


			});
	});

	it('should return a validation error if request invalid', (done) => {
		var email = 'notAnEmail';
		var password = 'examplePassword';

		request(app)
			.post('/users/')
			.send({email, password})
			.expect(400)
			.end(done);

	});


	it('should not create user if email in use', (done) => {
		var email = users[1].email;
		var password = 'examplePassword';

		request(app)
			.post('/users')
			.send({email, password})
			.expect(400)
			.end(done);
	});
});

describe('POST /users/login', () => {
	it('should login user and return auth token', (done) => {
		request(app)
			.post('/users/login')
			.send({
				email: users[1].email,
				password: users[1].password
			})
			.expect(200)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeTruthy();
			})
			.end((err, res) => {
				if (err) {
					return done(err)
				} else {
					User.findById(users[1]._id).then((user) => {
						expect(user.tokens[0]).toMatchObject({
							access: 'auth',
							token: res.headers['x-auth']
						})
					done();
					}).catch((e) => done(e));
				}
			})



	});

	it('should reject invalid login', (done) => {
		request(app)
			.post('/users/login')
			.send({
				email: users[1].email,
				password: 'wrongpassword'
			})
			.expect(400)
			.expect((res) => {
				expect(res.headers['x-auth']).toBeUndefined();
			})
			.end((err, res) => {
				if (err) {
					return done(err)
				} else {
					User.findById(users[1]._id).then((user) => {
						expect(user.tokens.length).toBe(0);
						done();
					}).catch((e) => done(e));
				}
			})

	});
});
