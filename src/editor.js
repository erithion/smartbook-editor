function loadTestData() {
    try {
        var request = new XMLHttpRequest();
        request.open('GET', 'http://www.gutenberg.org/files/1342/1342-0.txt', false);  // `false` makes the request synchronous
        request.send(null);
        if (request.status === 200)
            return request.responseText;
    } catch (DOMException) {
    }
    return "function myScript() {\n    return 100;\n}\nasdwer skjdfsjkdfh sdafasjdfas sdfsadf sadfasdfsadf sadfadsfasdfasd sdfasdfsdf\nzxczxc\nkasdjflksdjf sdkfjaskldjfklasjfdk sdlafjklsdfjklasdjfaskldjf sldkfjlaskdjflkasjdfkl jsdlkfjalskdfjasdf";
}

// styling
function markOdd(editor, lineFrom = 0){
    const count = editor.lineCount();
    for (i = Math.floor(lineFrom / 2) * 2 + 1; i < count; i += 2)
        editor.addLineClass(i, 'text', 'marked-text');
}

function cleanEmptyLines(editor){
    for (var i = editor.lineCount() - 1; editor.getLine(i).length === 0 && editor.getLine(i - 1).length === 0; i -= 2)
        editor.replaceRange('', {line: i - 2, ch: editor.getLine(i - 2).length}, {line: i + 1, ch: 0})
}

function onNewLine(cm) {
    const {line, ch} = cm.getCursor()
    const insert = (editor, lineAt, charAt) => {
        const   cursorLine = editor.getLine(lineAt),
                count = editor.lineCount(),
                isOnSecondBook = lineAt % 2,
                lastLineIdx = count - 1 + isOnSecondBook - 1  // last line of currently edited book
            
        editor.replaceRange( isOnSecondBook 
                           ? editor.lineSeparator() + editor.lineSeparator() + editor.getLine(lastLineIdx)  // \n {empty line} \n {line}
                           : editor.lineSeparator() + editor.getLine(lastLineIdx) + editor.lineSeparator()  // \n {line} \n {empty line}
                           , {line: count, ch: 0}) // right after the real last line
        // Shift from the end to the current line
        for (var i = lastLineIdx; i > lineAt; i -= 2)
            editor.replaceRange(editor.getLine(i - 2), {line: i, ch: 0}, {line: i, ch: editor.getLine(i).length})
        // Split current
        editor.replaceRange(cursorLine.slice(0, charAt), {line: lineAt, ch: 0}, {line: lineAt, ch: cursorLine.length})
        editor.replaceRange(cursorLine.slice(charAt), {line: lineAt + 2, ch: 0}, {line: lineAt + 2, ch: cursorLine.length})
        // clean excessive empty lines up
        cleanEmptyLines(editor)
        // mark new second book lines    
        markOdd(editor, count - 2)
        //
        editor.focus()
        editor.setCursor({line: lineAt + 2, ch: 0})
    }
    cm.operation(insert.bind(null, cm, line, ch))
}

function onBackspace(cm) {
    const {line, ch} = cm.getCursor()
    if (ch !== 0) 
        return CodeMirror.Pass // not handling unless when backspacing on the start of the row
    const backspace = (editor, lineAt) => {
        if (Math.floor(line / 2) === 0)
            return; // we are on one of the first lines

        const   cursorLine = editor.getLine(lineAt),
                prevLine = editor.getLine(lineAt - 2),
                count = editor.lineCount()
        // join current with previous
        editor.replaceRange(cursorLine, {line: lineAt - 2, ch: prevLine.length}, {line: lineAt - 2, ch: cursorLine.length + prevLine.length})
        // shifting up
        var i = lineAt + 2
        for (; i < count; i += 2)
            editor.replaceRange(editor.getLine(i), {line: i - 2, ch: 0}, {line: i - 2, ch: editor.getLine(i - 2).length})
        // clean the last one
        editor.replaceRange('', {line: i - 2, ch: 0}, {line: i - 2, ch: editor.getLine(i - 2).length})
        // clean excessive empty lines up
        cleanEmptyLines(editor)
        // mark new second book lines    
        markOdd(editor, lineAt - 2)
        // new focus
        editor.focus()
        editor.setCursor({line: lineAt - 2, ch: prevLine.length})
    }
    cm.operation(backspace.bind(null, cm, line))
}

function onDelete(cm) {
    const {line, ch} = cm.getCursor()
    if (cm.getLine(line).length !== ch) 
        return CodeMirror.Pass // not handling unless when deleting on the end of the row
    const del = (editor, lineAt, charAt) => {
        const   count = editor.lineCount()
        if (lineAt + 1 === count || lineAt + 2 === count)
            return; // we are on one of the end lines

        const   cursorLine = editor.getLine(lineAt),
                nextLine = editor.getLine(lineAt + 2)
        // join current with previous
        editor.replaceRange(nextLine, {line: lineAt, ch: charAt}, {line: lineAt, ch: charAt + nextLine.length})
        // shifting up
        var i = lineAt + 4
        for (; i < count; i += 2)
            editor.replaceRange(editor.getLine(i), {line: i - 2, ch: 0}, {line: i - 2, ch: editor.getLine(i - 2).length})
        // clean the last one
        editor.replaceRange('', {line: i - 2, ch: 0}, {line: i - 2, ch: editor.getLine(i - 2).length})
        // clean excessive empty lines up
        cleanEmptyLines(editor)
        // mark new second book lines    
        markOdd(editor, lineAt - 2)
        // new focus
        editor.focus()
        editor.setCursor({line: lineAt, ch: charAt})
    }
    cm.operation(del.bind(null, cm, line, ch))
}

function onPaste(editor, e) {
    const clipboardData = e.clipboardData || window.clipboardData;
    var   text = clipboardData.getData('Text').split(/[\r\n]+/)
    if (text.length < 2)
        return; // it's just a single line

    const {line, ch} = cm.getCursor()
    const paste = (editor, lineAt, charAt, textLines) => {
        const   count = editor.lineCount(),
                newCharAt = textLines[textLines.length - 1].length,
                newLineAt = lineAt + (textLines.length - 1) * 2,
                cursorLine = editor.getLine(lineAt),
                newFirstLine = cursorLine.slice(0, charAt) + textLines.shift() 
                             + (count % 2 === 1 ? editor.lineSeparator() : ''), // code below assumes there's always even number of rows
                isOnSecondBook = lineAt % 2
        // 
        textLines[textLines.length - 1] += cursorLine.slice(charAt)
        editor.replaceRange(newFirstLine, {line: lineAt, ch: 0}, {line: lineAt, ch: editor.getLine(lineAt).length})
        // 
        var i = lineAt + 2
        for (; i < count; i += 2) {
            const cur = editor.getLine(i)
            textLines.push(cur)
            editor.replaceRange(textLines.shift(), {line: i, ch: 0}, {line: i, ch: cur.length})
        }
        const sep = editor.lineSeparator() + editor.lineSeparator()
        const cont = textLines.join(sep)
        const rest = isOnSecondBook 
                   ? sep + cont
                   : editor.lineSeparator() + cont + editor.lineSeparator()
        editor.replaceRange(rest, {line: i, ch: 0})
        // clean excessive empty lines up
        cleanEmptyLines(editor)
        // mark new second book lines    
        markOdd(editor, lineAt)
        // new focus
        editor.focus()
        editor.setCursor({line: newLineAt, ch: newCharAt})
    }
    cm.operation(paste.bind(null, editor, line, ch, text))
    e.preventDefault()
}

function createSmartbookEditor(text = '') {
    var cm = CodeMirror(document.getElementById("editor"), {
        value: text, // initial value
        mode: "",
        indentUnit: 4,
        scrollbarStyle: 'overlay',
        lineNumbers: false, // no line numbers
        lineWrapping: true, // wrap long lines
        inputSyle: 'contenteditable'
    })
    markOdd(cm)
    // keyboard interception
    cm.setOption("extraKeys", {
        Enter: onNewLine,
        Backspace: onBackspace,
        Delete: onDelete
    })
    cm.on('paste', onPaste);
    return cm;
}

function resetSmartbookEditor(editor, text = '') {
    editor.setValue(text)
    markOdd(editor)
}