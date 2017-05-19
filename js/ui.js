// ui functions
var mainWindow = require('electron').remote.getCurrentWindow();
var shell = require('electron').shell;
var $ = require('jquery');
const TitlebarWindows = require('electron-titlebar-windows');

Global = window.Global || {};
Global.ui = (function() {

	// Base elements
	var body, article, uiContainer, panel, descriptionModal, header, wordsCount;

	// Buttons
	var screenSizeElement, colorLayoutElement, printElement, menuElement;
    var crossButton, minusButton, windowSizeButton;

    var wordCountValue;

	var expandScreenIcon = '&#xe901;';
	var shrinkScreenIcon = '&#xe907;';


	function init() {
		bindElements();
	}

	function bindElements() {

		// Body element for light/dark styles
		body = document.body;
        panel = document.querySelector( '#panel');
        section = document.querySelector( 'section');
        section.onclick = onSectionClick;

        let titlebar = new TitlebarWindows({
            darkMode: false,
            backgroundColor: '#00000000',
            draggable: true
        });

        titlebar.appendTo(body);
        titlebar.on('close', function(e) {
            onCrossKeyPress();
        });
        titlebar.on('minimize', function(e) {
            onMinusKeyPress()
        });
        titlebar.on('resize', function(e) {
            onWindowKeyPress();
        });


        //Panel
        slideout.on('beforeclose', function() {
            $('.slideout-panel').animate({
                opacity: 1
            }, 300 );
        });
        slideout.on('beforeopen', function() {
            $('.slideout-panel').animate({
                opacity: 0.4
            }, 300 );
        });

		uiContainer = document.querySelector( '.ui' );

        // UI element for menu toggle
        menuElement = document.querySelector( '.menu-toggle');
        menuElement.onclick = onMenuClick;

		// UI element for color flip
		colorLayoutElement = document.querySelector( '.color-flip' );
		colorLayoutElement.onclick = onColorLayoutClick;

		// UI element for full screen
		screenSizeElement = document.querySelector( '.fullscreen' );
		screenSizeElement.onclick = onScreenSizeClick;

        if(mainWindow.isFullScreen()) {
		    screenSizeElement.innerHTML = shrinkScreenIcon;
        }
        else {
            screenSizeElement.innerHTML = expandScreenIcon;
        }

        // UI element for printing
        printElement = document.querySelector( '.print');
        printElement.onclick = onPrintClick;

        wordsCount = document.querySelector( '.words-count');
        charactersCount = document.querySelector( '.characters-count');

		article = document.querySelector( '.content' );
		article.onkeyup = onArticleKeyUp;

		header = document.querySelector( '.header' );
		header.onkeypress = onHeaderKeyPress;

        //For links opening in another browser
        $('body').on('dblclick', 'a[href]', function(event) {
          event.preventDefault();
          shell.openExternal(this.href);
        });

        wordsCount.innerHTML =
            Global.editor.getWordCount().toString().concat(Global.editor.getWordCount()==1?" word":" words");
        charactersCount.innerHTML =
            Global.editor.getCharacterCount().toString().concat(Global.editor.getCharacterCount()==1?" character":" characters");
	}

    function onPanelClick ( event ) {
        slideout.close();
        panel.onclick = null;
    }

    function onSectionClick ( e ) {  
        if (e.target !== this)
            return;
        var selection=document.getSelection();
        var range=document.createRange();
        var contenteditable=document.querySelector('article[contenteditable="true"]');

        if(contenteditable.lastChild.nodeType==3){
        range.setStart(contenteditable.lastChild,contenteditable.lastChild.length);
        }else{
        range.setStart(contenteditable,contenteditable.childNodes.length);
        }
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function onMenuClick ( event ) {
        Global.editor.refreshPage();
        slideout.open();
        slideout.on('open', function() {
            panel.onclick = onPanelClick;
            panel.focus();
        });
    }

	function onScreenSizeClick( event ) {

        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        if ( mainWindow.isFullScreen() ) {
			screenSizeElement.innerHTML = shrinkScreenIcon;
        } else {
            screenSizeElement.innerHTML = expandScreenIcon;
        }
	};

	function onColorLayoutClick( event ) {
		if ( document.body.classList.contains('light-mode') ) {
			document.body.className = 'dark-mode';
		} else {
			document.body.className = 'light-mode';
		}

		Global.editor.saveState();
	}

    function onPrintClick( event ) {
        window.print();
    }

	/* Allows the user to press enter to tab from the title */
	function onHeaderKeyPress( event ) {

		if ( event.keyCode === 13 || event.keyCode == 9) {
			event.preventDefault();
			article.focus();
		}
    }

    function onCrossKeyPress ( event ) {
        mainWindow.close();
    }

    function onMinusKeyPress ( event ) {
        mainWindow.minimize();
    }

    function onWindowKeyPress ( event ) {
        if(mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow.maximize();
        }
    }

	function onArticleKeyUp( event ) {

        var words = Global.editor.getWordCount();
        var characters = Global.editor.getCharacterCount();

        wordsCount.innerHTML = words.toString().concat(words==1?" word":" words");
        charactersCount.innerHTML = characters.toString().concat(characters==1?" character":" characters");
	}

	return {
		init: init
	}

})();
