/*
 * Copyright (c) 2005-2007 Henri Sivonen
 * Copyright (c) 2007-2008 Mozilla Foundation
 * Copyright (c) 2007 Simon Pieters
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
var hasDuplicateMessages = false
var currentOl = null
var ungroupedOl = null
var groupedOl = null
var urlInput = null
var fileInput = null
var textarea = null
var hasTextContent = (createHtmlElement('code').textContent != undefined)

function boot(){
    initFieldHolders()
    schemaChanged()
    parserChanged()
    initGrouping()
}

function initFieldHolders(){
    if (document.forms[0].className == 'simple') {
        return
    }
    urlInput = document.getElementById('doc')
    
    textarea = createHtmlElement('textarea')
    if (textarea) {
        textarea.cols = 72
        textarea.rows = 15
        textarea.id = 'doc'
        textarea.name = 'content'
        copySourceIntoTextArea()
        if (textarea.value == '') {
            textarea.value = '<!DOCTYPE html>\n<html>\n<head>\n<title></title>\n</head>\n<body>\n<p></p>\n</body>\n</html>'
        }
    }
    
    fileInput = createHtmlElement('input')
    if (fileInput) {
        fileInput.type = 'file'
        fileInput.id = 'doc'
        fileInput.name = 'file'
    }
    
    var td = urlInput.parentNode
    if (td) {
        var th = td.previousSibling
        var label = th.firstChild
        var modeSelect = createHtmlElement("select")
        modeSelect.appendChild(createOption('Address', ''))
        modeSelect.appendChild(createOption('File Upload', 'file'))
        modeSelect.appendChild(createOption('Text Field', 'textarea'))
        modeSelect.onchange = function(){
            if (this.value == 'file') {
                installFileUpload()
            }
            else 
                if (this.value == 'textarea') {
                    installTextarea()
                }
                else {
                    installUrlInput()
                }
        }
        th.replaceChild(modeSelect, label)
    }
}

function createOption(text, value){
    var rv = createHtmlElement('option')
    rv.value = value
    var tn = document.createTextNode(text)
    rv.appendChild(tn)
    return rv
}

function schemaChanged(){
    if (document.getElementById) {
        var input = document.getElementById("schema")
        var select = document.getElementById("preset")
        if (input) {
            var value = input.value
            if (select) {
                if (select.firstChild) {
                    for (var n = select.firstChild; n != null; n = n.nextSibling) {
                        if (n.value == value) {
                            n.selected = true
                            toggleParsers(value)
                            return
                        }
                    }
                    select.firstChild.selected = true
                    toggleParsers("")
                }
            }
        }
    }
}

function presetChanged(){
    if (document.getElementById) {
        var input = document.getElementById("schema")
        var select = document.getElementById("preset")
        if (input && select) {
            input.value = select.value
        }
    }
    toggleParsers(select.value)
}

function toggleParsers(newValue){
    if (document.getElementById) {
        var preset = document.getElementById("preset")
        if (preset) {
            if (isHtmlCompatiblePreset(newValue)) {
                var select = document.getElementById("parser")
                if (select) {
                    if (select.firstChild) {
                        for (var n = select.firstChild; n != null; n = n.nextSibling) {
                            n.disabled = false
                        }
                        if (document.getElementById('doc').name == 'content') {
                            // text area case
                            if (select.firstChild.selected) {
                                select.firstChild.nextSibling.nextSibling.nextSibling.selected = true
                                disableById('nsfilter')
                            }
                            select.firstChild.disabled = true
                        }
                    }
                }
            }
            else {
                var select = document.getElementById("parser")
                if (select) {
                    if (select.firstChild) {
                        if (select.firstChild.selected) {
                            select.firstChild.nextSibling.selected = true
                        }
                        for (var n = select.firstChild; n != null; n = n.nextSibling) {
                            n.disabled = (n.value == "" || isHtmlParserValue(n.value))
                        }
                    }
                }
            }
        }
    }
}

function isHtmlParserValue(parser){
    return (parser.indexOf("html") == 0)
}

function isHtmlCompatiblePreset(preset){
    return (preset == "" ||
    preset.indexOf("http://s.validator.nu/xhtml10/xhtml-basic.rnc") == 0 ||
    preset.indexOf("http://s.validator.nu/xhtml10/xhtml-frameset.rnc") == 0 ||
    preset.indexOf("http://s.validator.nu/xhtml10/xhtml-strict.rnc") == 0 ||
    preset.indexOf("http://s.validator.nu/xhtml10/xhtml-transitional.rnc") == 0 ||
    preset.indexOf("http://s.validator.nu/html5/html5full.rnc") == 0)
}

function parserChanged(){
    if (document.getElementById) {
        var parser = document.getElementById("parser")
        if (parser) {
            if (isHtmlParserValue(parser.value)) {
                var select = document.getElementById("preset")
                if (select) {
                    if (select.firstChild) {
                        for (var n = select.firstChild; n != null; n = n.nextSibling) {
                            n.disabled = !isHtmlCompatiblePreset(n.value)
                        }
                    }
                }
                var nsfilter = document.getElementById("nsfilter")
                if (nsfilter) {
                    nsfilter.disabled = true
                }
            }
            else {
                var select = document.getElementById("preset")
                if (select) {
                    if (select.firstChild) {
                        for (var n = select.firstChild; n != null; n = n.nextSibling) {
                            n.disabled = false
                        }
                    }
                }
                var nsfilter = document.getElementById("nsfilter")
                if (nsfilter) {
                    nsfilter.disabled = false
                }
            }
        }
    }
}

function formSubmission(){
    if (document.getElementById) {
        if (document.getElementsByTagName) {
            var form = document.getElementsByTagName("form")[0]
            if (form.checkValidity) {
                if (!form.checkValidity()) {
                    return true
                }
            }
        }
        disableById("submit")
        disableById("preset")
        disableByIdIfEmptyString("parser")
        disableByIdIfEmptyString("schema")
        disableByIdIfEmptyString("charset")
        disableByIdIfEmptyString("nsfilter")
        maybeMoveDocumentRowDown()
        return true
    }
}

function maybeMoveDocumentRowDown(){
    var field = document.getElementById('doc')
    if (field && field.name != 'doc') {
        var td = field.parentNode
        if (td) {
            var tr = td.parentNode
            var tbody = tr.parentNode
            tbody.appendChild(tr)
        }
    }
}

function disableById(id){
    var field = document.getElementById(id)
    if (field) {
        field.disabled = true
    }
}

function disableByIdIfEmptyString(id){
    var field = document.getElementById(id)
    if (field) {
        if ("" == field.value) {
            field.disabled = true
        }
    }
}

function enableById(id){
    var field = document.getElementById(id)
    if (field) {
        field.disabled = false
    }
}

function createHtmlElement(tagName){
    return document.createElementNS ? document.createElementNS("http://www.w3.org/1999/xhtml", tagName) : document.createElement(tagName)
}

function installGroupingToggle(){
    var para = createHtmlElement('p')
    var button = createHtmlElement('input')
    button.type = 'button'
    button.value = 'Group Messages'
    para.appendChild(button)
    if (hasDuplicateMessages) {
        button.onclick = function(){
            if (currentOl == ungroupedOl) {
                currentOl.parentNode.replaceChild(groupedOl, currentOl)
                currentOl = groupedOl
                this.value = 'Ungroup Messages'
            }
            else {
                currentOl.parentNode.replaceChild(ungroupedOl, currentOl)
                currentOl = ungroupedOl
                this.value = 'Group Messages'
            }
        }
    }
    else {
        button.disabled = true
    }
    currentOl.parentNode.insertBefore(para, currentOl)
}

function initGrouping(){
    var n = document.documentElement.lastChild.firstChild
    while (n) {
        // The line below protects IE users from a crash
        if (n instanceof HTMLOListElement && n.className != 'source') { // deliberately IE-incompatible
            //		if (n.start) { // cross-browser compatible
            currentOl = n
            break
        }
        n = n.nextSibling
    }
    if (!currentOl) {
        return
    }
    ungroupedOl = currentOl
    groupedOl = buildGrouped(ungroupedOl)
    installGroupingToggle()
}

function buildGrouped(ol){
    var locListByMsg = {}
    var rv = createHtmlElement('ol')
    var li = ol.firstChild
    var i = 1
    while (li) {
        var msgPara = li.firstChild
        var locExtract = createHtmlElement('li')
        locExtract.value = i
        var loc = msgPara.nextSibling
        var elaboration = null
        if (loc && loc.className && loc.className == 'location') {
            locExtract.appendChild(loc.cloneNode(true))
            var extract = loc.nextSibling
            if (extract && extract.className && extract.className == 'extract') {
                locExtract.appendChild(extract.cloneNode(true))
                elaboration = extract.nextSibling
            }
            else {
                elaboration = extract
            }
        }
        else {
            elaboration = loc
            var noLoc = createHtmlElement('p')
            noLoc.appendChild(document.createTextNode("(No location)"))
            locExtract.appendChild(noLoc)
        }
        var locList = null
        var msgText = msgPara.innerHTML
        locList = locListByMsg[msgText]
        if (locList) {
            hasDuplicateMessages = true
        }
        else {
            locList = createHtmlElement('ol')
            locListByMsg[msgText] = locList
            var msgItem = createHtmlElement('li')
            msgItem.className = li.className
            msgItem.appendChild(msgPara.cloneNode(true))
            if (elaboration) {
                msgItem.appendChild(elaboration.cloneNode(true))
            }
            msgItem.appendChild(locList)
            rv.appendChild(msgItem)
        }
        locList.appendChild(locExtract)
        
        li = li.nextSibling
        i++
    }
    
    return rv
}

function installTextarea(){
    if (document.getElementById) {
        var input = document.getElementById('doc')
        if (input && textarea) {
            var form = document.forms[0]
            if (form) {
                form.method = 'post'
                form.enctype = 'multipart/form-data'
                input.parentNode.replaceChild(textarea, input)
                disableById('charset')
                schemaChanged()
            }
        }
    }
}

function installFileUpload(){
    if (document.getElementById) {
        var input = document.getElementById('doc')
        if (input && fileInput) {
            var form = document.forms[0]
            if (form) {
                form.method = 'post'
                form.enctype = 'multipart/form-data'
                input.parentNode.replaceChild(fileInput, input)
                enableById('charset')
                schemaChanged()
            }
        }
    }
}

function installUrlInput(){
    if (document.getElementById) {
        var input = document.getElementById('doc')
        if (input && urlInput) {
            var form = document.forms[0]
            if (form) {
                form.method = 'get'
                form.enctype = ''
                input.parentNode.replaceChild(urlInput, input)
                enableById('charset')
                schemaChanged()
            }
        }
    }
}

function copySourceIntoTextArea(){
    var strings = []
    var source = null
    var n = document.documentElement.lastChild.firstChild
    while (n) {
        if (n.className == 'source') {
            source = n
            break
        }
        n = n.nextSibling
    }
    if (source && textarea) {
        var li = source.firstChild
        while (li) {
            var code = li.firstChild
            if (hasTextContent) {
                strings.push(code.textContent)
            }
            else {
                strings.push(code.innerText)
            }
            li = li.nextSibling
        }
        textarea.value = strings.join('\n')
    }
}

window.onunload = function(){
    if (document.getElementById) {
        enableById("submit")
        enableById("preset")
        enableById("parser")
        enableById("schema")
        enableById("charset")
        enableById("nsfilter")
        schemaChanged()
        parserChanged()
    }
}
