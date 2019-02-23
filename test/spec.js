describe("Smartbook-editor unit-tests", function () {
    const initData = 'Book1-Row1\nBook2-Row1\nBook1-Row2\nBook2-Row2\nBook1-Row3\nBook2-Row3'
    var cm = null;

    before(function() {
        cm = createSmartbookEditor()
    })
    
    beforeEach(function() {
        resetSmartbookEditor(cm, initData)
    })
    
    function keyPress(key) {
        var event = document.createEvent('Event')
        event.keyCode = key // Deprecated, prefer .key instead.
        event.key = key
        event.initEvent('keydown')
        var el = document.getElementsByTagName("textarea")[0]
        el.dispatchEvent(event)
    }
    
    it("Enter. Book 2. i-th line.", function () {
        cm.focus()
        cm.setCursor({line: 3, ch: 5})
        const event = keyPress(13)

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1\nBook1-Row2\nBook2\nBook1-Row3\n-Row2\n\nBook2-Row3'
        expect(cm.getValue()).to.equal(exp);
    })

    it("Enter. Book 2. After end.", function () {
        cm.focus()
        cm.setCursor({line: 5, ch: 10})
        const event = keyPress(13)

        const res = cm.getValue()
        expect(cm.getValue()).to.equal(initData);
    })
    
    it("Enter. Book 1 - i-th line.", function () {
        cm.focus()
        cm.setCursor({line: 2, ch: 0})
        const event = keyPress(13)

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1\n\nBook2-Row2\nBook1-Row2\nBook2-Row3\nBook1-Row3\n'
        expect(cm.getValue()).to.equal(exp);
    })

    it("Enter. Book 1. After end.", function () {
        cm.focus()
        cm.setCursor({line: 4, ch: 10})
        const event = keyPress(13)

        const res = cm.getValue()
        expect(cm.getValue()).to.equal(initData);
    })
    
    it("Backspace. Book 2. i-th line.", function () {
        cm.focus()
        cm.setCursor({line: 3, ch: 0})
        const event = keyPress(8)

        const res = cm.getValue()
        const exp = 'Book1-Row1\nBook2-Row1Book2-Row2\nBook1-Row2\nBook2-Row3\nBook1-Row3\n'
        expect(cm.getValue()).to.equal(exp);
    })

    it("Backspace. Book 2. Before start.", function () {
        cm.focus()
        cm.setCursor({line: 1, ch: 0})
        const event = keyPress(8)

        const res = cm.getValue()
        expect(cm.getValue()).to.equal(initData);
    })
    
    it("Backspace. Book 1. i-th line.", function () {
        cm.focus()
        cm.setCursor({line: 2, ch: 0})
        const event = keyPress(8)

        const res = cm.getValue()
        const exp = 'Book1-Row1Book1-Row2\nBook2-Row1\nBook1-Row3\nBook2-Row2\n\nBook2-Row3'
        expect(cm.getValue()).to.equal(exp);
    })

    it("Backspace. Book 1. Before start.", function () {
        cm.focus()
        cm.setCursor({line: 0, ch: 0})
        const event = keyPress(8)

        const res = cm.getValue()
        expect(cm.getValue()).to.equal(initData);
    })
    
})