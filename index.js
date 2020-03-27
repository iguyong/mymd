#!/usr/bin/env node

const {md} = require('./markdown');
const argv = require('yargs').boolean(['t', 'f']).argv;
const fs = require('fs');
const path = require('path');


argc = 2;
if (argv.f) {
    argc += 1;
}
if (argv.t) {
    argc += 1;
}
if (Object.keys(argv).length > argc) {
    console.log("invalid options!");
    return;
}
var inPath = '.';
var outpath = '.';
const cwd = process.cwd();
if (argv._.length > 0) {
    inPath = argv._[0];
}
if (argv._.length > 1) {
    outpath = argv._[1];
}
if(!path.isAbsolute(inPath)) {
    inPath = path.join(cwd, inPath);
}
if(!path.isAbsolute(outpath)) {
    outpath = path.join(cwd, outpath);
}
try {
    if (fs.lstatSync(outpath).isFile()) {
        console.log("invalid output path!");
        return;
    }
} catch (e) {
    fs.mkdirSync(outpath, {recursive: true});
}

console.log("input: ", inPath);
console.log("output: ", outpath);

if (fs.statSync(inPath).isFile()) {
    const relPath = path.relative(cwd, inPath);
    convertFile(inPath, path.join(outpath, relPath));
    return;
} else if (fs.statSync(inPath).isDirectory()) {
    var walk = require('walk');
    var options = {
        followLinks: false
        // directories with these keys will be skipped
        , filters: ["node_modules",]
    };
    var walker = walk.walk(inPath, options);

    walker.on("file", function (root, fileStats, next) {
        if (path.extname(fileStats.name) !== '.md') {
            next();
            return;
        }
        fs.readFile(path.join(root, fileStats.name), 'utf8', function (err, text) {
            if (err) {
                console.log(err);
            } else {
                const inFile = path.join(root, fileStats.name);
                var outFile = path.join(outpath, path.relative(inPath, inFile));
                const pos = outFile.lastIndexOf(".");
                outFile = outFile.substr(0, pos < 0 ? outFile.length : pos) + ".html";
                convertFile(inFile, outFile, argv.f, argv.t);
            }
        });
        next();
    });

    walker.on("errors", function (root, nodeStatsArray, next) {
        next();
    });
}


function convertFile(inFile, outFile, force = false, test = true) {
    var text;
    try {
        text = fs.readFileSync(inFile, 'utf8');
    } catch (e) {
        console.err("read file error: ", inFile);
        return;
    }

    if (!force) {
        try {
            if (fs.statSync(outFile).mtime > fs.statSync(inFile).mtime) {
                return;
            }
        } catch (e) {

        }
    }
    if(test){
        console.log("would convert:", inFile, "to", outFile);
        return;
    }
    html = templ(md.render(text));
    const dir = path.dirname(outFile);
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
    fs.writeFile(outFile, html, (err) => {
        if (err) throw err;
        console.log("Generated:", outFile);
    });

}

// fs.readFile('./test/hack.md', 'utf8', (err, text) => {
//     if (err) {
//         console.log("read file error");
//         throw err;
//     }
//     mdhtml = md.render(text);
//     fs.writeFile('./test/hack.html', templ(mdhtml), (err) => {
//         if (err) throw err;
//         console.log('The file has been saved!');
//     });
// })


function templ(content) {
    return `
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <meta name="mobile-web-app-capable" content="yes">

    <link rel="icon" type="image/png" href="/favicon.ico"> 
    <title>
        Gu Yong
    </title>
    <link rel="stylesheet" href="/assets/css/markdown.css">
    <link rel="stylesheet" href="/assets/css/github-markdown.css">
    <link rel="stylesheet" href="assets/css/prism.css">
    <link rel="stylesheet" href="/assets/css/font-awesome.min.css">
    <link rel="stylesheet" href="/assets/css/github-gist.css">
    <link rel="stylesheet" href="/assets/css/style.css">

</head>

<body>
       
    <div id="doc" class="markdown-body container-fluid">
    ${content}
    </div>
    <script>
    MathJax = {
        tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']]
        },
        svg: {
            fontCache: 'global'
        }
    };
</script>
<script type="text/javascript" id="MathJax-script" async
  src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js">
</script>
</body>
</html>
    `
}
