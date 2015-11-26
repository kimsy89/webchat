var gulp = require('gulp')
	, server = require('gulp-develop-server') // develop server
	, livereload = require('gulp-livereload')
	, uglify = require('gulp-uglify') // js minify
	, minifyCss = require('gulp-minify-css') // css minify
	, concat = require('gulp-concat') // js 파일을 하나로 merge 시킨다. 하지만 minify하진 않음.
	, rename = require('gulp-rename') // 이름 변경
	, sass = require('gulp-ruby-sass') // sass -> css
	, inject = require('gulp-inject'); 

var options = {
	path: './server.js'
};

var serverFiles = [
	'./server.js'
];

// concat을 이용하여 하나로 합친 merge file을 minify하고 싶으면 아래 배열처럼 실행하면 안되고,
// concat먼저 실행 후 scripts를 실행해야 한다. 
// 아래 배열 처럼 실행하면 시간차 문제가 생기는 듯.

gulp.task('dashboard', function() {
	var target = gulp.src(['views/index.html', 'views/dashboard.html']);
	var sources = gulp.src([
				'public/css/*.css', 
				'public/css/lib/jquery-ui.min.css', 
				'public/font/css/font-awesome.min.css',
				'public/js/*.js', 
				'public/js/lib/jquery-ui.min.js'
			], {read: false});

	return target.pipe(inject(sources)).pipe(gulp.dest('views'));
});

gulp.task('server:start', function() {
	server.listen(options, livereload.listen);
});

gulp.task('server:restart', function() {
	gulp.watch(['./server.js'], server.restart);	
});

/* // sass
gulp.task('sass', function() {
	return sass('public/css/')
	.on('error', function(err) {
		console.error('error! ', err.message);	
	})
	.pipe(gulp.dest('public/build/css'));
});
*/

// 배포 시에 아래 코드 사용
/*
gulp.task('compressjs', function() {
	return gulp.src('public/js/*.js')
	.pipe(concat('chat.js'))
	.pipe(uglify())
	.pipe(rename({
		extname: '.min.js'
	}))
	.pipe(gulp.dest('public/build/js'));
});

gulp.task('compresscss', ['compressjs'], function() {
	return gulp.src('public/css/*.css')
	.pipe(minifyCss())
	.pipe(rename({
		extname: '.min.css'
	}))
	.pipe(gulp.dest('public/build/css'));
});

gulp.task('dashboard', ['compresscss'], function() {
	var target = gulp.src(['views/index.html', 'views/dashboard.html']);
	var sources = gulp.src(['public/build/css/chat.min.css', 'public/build/js/chat.min.js'], {read: false});

	return target.pipe(inject(sources)).pipe(gulp.dest('views'));
});
*/

gulp.task('default', ['dashboard', 'server:start'], function() {
	function restart(file) {
		server.changed(function(error) {
			if (!error) {
				livereload.changed(file.path);
			}	
		});
	}	
	gulp.watch(serverFiles).on('change', restart);
	
});