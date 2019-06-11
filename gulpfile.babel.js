import gulp from 'gulp'; // 걸프 불러오기

import del from 'del' // 빌드 후 파일 삭제

import browserSync from 'browser-sync'; // 브라우저 서버로 띄우기

import postcss from 'gulp-postcss'; 
import autoprefix from 'gulp-autoprefixer'; // 벤더프리픽스
import cssnano from 'cssnano'; // css 압축

import plumber from 'gulp-plumber'; // 컴파일중 오류가 나도 watch 실행
import sourcemaps from 'gulp-sourcemaps' // 소스맵 만들기
import sass from 'gulp-sass' // scss 컴파일

import spritesmith from 'gulp.spritesmith'; // 이미지스프라이트 만들기
import merge from 'merge-stream'; // 이미지 머지
import replace from 'gulp-replace'; // 스프라이트 className replace

import optimizeIMG  from 'gulp-image'; // 이미지 압축
/* =============================================================== */
	// 디렉토리 재활용을 위해 정리
let DIR = {
	SRC: 'project', // 작업을 진행할 폴더명입니다.
	DEST: 'A', // 작업된 파일들을 컴파일하여 정리해두는 폴더입니다. 
};

let PATH = {
	DIR: DIR, // 위에 생성한 DIR 변수를 대입하였습니다. 
	SRC: {
		JS: `${ DIR.SRC }/js/**/*.js`, // DIR.SRC + '/js/**/*.js' 와 같은 뜻 입니다.
		CSS: `${ DIR.SRC }/css/*.css`,
		SCSS: `${ DIR.SRC }/scss/*.scss`,
		IMG : `${ DIR.SRC }/images/**/*.{png,jpg,gif}`,
		ASSET : `${ DIR.SRC }/images/asset/*.{png,jpg,gif}`,
		HTML: `${ DIR.SRC }/**/*.html`,
	},
	DEST: {
		JS: `${ DIR.DEST }/js`,
		CSS: `${ DIR.DEST }/css`,
		IMG : `${ DIR.DEST }/images/`,
		HTML: `${ DIR.DEST }/`,
		// SRC: `${ DIR.DEST }/`,
	}
}
/* =============================================================== */

/* =============================================================== */
	// TASK

// 서버띄우기
const server = () => {
	browserSync.init({
		server : {
			baseDir : PATH.DIR.SRC
		}
	})
}

// CSS 벤더프리픽스 & 압축
const css = () => {
	return gulp.src( PATH.SRC.CSS , {since: gulp.lastRun(css)} )
	.pipe(autoprefix({
		overrideBrowserslist : ['last 2 versions'],
		cascade: false
	})) // 오토 프리픽스 
	.pipe( postcss([ cssnano ])) // 압축 필요 없 을시 주석
	.pipe( gulp.dest( `${PATH.DIR.SRC}/css` ))
}

// SCSS 컴파일
const scss = () => {
	return gulp.src( PATH.SRC.SCSS , {since: gulp.lastRun(scss)})
	.pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'})) // scss 컴파일 모드 설정
    .pipe(postcss([ autoprefix ]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest( `${PATH.DIR.SRC}/css`))
}

// 이미지 스프라이트 만들기
const delSprite = () => {
	return del(`${PATH.DIR.SRC}/images/sprite.png`);
}
const autoSprite = () => {
	const spriteData = gulp
		.src( PATH.SRC.ASSET , {since: gulp.lastRun(autoSprite)} )
		.pipe(spritesmith({
			imgName: 'sprite.png',
			cssName: 'sprite.css',
			padding: 8,
		}))

	const imgStream = spriteData.img
		.pipe(gulp.dest(`${PATH.DIR.SRC}/images`))

	const cssStream = spriteData.css
		.pipe(replace(/^\.icon-/gm, '.')) // 클래스명 변경
		.pipe(sourcemaps.init()) // 소스맵 생성
		.pipe(postcss([cssnano])) // 압축 필요 없 을시 주석
		.pipe(sourcemaps.write()) 
		.pipe(gulp.dest(`${PATH.DIR.SRC}/css`))

	return merge(imgStream, cssStream);
}

// 이미지 파일 압축
const miniIMG = () => {
	return gulp.src(PATH.SRC.IMG , {since: gulp.lastRun(miniIMG)})
	.pipe( optimizeIMG() )
	.pipe( gulp.dest( `${PATH.DIR.SRC}/images`) );
}

// 변경 감지 
const taskWatch = () => {
	gulp.watch( PATH.SRC.HTML ).on('change' , browserSync.reload );
	gulp.watch( PATH.SRC.CSS ).on('change' , browserSync.reload );
	gulp.watch( PATH.SRC.SCSS ).on('change' , scss, browserSync.reload);
	gulp.watch( `${PATH.DIR.SRC}/images/asset` ).on('add' , delSprite);
	gulp.watch( `${PATH.DIR.SRC}/images/asset` ).on('add' , autoSprite);
}

exports.default = gulp.series( delSprite, autoSprite, miniIMG, gulp.parallel(server, css, scss, taskWatch ) );