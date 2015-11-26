module.exports = function() {
	// db setting
	var mongodb = require('mongodb')
		// mongoose를 이용하여 db 연결
		, mongoose = require('mongoose').connect('localhost', 'chat') 
		, db = mongoose.connection;

	// 전역 변수
	var userModel
		, that = this;

	// 오류 콜백
	db.on('error', function(msg) {
		console.log('>>[mongoose]: error! ', msg);
	});

	// 성공 콜백
	db.once('open', function callback() {
		console.log('>>[mongoose]: database opened successfully');
		var schema = {
			user: mongoose.Schema({
				name: {
					type: String,
					require: true,
					trim: true
				},
				emailId: {
					type: String,
					require: true,
					unique: true,
					trim: true
				},
				roomId: {
					type: String,
					require: true,
					trim: true
				}
			})
		};

		// 모델 생성
		userModel = mongoose.model('users', schema.user);
	});


	// 이렇게 쓸거면 promise 왜 쓴거
	// user 정보를 조회해서 있으면 뱉고, 없으면 setUser 메서드 실행.
	// this.getUser = function(userInfo, callback) {
	// 	var _emailId = userInfo.emailId
	// 		, _name = userInfo.name;

	// 	var _getUser = function(emailIdLength) {
	// 				return new Promise(function(resolve, reject) {
	// 					userModel.find({ emailId: _emailId }, function(err, users) {
	// 						// err는 중복 여부일 때 발생하는 에가 아님.
	// 						if (err) {
	// 							console.log('>>[DB getUser] has error', err);
	// 						} else {
	// 							console.log('>>[DB getUser] no error', err);
	// 						}
	// 						resolve(users);
	// 					});
	// 				});
	// 			};

	// 	_getUser(_emailId.length).then(
	// 		// resolve
	// 		// return code가 의미가 있을까. 다른데서 안쓰면 여기서 코드를 써야하는지 생각해보자.
	// 		function(users) {
	// 			if (users.length) {
	// 				callback({ code: 409 });
	// 			} else {
	// 				this.setUser(_name, _emailId, callback({ code: 200 }));
	// 			}
	// 		},
	// 		// reject
	// 		function() {
	// 			alert('failure');
	// 		}
	// 	);
	// };


	// getUser가 독립적이어야 한다.
	// 로그인시에는 콜백에 setUser를 실행해야 한다.
	// 업데이트 할 때도 해당 메서드를 사용한다.
	this.getUser = function(emailId, callback) {
		var _emailId = emailId;
		// 여러명을 찾을 때.
		// emailId가 object인지 array인지 구분하는 분기문이 있어야 함.
		// 결국 promise구문이 필요하긴 하네..

		userModel.find({ emailId: _emailId }, function(err, users) {
			// err는 중복 여부일 때 발생하는 에러가 아님.
			if (err) {
				//console.log('>>[DB getUser] has error', err);
			} else {
				//console.log('>>[DB getUser] no error', err);
			}
			
			if (users.length) {
				callback('200', users);
			} else {
				callback('404');
			}

		});

	};

	this.setUser = function(userInfo, callback) {
		// 새로운 모델 인스턴스 생성
		var user = new userModel({
					name: userInfo.name,
					emailId: userInfo.emailId
				});

		// 모델 저장
		user.save(function (err, user) {
			if (err) {
				callback('err', err);
			} else {
				callback('save success', user);
			}
		})
	};

	this.setRoom = function(userInfo, roomId, callback) {
		//Tank.update({ _id: id }, { $set: { size: 'large' }}, callback);
		//console.log('>>[DB setRoom]', userInfo);
		userModel.update({ emailId: userInfo.emailId }, { roomId: roomId },
			function(err, users) {
				if (err) {
					console.log('>>[DB update] has error', err);
				} else {
					console.log('>>[DB update] no error', err);
				}
			}
		);
	};


	return {
		//init: init,
		getUser: this.getUser,
		setUser: this.setUser,
		setRoom: this.setRoom
	};
};