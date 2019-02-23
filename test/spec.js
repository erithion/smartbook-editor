describe("Smartbook-editor unit-tests", function () {
    const initData = 'Book1-Row1\nBook2-Row1\nBook1-Row2\nBook2-Row2\nBook1-Row3\nBook2-Row3'
    var cm = null;

    before(function() {
        cm = createSmartbookEditor()
    })
    
    beforeEach(function() {
        resetSmartbookEditor(cm, initData)
        cm.focus()
    })
    
    function keyPress(key) {
        var event = document.createEvent('Event')
        event.keyCode = key // Deprecated, prefer .key instead.
        event.key = key
        event.initEvent('keydown')
        var el = document.getElementsByTagName("textarea")[0]
        el.dispatchEvent(event)
    }
    
    function pasteText(html) {
        const text = html.replace('<[^>]*>', '')
        var dataTransfer = null
        try { 
            dataTransfer = new DataTransfer()
        } catch(e) {
        }
        var event = new ClipboardEvent('paste', {clipboardData: dataTransfer})
        event.clipboardData.setData('text/plain', text)

        var el = document.getElementsByTagName("textarea")[0]
        el.dispatchEvent(event)
    }
    
    it("Enter. Book 2. i-th line.", function () {
        cm.setCursor({line: 3, ch: 5})
        
        keyPress(13)

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1\nBook1-Row2\nBook2\nBook1-Row3\n-Row2\n\nBook2-Row3'
        expect(res).to.equal(exp)
    })

    it("Enter. Book 2. After end.", function () {
        cm.setCursor({line: 5, ch: 10})
        
        keyPress(13)

        const res = cm.getValue()
        expect(res).to.equal(initData)
    })
    
    it("Enter. Book 1 - i-th line.", function () {
        cm.setCursor({line: 2, ch: 0})
        
        keyPress(13)

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1\n\nBook2-Row2\nBook1-Row2\nBook2-Row3\nBook1-Row3\n'
        expect(res).to.equal(exp)
    })

    it("Enter. Book 1. After end.", function () {
        cm.setCursor({line: 4, ch: 10})
        
        keyPress(13)

        const res = cm.getValue()
        expect(res).to.equal(initData)
    })
    
    it("Backspace. Book 2. i-th line.", function () {
        cm.setCursor({line: 3, ch: 0})
        
        keyPress(8)

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1Book2-Row2\nBook1-Row2\nBook2-Row3\nBook1-Row3\n'
        expect(res).to.equal(exp)
    })

    it("Backspace. Book 2. Before start.", function () {
        cm.setCursor({line: 1, ch: 0})
        
        keyPress(8)

        const res = cm.getValue()
        expect(res).to.equal(initData)
    })
    
    it("Backspace. Book 1. i-th line.", function () {
        cm.setCursor({line: 2, ch: 0})
        
        keyPress(8)

        const res = cm.getValue()
        const exp = 'Book1-Row1Book1-Row2\nBook2-Row1\nBook1-Row3\nBook2-Row2\n\nBook2-Row3'
        expect(res).to.equal(exp)
    })

    it("Backspace. Book 1. Before start.", function () {
        cm.setCursor({line: 0, ch: 0})
        
        keyPress(8)

        const res = cm.getValue()
        expect(res).to.equal(initData)
    })
    
    it("Delete. Book 2. i-th line.", function () {
        cm.setCursor({line: 1, ch: 10})
        
        keyPress(46)

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1Book2-Row2\nBook1-Row2\nBook2-Row3\nBook1-Row3\n'
        expect(res).to.equal(exp)
    })

    it("Delete. Book 2. After end.", function () {
        cm.setCursor({line: 5, ch: 10})
        
        keyPress(46)

        const res = cm.getValue()
        expect(res).to.equal(initData)
    })

    it("Delete. Book 1. i-th line.", function () {
        cm.setCursor({line: 0, ch: 10})
        
        keyPress(46)

        const res = cm.getValue()
        const exp = 'Book1-Row1Book1-Row2\nBook2-Row1\nBook1-Row3\nBook2-Row2\n\nBook2-Row3'
        expect(res).to.equal(exp)
    })

    it("Delete. Book 1. After end.", function () {
        cm.setCursor({line: 4, ch: 10})
        
        keyPress(46)

        const res = cm.getValue()
        expect(res).to.equal(initData)
    })

    // Paste events may not work in some browsers: IE, Edge, iOS Safari. These tests were created in Opera
    it("Paste. Both books. Inserts as first.", function () {
        resetSmartbookEditor(cm, '')
        cm.focus()
        
        pasteText(initData)

        cm.undo() // preventDefault doesn't work on paste in codemirror (maybe because of simulated paste event)
                  // and as a consequence we have to inserts at this point
        const res = cm.getValue()
        const exp = 'Book1-Row1\n\nBook2-Row1\n\nBook1-Row2\n\nBook2-Row2\n\nBook1-Row3\n\nBook2-Row3\n'
        expect(res).to.equal(exp)
    })
    
    it("Paste. Book 1. Into empty.", function () {
        resetSmartbookEditor(cm, '')
        cm.focus()
        
        pasteText('Book1-Row1\nBook1-Row2\nBook1-Row3')

        cm.undo() // preventDefault doesn't work on paste in codemirror (maybe because of simulated paste event)
                  // and as a consequence we have to inserts at this point
        const res = cm.getValue()
        const exp = 'Book1-Row1\n\nBook1-Row2\n\nBook1-Row3\n'
        expect(res).to.equal(exp)
    })
    
    it("Paste. Book 1 then Book 2. Into empty.", function () {
        resetSmartbookEditor(cm, '')
        cm.focus()
        
        pasteText('Book1-Row1\nBook1-Row2\nBook1-Row3')
        cm.undo() // preventDefault doesn't work on paste in codemirror (maybe because of simulated paste event)
                  // and as a consequence we have to inserts at this point
        cm.setCursor({line: 1, ch: 0})

        pasteText('Book2-Row1\nBook2-Row2\nBook2-Row3')
        cm.undo() // preventDefault doesn't work on paste in codemirror (maybe because of simulated paste event)
                  // and as a consequence we have to inserts at this point
        
        const res = cm.getValue()
        expect(res).to.equal(initData)
    })
    
    it("Paste. Book 1. i-th line. Non-empty.", function () {
        cm.setCursor({line: 2, ch: 1})
        
        pasteText('Some\nrandom\ntext')
        cm.undo() // preventDefault doesn't work on paste in codemirror (maybe because of simulated paste event)
                  // and as a consequence we have to inserts at this point

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1\nBSome\nBook2-Row2\nrandom\nBook2-Row3\ntextook1-Row2\n\nBook1-Row3\n'
        expect(res).to.equal(exp)
    })

    it("Paste. Book 2. i-th line. Non-empty.", function () {
        cm.setCursor({line: 3, ch: 1})
        
        pasteText('Some\nrandom\ntext')
        cm.undo() // preventDefault doesn't work on paste in codemirror (maybe because of simulated paste event)
                  // and as a consequence we have to inserts at this point

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1\nBook1-Row2\nBSome\nBook1-Row3\nrandom\n\ntextook2-Row2\n\nBook2-Row3'
        expect(res).to.equal(exp)
    })
        
})