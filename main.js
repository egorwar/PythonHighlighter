let CODE        // code to analyze
let RESULT      // element to place resulting code
let aboutRESULT // exerptParentAboutBlock object of a code structure tree
let tabs        // tabulation of each line

// each object of this class is a node of the program structure tree
class aboutBlock {
    constructor(link, type, header) {
        this.link = link
        this.type = type
        this.header = header
        this.contents = []
    }
}

// container for 'line' / 'comment' / 'docstring' / 'empty'
class Line {
    constructor(type, contents) {
        this.type = type
        this.contents = contents
    }
}

// program start
function generate(){
    CODE = document.getElementById('text').value.split('\n')        // get raw code from form
    RESULT = document.getElementById('res')                         // output area reference
    aboutRESULT = new aboutBlock(RESULT, 'root', '[root_header]')   // create root object of code tree

    RESULT.innerHTML = ''                                           // to clear it before each generation
    tabs = CODE.map(line => line.search(/\S/))                      // count number of spaces starting each line

    //TODO: check all pre-requirements

    // 1. Builds the tree of code
    buildTree(0, CODE.length, aboutRESULT)
    creator(aboutRESULT, '0', RESULT)
    glowSpecials()
    // hljs.highlightAll()
}

// iterates over code, recurrently calls itself for nested code; 
// forms a code structure tree
function buildTree(exerptStartIndex, exerptEndIndex, exerptParentAboutBlock){

    console.log(`splitter from ${exerptStartIndex} 
                to ${exerptEndIndex} 
                with exerptParentAboutBlock\n${exerptParentAboutBlock.header}`)

    // iterate upon lines
    for(let i = exerptStartIndex; i < exerptEndIndex; i++){
        // Check all possible variants:
        // 1. Empty line
        if (tabs[i] < 0){
            exerptParentAboutBlock.contents.push(new Line('empty', '&nbsp;'))
            continue
        }

        // 2. Block comment
        else if (CODE[i].trimStart()[0] === '#'){  
            exerptParentAboutBlock.contents.push(new Line('comment', CODE[i]))
            continue
        }

        // 3. Docstring
        else if (CODE[i].trimStart().substring(0, 3) === '"""' ){
            let begin = i                           // index of docstring start

            if (CODE[begin].trim().length === 3)    // If start line is only open-quotes,
                i++                                 // don't search closing-quotes in it

            while (i < exerptEndIndex){
                if (CODE[i].trimEnd().substring(CODE[i].length - 3, CODE[i].length) === '"""')
                    break
                i++
            }
            exerptParentAboutBlock.contents.push(new Line('docstring', CODE.slice(begin, i+1).join('<br>')))
            continue
        }
        // 4. Single line
        else if (exerptEndIndex - exerptStartIndex === 1){  
            exerptParentAboutBlock.contents.push(new Line('line', CODE[i]))
            continue
        }

        // 5. If a line has a block beginning syntax
        blockType = check(CODE[i])
        if (blockType !== 'none'){
            let begin = i                       // index of block header

            // let header
            // if (tabs[i+1] - tabs[i] === 4 | tabs[i+1] === -1){
            //     header = CODE[i]
            //     i++
            // }
            // else{
            //     i++
            //     while (tabs[i] - tabs[begin] !== 4 & tabs[i] !== -1) i++
            //     header = CODE.slice(begin, i)
            // }

            i++

            let emptyLineCounter = 0
            while (i < exerptEndIndex){
                if (tabs[i] < 0) emptyLineCounter++  //empty line is not a block ender, but those at the end should be skipped
                else if (tabs[i] <= tabs[begin]) break  // block continues until indentation is bigger than of a header
                else emptyLineCounter = 0
                i++
            }
            console.log(emptyLineCounter);
            // add info about new block as a child of current exerpt block
            exerptParentAboutBlock.contents.push(new aboutBlock(undefined,      // no HTML link yet
                                                                blockType,      // type of block, it'll be an HTML class
                                                                CODE[begin]))   // header line of block, one that's not indented
            
            i -= emptyLineCounter
            buildTree(begin + 1, i, exerptParentAboutBlock.contents.at(-1))     // recurrent call for contents of created block
            // exerptParentAboutBlock.contents.push('#')
            i--
        }

        // 6. Everything else is a simple line
        else exerptParentAboutBlock.contents.push(new Line('line', CODE[i]))  // add it as a Line object
    }
}

function creator(block, id, exerptParentAboutBlock){
    let element = document.createElement('code')
    exerptParentAboutBlock.appendChild(element)
    if (block instanceof Line){
        element.className = block.type
        element.innerHTML = block.contents
        if (block.type === 'line')
            element.innerHTML = commentWrapper(element)
        return
    }
    else{
        element.className = block.type
        element.id = id
        element.innerHTML = typeof block.header === 'string' ? block.header : block.header.join('</br>') 
        element.innerHTML = commentWrapper(element) + '<hr>'
        for(let i = 0; i < block.contents.length; i++)
            creator(block.contents[i], id + String(i), element)
    }

}

// checks whether given line is a block-starter
function check(line){
    console.log("Working with line: " + line);
    line = line.trimStart()
    line = line.slice(0, line.indexOf(' '))
    if (['if', 'elif', 'else'].includes(line)) return 'conditional'
    else if (['try', 'except', 'finally'].includes(line)) return 'exception'
    else if (['for', 'while'].includes(line)) return 'loop'
    else return ['with', 'def', 'class'].includes(line) ? line : 'none'
}

function commentWrapper(element){
    let line = element.innerHTML
    let commentIndex = line.lastIndexOf('  # ')
        if (commentIndex !== -1){
            element.style.display = 'inline-block'
            element.innerHTML = line.substring(0, commentIndex)
                                + "<div class='inline_comment'>" 
                                + line.substring(commentIndex)
                                + "</div>"
        }    
        return element.innerHTML
}

function glowSpecials(){
    specialLines = document.querySelectorAll('.line')
    for (let line of specialLines){
        console.log(line);
        if (line.innerHTML.includes('break')){
            line.style.display = 'inline-block'
            line.innerHTML = line.innerHTML.replace('break', '<span class="break">break</span>')
        }
        if (line.innerHTML.includes('return')){
            line.style.display = 'inline-block'
            line.innerHTML = line.innerHTML.replace('return', '<span class="return">return</span>')
        }
        if (line.innerHTML.includes('continue')){
            line.style.display = 'inline-block'
            line.innerHTML = line.innerHTML.replace('continue', '<span class="continue">continue</span>')
        }
        if (line.innerHTML.includes('yield')){
            line.style.display = 'inline-block'
            line.innerHTML = line.innerHTML.replace('yield', '<span class="yield">yield</span>')
        }
    }
}

// function glowLoops(){
//     loopHeaders = document.querySelectorAll('.loop')
//     for (let line of loopHeaders){
//         if (line.startsWith('for')){
//             let args = line.slice(4, exerpt[0].indexOf(' in ')).split(', ')
//             for (let arg in args){
//                 line = line.replace(arg, '<span class="glow_loop">' + arg + '</span>')
//                 for (let child in )
//             }

//         }
//     }
// }

function glowLoopReplace(element, args){
    
}

function create(exerpt, type, exerptParentAboutBlock, is_base){
    console.log(`creating for\n ${exerpt}\n with type\n${type}\n with exerptParentAboutBlock\n${exerptParentAboutBlock} `);
    // let args = exerpt[0].slice(exerpt[0].indexOf('(') + 1, exerpt[0].lastIndexOf(')')).split(', ')
    // args.forEach(arg => 
    //     exerpt = exerpt.replaceAll(arg, '<span class="glow_def">' + arg + '</span>')
    // )

    // let args = exerpt[0].slice(4, exerpt[0].indexOf(' in ')).split(', ')
    // exerpt = exerpt.join('\n')
    // if (type == 'for'){
    //     args.forEach(arg => 
    //         exerpt = exerpt.replaceAll(arg, '<span class="glow_loop">' + arg + '</span>')
    //     )
    // }

    // exerpt = exerpt.replaceAll(' break', ' <span class="break">break</span>')
}

let IS_MINIMIZED = false    // to toggle minimization and maximization
let BLOCKS = []             // save block contents during minimization
// changes blablabla
function minimize(){
    if (!IS_MINIMIZED){
        for (block of document.getElementsByClassName('def'))
            for (child of block.children)
                child.style.display = 'none'
        
        IS_MINIMIZED = true
        document.getElementById('minbtn').innerText = 'Maximize'
    }
    else{
        for (block of document.getElementsByClassName('def'))
            for (child of block.children){
                child.style.display = 'grid'
                reloadCss();
            }

        IS_MINIMIZED = false
        document.getElementById('minbtn').innerText = 'Minimize'
    }
}

function reloadCss()
{
    var links = document.getElementsByTagName("link");
    for (var cl in links)
    {
        var link = links[cl];
        if (link.rel === "stylesheet")
            link.href += "";
    }
}