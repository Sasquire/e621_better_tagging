// ==UserScript==
// @name         e621 better tags
// @version      1.0
// @description  better tags
// @author       idem
// @include      http://e621.net/post/show/*
// @include      https://e621.net/post/show/*
// @grant        GM_addStyle
// ==/UserScript==

const sideBar = document.getElementsByClassName('sidebar')[0];
const tagsText = document.getElementsByTagName('h5')[1];
const tagsHolder = tagsText.nextElementSibling;
const oldTags = document.getElementById('post_old_tags');
const submitFormTextArea = document.getElementsByName('post[tags]')[0];
const submitForm = document.getElementById('edit-form');

const tx = createElement('textarea', {id:'Better-Tagging'}, {width:'100%'}, 'input', forceResize);
const switchButton = createElement('button', {id:'switch-button', innerHTML:'switch'}, {float:'right'}, 'click', changeToNewStyle);
const questionBox = createElement('div', {id:'question-box', className:'status-notice questionBox'});
const questionText = createElement('p', {id:'question-text', innerHTML: 'placeholder text - if you don\'t see a question contact idem'}, {flex: '0 1 100%'});
let currentQuestion = 0;
let isSubmitPrompt = false;

const allTagURL = 'https://idem.neocities.org/e621/data/allTags.js';
const questionsURL = 'https://idem.neocities.org/e621/data/better_tagging_questions.js';

tagsText.appendChild(switchButton);

GM_addStyle('.h { color: #ED5D1F; }'+
			'#question-text a:link, #question-text a:visited, #question-text a:hover, #question-text a:active { text-decoration: none; color: #0A0;}'+
			'.u { text-decoration: underline; font-style: italic; font-weight: bold;}'+
            '.questionBox button { height: 18px; align-self: flex-end; }'+
            '.questionBox {'+
                'top: 0px;'+
                'margin-top: 0px;'+
                'display: flex;'+
                'flex-direction: row;'+
                'justify-content: space-between;'+
                'flex-wrap: wrap;'+
                'min-height: 100px;'+
            '}');

function changeToNewStyle(){
	replaceTagsWithTextArea();
	addSpaceListeners();
    forceResize();
	addQuestionBox();
	tagButtons.addHelpers();
}

function replaceTagsWithTextArea(){
    const tagSidebar = document.getElementById('tag-sidebar');
    const parentNode = tagSidebar.parentNode;

    tx.value = utils.sfn(oldTags.value);

    parentNode.removeChild(tagSidebar);
	parentNode.appendChild(tx);
}

function addQuestionBox(){
	if(utils.loadJS(questionsURL, 'questionScriptTag', addQuestionBox)){ return false; }
	questionBox.appendChild(questionText);
	changeQuestion(0);

    const buttonBack = createElement('button', {id:'back-button', innerHTML:'back', value:'-1'});
    const buttonCenter = createElement('button', {id:'return-button', innerHTML:'return', value:'0'});
    const buttonForward = createElement('button', {id:'next-button', innerHTML:'next', value:'1'});

    buttonBack.addEventListener('click', changeQuestion, false);
    buttonCenter.addEventListener('click', changeQuestion, false);
    buttonForward.addEventListener('click', changeQuestion, false);

    questionBox.appendChild(buttonBack);
    questionBox.appendChild(buttonCenter);
    questionBox.appendChild(buttonForward);
    sideBar.insertBefore(questionBox, tagsHolder);
}

function changeQuestion(e){
	if(isSubmitPrompt){ return; }
    const direction = typeof e === 'number' ? e : parseInt(e.path[0].value);
	let nextPos = (currentQuestion+direction) % _questions.length;
	if(nextPos < 0){ nextPos += _questions.length; }
	const requirement = _questions[nextPos].req;
	if(requirement && requirement !== '' && direction !== 0 && !utils.sn(tx.value).includes(_questions[nextPos].req)){ changeQuestion(direction+(direction<0?-1:1)); return; }
	currentQuestion = nextPos;
	questionText.innerHTML = _questions[currentQuestion].text;
}

function forceResize(){ tx.style.height = 'auto'; tx.style.height = tx.scrollHeight + 'px'; }

function addSpaceListeners(){
    tx.addEventListener('keydown', spacePressed);
    tx.addEventListener('paste', textPasted);

    function spacePressed(e){
        const keyValue = e.keyCode ? e.keyCode : e.charCode;
        if(keyValue != 32){ return; }
        insertMetachar('\n');
        forceResize();
        e.preventDefault();
        e.stopPropagation();
    }

    function textPasted(e) {
        const text = e.clipboardData.getData("text/plain");
        insertMetachar(utils.sfn(text)+'\n');
        forceResize();
        e.preventDefault();
        e.stopPropagation();
    }

    function insertMetachar(char) { // https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement
        const bDouble = arguments.length > 1;
        const nSelStart = tx.selectionStart;
        const sOldText = tx.value;
        const pos = nSelStart + char.length;
        tx.value = sOldText.substring(0, nSelStart) + char + sOldText.substring(nSelStart);
        tx.setSelectionRange(pos, pos);
        tx.focus();
    }
}

function createElement(type, options, styleOptions, eventType, eventFunction){
	let object = document.createElement(type);
    for(let curOpt in options){ object[curOpt] = options[curOpt]; }
	for(let curOpt in styleOptions){ object.style[curOpt] = styleOptions[curOpt]; }
	if(eventFunction){ object.addEventListener(eventType, eventFunction); }
	return object;
}

const tagButtons = {};
tagButtons.promptSubmit = function(){
	tagsText.innerHTML = 'Tags';
	questionText.innerHTML = 'Are you sure you want to submit?';
	isSubmitPrompt = true;
	tagsText.appendChild(createElement('button', {innerHTML:'no'}, {float:'right'}, 'click', function(){isSubmitPrompt = false; changeQuestion(0); tagButtons.addHelpers();}));
	tagsText.appendChild(createElement('button', {innerHTML:'yes'}, {float:'right'}, 'click', tagButtons.submit));
};

tagButtons.submit = function(){
	tagHelpers.sort();
	submitFormTextArea.value = utils.sn(tx.value).join(' ');
	submitForm.submit();
};

tagButtons.addHelpers = function(){
	tagsText.innerHTML = 'Tags ';
	tagsText.appendChild(createElement('button', {innerHTML:'check'}, {float:'right'}, 'click', tagHelpers.check));
	tagsText.appendChild(createElement('button', {innerHTML:'clean'}, {float:'right'}, 'click', tagHelpers.sort));
	tagsText.appendChild(createElement('button', {innerHTML:'submit'}, {}, 'click', tagButtons.promptSubmit));
};

const tagHelpers = {};
tagHelpers.sort = function(){
    tx.value = utils.mergeSort(utils.snf(tx.value)).join('\n');
	questionText.innerHTML = 'Sorted and cleaned';
	forceResize();
};

tagHelpers.check = function (){
    if(utils.loadJS(allTagURL, 'allTagsScriptTag', tagHelpers.check)){ return false; }

    const tags = utils.snf(tx.value);
    let nonTags = [];
    for(let i = 0; i < tags.length; i++){
        if(utils.binarySearch(_allTags, tags[i]) < 0){
            nonTags.push(tags[i]);
        }
    }
    questionText.innerHTML = nonTags.length === 0 ? 'These all appear to be tags!' : 'Are you sure that these are tags?</br><span class="h">' + nonTags.join('</br>') + '</span>';
};

const utils = {};
utils.s = a => a.split(' ');
utils.sn = a => a.split('\n');
utils.sf = a => a.split(' ').filter(e=>e!=='');
utils.snf = a => a.split('\n').filter(e=>e!=='');
utils.sfn = a => a.split(' ').filter(e=>e!=='').join('\n');

utils.binarySearch = function(array, dummyVar, comparator) {
    let minIndex = 0;
    let maxIndex = array.length - 1;
	let found = false;
	if(!comparator){ comparator = (a, b) => a.toString().localeCompare(b.toString()); }
    while (minIndex <= maxIndex) {
        let currentIndex = (minIndex + maxIndex) / 2 | 0;
        let currentElement = array[currentIndex];
        let compVal = comparator(dummyVar, currentElement);
        if (compVal > 0) {
            minIndex = currentIndex + 1;
        } else {
            maxIndex = currentIndex - 1;
			if(compVal === 0){ found = true; }
        }
    }
    return found ? minIndex : -(minIndex+1);
};

utils.mergeSort = function(arr, comparator){
	if(!comparator){ comparator = (a,b) => b.localeCompare(a); }
	return mergeSortRecurse(arr);

	function mergeSortRecurse(arr){
		if (arr.length < 2) { return arr; }
		let middle = parseInt(arr.length / 2);
		let left  = arr.slice(0, middle);
		let right = arr.slice(middle, arr.length);
		return merge(mergeSortRecurse(left), mergeSortRecurse(right));
	}

	function merge(left, right){
		let result = [];
		while (left.length && right.length) {
			if (comparator(left[0], right[0]) > 0) {
				result.push(left.shift());
			} else {
				result.push(right.shift());
			}
		}
		while (left.length) { result.push(left.shift()); }
		while (right.length) { result.push(right.shift()); }
		return result;
	}
};

utils.loadJS = function(url, id, callback){
    if(document.getElementById(id)){ return false; }
    var scriptTag = document.createElement('script');
    scriptTag.src = url;
    scriptTag.id = id;
    scriptTag.onload = callback;
    scriptTag.onreadystatechange = callback;
    document.head.appendChild(scriptTag);
    return true;
};