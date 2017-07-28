module.exports = function(grunt) {

	var pkg = grunt.file.readJSON('package.json');
	var gruntHelper = require('betajs-compile');
	var dist = 'betajs-workers';

	gruntHelper.init(pkg, grunt)
	
	
    /* Compilation */    
	.scopedclosurerevisionTask(null, "src/**/*.js", "dist/" + dist + "-noscoped.js", {
		"module": "global:BetaJS.Workers",
		"base": "global:BetaJS"
    }, {
    	"base:version": pkg.devDependencies.betajs
    })	
    .concatTask('concat-scoped', [require.resolve('betajs-scoped'), 'dist/' + dist + '-noscoped.js'], 'dist/' + dist + '.js')
    .uglifyTask('uglify-noscoped', 'dist/' + dist + '-noscoped.js', 'dist/' + dist + '-noscoped.min.js', ["Scoped"])
    .uglifyTask('uglify-scoped', 'dist/' + dist + '.js', 'dist/' + dist + '.min.js', ["Scoped"])

    /* Testing */
    .browserqunitTask(null, "tests/tests.html", true)
    .qunitjsTask(null, ["tests/tests.js"])
    .closureTask(null, [require.resolve('betajs-scoped'), require.resolve("betajs"), "./dist/betajs-workers-noscoped.js"])
    .browserstackTask(null, 'tests/tests.html', {desktop: true, mobile: true})
    .lintTask(null, ['./src/**/*.js', './dist/' + dist + '-noscoped.js', './dist/' + dist + '.js', './Gruntfile.js', './tests/**/*.js'])
    
    /* External Configurations */
    .codeclimateTask()
    .packageTask()
    
    /* Markdown Files */
	.readmeTask()
    .licenseTask()
    
    /* Documentation */
    .docsTask();

	grunt.initConfig(gruntHelper.config);	

	grunt.registerTask('default', ['package', 'readme', 'license', 'codeclimate', 'scopedclosurerevision', 'concat-scoped', 'uglify-noscoped', 'uglify-scoped']);
	grunt.registerTask('check', [ 'lint', 'qunitjs', 'browserqunit' ]);

};