var mainWindow = require("electron").remote.getCurrentWindow();

// editor
Global = window.Global || {};
Global.editor = (function() {

	// Editor elements
	var headerField, contentField, cleanSlate, lastType, currentNodeList, savedSelection;

	// Editor Bubble elements
	var textOptions, optionsBox, boldButton, italicButton, strikeButton, underButton, subButton, supButton, urlButton, urlInput, wordsCount, charactersCount;

	var composing;

    var lastNote, currentSettings, notesList, menuPlusButton;

	function init() {

		composing = false;
		bindElements();

		// Set cursor position
		var range = document.createRange();
		var selection = window.getSelection();
		range.setStart(headerField, 1);
		selection.removeAllRanges();
		selection.addRange(range);

		createEventBindings();

		// Load state if storage is supported
		if ( Global.util.supportsHtmlStorage() ) {
			loadState();
		}
	}

	function createEventBindings() {

		// Key up bindings
		if ( Global.util.supportsHtmlStorage() ) {

			document.onkeyup = function( event ) {
				checkTextHighlighting( event );
				saveState();
			}

		} else {
			document.onkeyup = checkTextHighlighting;
		}
		
		//Cancel any kind of formatting
		document.addEventListener("paste", function(e) {
			// cancel paste
			e.preventDefault();

			// get text representation of clipboard
			var text = e.clipboardData.getData("text/plain");

			// insert text manually
			document.execCommand("insertHTML", false, text);
		});

		// Mouse bindings
		document.onmousedown = checkTextHighlighting;
		document.onmouseup = function( event ) {

			setTimeout( function() {
				checkTextHighlighting( event );
			}, 1);
		};

		// Window bindings
		window.addEventListener( 'resize', function( event ) {
			updateBubblePosition();
		});


		document.body.addEventListener( 'scroll', function() {

			// TODO: Debounce update bubble position to stop excessive redraws
			updateBubblePosition();
		});

		// Composition bindings. We need them to distinguish
		// IME composition from text selection
		document.addEventListener( 'compositionstart', onCompositionStart );
		document.addEventListener( 'compositionend', onCompositionEnd );
	}


	function bindElements() {

		headerField = document.querySelector( '.header' );
		contentField = document.querySelector( '.content' );
		textOptions = document.querySelector( '.text-options' );

		optionsBox = textOptions.querySelector( '.options' );

		boldButton = textOptions.querySelector( '.bold' );
		boldButton.onclick = onBoldClick;

		italicButton = textOptions.querySelector( '.italic' );
		italicButton.onclick = onItalicClick;

        strikeButton = textOptions.querySelector( '.strike');
        strikeButton.onclick = onStrikeClick;

        underButton = textOptions.querySelector( '.under');
        underButton.onclick = onUnderClick;

		urlButton = textOptions.querySelector( '.url' );
		urlButton.onmousedown = onUrlClick;

		subButton = textOptions.querySelector( '.sub' );
		subButton.onmousedown = onSubClick;

		supButton = textOptions.querySelector( '.sup' );
		supButton.onmousedown = onSupClick;

		urlInput = textOptions.querySelector( '.url-input' );
		urlInput.onblur = onUrlInputBlur;
		urlInput.onkeydown = onUrlInputKeyDown;


        // register the handler for shortcuts
        document.addEventListener('keyup', doc_keyUp, false);
        contentField.addEventListener('keydown', doc_keyDown, false);

        wordsCount = document.querySelector( '.words-count');
        charactersCount = document.querySelector( '.characters-count');

        menuPlusButton = document.querySelector( '.menu-plus' );
        menuPlusButton.onclick = onMenuPlusClick;

        $('body').on('click', '.menu-page', onMenuPageClick);
		$('body').on('click', '.delete-note', onDeleteNoteClick);
	}

	function checkTextHighlighting( event ) {

		var selection = window.getSelection();


		if ( (event.target.className === "url-input" ||
		    event.target.classList.contains( "url" ) ||
            (event.target.parentNode!=null && event.target.parentNode.classList.contains( "ui-inputs" ) ) ) ) {

			currentNodeList = findNodes( selection.focusNode );
			updateBubbleStates();
			return;
		}

		// Check selections exist
		if ( selection.isCollapsed === true && lastType === false ) {

			onSelectorBlur();
		}

		// Text is selected
		if ( selection.isCollapsed === false && composing === false ) {
            var words, characters;

            if ( selection.toString() === "" ) {
                words = 0
            } else {
                words = selection.toString().split(/\s+/).length;
            }
            characters = selection.toString().length;
            wordsCount.innerHTML = words.toString().concat(words==1?" word":" words");
            charactersCount.innerHTML = characters.toString().concat(characters==1?" character":" characters");

			currentNodeList = findNodes( selection.focusNode );

			// Find if highlighting is in the editable area
			if ( hasNode( currentNodeList, "ARTICLE") ) {
				updateBubbleStates();
				updateBubblePosition();

				// Show the ui bubble
				textOptions.className = "text-options active";
			}
		}

		lastType = selection.isCollapsed;
	}

	function updateBubblePosition() {
		try {
			var selection = window.getSelection();
			var range = selection.getRangeAt(0);
			var boundary = range.getBoundingClientRect();

			textOptions.style.top = boundary.top - 5 + window.pageYOffset + "px";
			textOptions.style.left = (boundary.left + boundary.right)/2 - 30 + "px"; //Left + Right / 2 - 1 element + px
		} catch (e) {

		}
	}

	function updateBubbleStates() {

		// It would be possible to use classList here, but I feel that the
		// browser support isn't quite there, and this functionality doesn't
		// warrent a shim.

		if ( hasNode( currentNodeList, 'B') ) {
			boldButton.className = "bold useicons active"
		} else {
			boldButton.className = "bold useicons"
		}
		
		if ( hasNode( currentNodeList, 'SUP') ) {
			supButton.className = "sup useicons active"
		} else {
			supButton.className = "sup useicons"
		}

		if ( hasNode( currentNodeList, 'SUB') ) {
			subButton.className = "sub useicons active"
		} else {
			subButton.className = "sub useicons"
		}

		if ( hasNode( currentNodeList, 'I') ) {
			italicButton.className = "italic useicons active"
		} else {
			italicButton.className = "italic useicons"
		}

        if ( hasNode( currentNodeList, 'STRIKE') ) {
			strikeButton.className = "strike useicons active"
		} else {
			strikeButton.className = "strike useicons"
		}

        if ( hasNode( currentNodeList, 'U') ) {
			underButton.className = "under useicons active"
		} else {
			underButton.className = "under useicons"
		}

		if ( hasNode( currentNodeList, 'A') ) {
			urlButton.className = "url useicons active"
		} else {
			urlButton.className = "url useicons"
		}
	}

	function onSelectorBlur() {

		textOptions.className = "text-options fade";
		setTimeout( function() {

			if (textOptions.className == "text-options fade") {

				textOptions.className = "text-options";
				textOptions.style.top = '-999px';
				textOptions.style.left = '-999px';
			}
		}, 260 )
        wordsCount.innerHTML = Global.editor.getWordCount().toString().concat(Global.editor.getWordCount()==1?" word":" words");
        charactersCount.innerHTML = Global.editor.getCharacterCount().toString().concat(Global.editor.getCharacterCount()==1?" character":" characters");
	}

	function findNodes( element ) {

		var nodeNames = {};
		var selection = window.getSelection();

		while ( element.parentNode ) {

			nodeNames[element.nodeName] = true;
			element = element.parentNode;

			if ( element.nodeName === 'A' ) {
				nodeNames.url = element.href;
			}
		}

		return nodeNames;
	}

	function hasNode( nodeList, name ) {

		return !!nodeList[ name ];
	}

	function saveState( event ) {
        localStorage.setItem('darkLayout', document.body.classList.contains('light-mode') ? false: true);

        currentSettings.header = headerField.innerHTML;
        currentSettings.content = contentField.innerHTML;

        localStorage.setItem('lastNote', lastNote);
        localStorage.setItem('notesList', JSON.stringify(notesList));
        localStorage.setItem(lastNote, JSON.stringify(currentSettings));
	}

	function loadState() {

        lastNote = localStorage.getItem('lastNote') || "1";
        notesList = localStorage.getItem('notesList')? JSON.parse(localStorage.getItem('notesList')) : [1];
        localStorage.setItem('lastNote', lastNote);
        currentSettings = localStorage.getItem(lastNote) === null?
            {
                header: headerField.innerHTML,
                content: contentField.innerHTML
            }:
            JSON.parse(localStorage.getItem(lastNote));
        localStorage.setItem(lastNote, JSON.stringify(currentSettings));

        var darkLayout = localStorage.getItem('darkLayout') === null? false : localStorage.getItem('darkLayout');
		if (darkLayout==="true") {
            document.body.className = 'dark-mode no-transition';
        }
        else {
            document.body.className = 'light-mode no-transition';
        }

        refreshPage();
	}

    function refreshPage() {
        headerField.innerHTML = currentSettings.header;
        contentField.innerHTML = currentSettings.content;

        $('.menu-container').each(function(i, obj) {
            obj.remove();
        });

        notesList.forEach(function(entry) {
			var currentMenuContainer = document.createElement("div");
			currentMenuContainer.className = "menu-container";
            var currentMenuPage = document.createElement("div");
            currentMenuPage.className = entry==lastNote?"menu-page menu-selected":"menu-page";
            currentMenuPage.id = entry;
            currentMenuPage.textContent = JSON.parse(localStorage.getItem(entry)).header;
			var deleteNote = document.createElement("button");
			deleteNote.className = "delete-note useicons";
			deleteNote.innerHTML = "&#xe905;"
            deleteNote.id = entry;
			currentMenuContainer.appendChild(currentMenuPage);
			currentMenuContainer.appendChild(deleteNote);
            $('#notes-menu').append(currentMenuContainer);
        });
    }

	function onBoldClick() {
		document.execCommand( 'bold', false );
        saveState();
	}

	function onSubClick() {
		document.execCommand( 'subscript', false );
		updateBubblePosition();
        saveState();
	}

	function onSupClick() {
		document.execCommand( 'superscript', false );
		updateBubblePosition();
        saveState();
	}

	function onIndentClick() {
		document.execCommand( 'indent', false );
		updateBubblePosition();
        saveState();
	}

	function onOutdentClick() {
		document.execCommand( 'outdent', false );
		updateBubblePosition();
        saveState();
	}

    function onStrikeClick() {
        document.execCommand( 'strikeThrough', false );
        saveState();
    }

    function onUnderClick() {
        document.execCommand( 'underline', false );
        saveState();
    }

	function onItalicClick() {
		document.execCommand( 'italic', false );
        saveState();
	}

    function insertTab() {
        document.execCommand('insertText', false, "\t")
        saveState();
    }

	function onUrlClick() {

		if ( optionsBox.className == 'options' ) {

			optionsBox.className = 'options url-mode';

			// Set timeout here to debounce the focus action
			setTimeout( function() {

				var nodeNames = findNodes( window.getSelection().focusNode );

				if ( hasNode( nodeNames , "A" ) ) {
					urlInput.value = nodeNames.url;
				} else {
					// Symbolize text turning into a link, which is temporary, and will never be seen.
					document.execCommand( 'createLink', false, '/' );
				}

				// Since typing in the input box kills the highlighted text we need
				// to save this selection, to add the url link if it is provided.
				lastSelection = window.getSelection().getRangeAt(0);
				lastType = false;

				urlInput.focus();

			}, 100);

		} else {

			optionsBox.className = 'options';
		}
	}

	function onUrlInputKeyDown( event ) {

		if ( event.keyCode === 13 ) {
			event.preventDefault();
			applyURL( urlInput.value );
			urlInput.blur();
		}
	}

	function onUrlInputBlur( event ) {

		optionsBox.className = 'options';
		applyURL( urlInput.value );
		urlInput.value = '';

		currentNodeList = findNodes( window.getSelection().focusNode );
		updateBubbleStates();
	}

	function applyURL( url ) {

		rehighlightLastSelection();

		// Unlink any current links
		document.execCommand( 'unlink', false );

		if (url !== "") {

			// Insert HTTP if it doesn't exist.
			if ( !url.match("^(http|https)://") ) {

				url = "http://" + url;
			}

			document.execCommand( 'createLink', false, url );
		}
        saveState();
	}

	function rehighlightLastSelection() {

		window.getSelection().addRange( lastSelection );
	}

	function getWordCount() {
		var text = Global.util.getText(contentField);

		if ( text === "" ) {
			return 0
		} else {
			return text.split(/\s+/).length;
		}
	}

    function getCharacterCount() {
        var text = Global.util.getText( contentField );

        return text.length;
    }

	function onCompositionStart ( event ) {
		composing = true;
	}

	function onCompositionEnd (event) {
		composing = false;
	}

    // define a handler
    function doc_keyUp(e) {
		currentNodeList = findNodes( window.getSelection().focusNode );
		inTitle = !hasNode( currentNodeList, "ARTICLE");

        //Ctrl + S
        if (e.ctrlKey && e.keyCode == 83) {
            onStrikeClick();
        }

		//Ctrl + [
        if (e.ctrlKey && e.keyCode == 219 && !inTitle) {
            onOutdentClick();
        }

        //Ctrl + ]
        if (e.ctrlKey && e.keyCode == 221 && !inTitle) {
            onIndentClick();
        }

		//Ctrl + Shift + -
        if (e.ctrlKey && e.shiftKey && e.keyCode == 189 && !inTitle) {
            onSubClick();
        }

		//Ctrl + Shift + +
        if (e.ctrlKey && e.shiftKey && e.keyCode == 187 && !inTitle) {
            onSupClick();
        }

        //Ctrl + P
        if (e.ctrlKey && e.keyCode == 80) {
            window.print();
        }

        //Ctrl + Shift + F
        if (e.ctrlKey && e.shiftKey && e.keyCode == 70) {
            screenSizeElement = document.querySelector( '.fullscreen' );

            mainWindow.setFullScreen(!mainWindow.isFullScreen());
            if ( mainWindow.isFullScreen() ) {
                screenSizeElement.innerHTML = shrinkScreenIcon;
            } else {
                screenSizeElement.innerHTML = expandScreenIcon;
            }
        }
    }

    // define a handler
    function doc_keyDown(e) {
        if(e.keyCode == 9 || e.which == 9) {
            insertTab();
            e.preventDefault();
        }
    }

    function onMenuPlusClick( event ) {
		var i = notesList.length + 1;
        var newSetting = {
            header: "Title",
            content: ""
        };
        notesList.push(i);
        localStorage.setItem(i,JSON.stringify(newSetting));
        lastNote = i;
        headerField.innerHTML = newSetting.header;
        contentField.innerHTML = newSetting.content;
        saveState();
        refreshPage();
    }

    function onMenuPageClick ( event ) {
        lastNote = $(this).attr("ID");
        headerField.innerHTML = JSON.parse(localStorage.getItem(lastNote)).header;
        contentField.innerHTML = JSON.parse(localStorage.getItem(lastNote)).content;
        saveState();
        refreshPage();
        wordsCount.innerHTML = Global.editor.getWordCount().toString().concat(Global.editor.getWordCount()==1?" word":" words");
        charactersCount.innerHTML = Global.editor.getCharacterCount().toString().concat(Global.editor.getCharacterCount()==1?" character":" characters");
    }

	function onDeleteNoteClick ( event ) {
		if (notesList.length > 1) {
			var deleteNote = $(this).attr("ID");
			var deleteCurrent = lastNote == deleteNote;

			for(i = deleteNote; i < notesList.length; i++) {
				console.log(i);
				localStorage.setItem(i, localStorage.getItem(String(Number(i)+1)));
			}

			if(deleteCurrent) {
				lastNote = Number(lastNote) - 1 > 0 ? String(Number(lastNote) - 1) : lastNote;
				headerField.innerHTML = JSON.parse(localStorage.getItem(lastNote)).header;
				contentField.innerHTML = JSON.parse(localStorage.getItem(lastNote)).content;
			}

			localStorage.removeItem(notesList.length);
			notesList.pop();

			saveState();
			refreshPage();
		}
    }

	return {
		init: init,
		saveState: saveState,
		getWordCount: getWordCount,
        getCharacterCount: getCharacterCount,
        refreshPage: refreshPage
	}

})();
