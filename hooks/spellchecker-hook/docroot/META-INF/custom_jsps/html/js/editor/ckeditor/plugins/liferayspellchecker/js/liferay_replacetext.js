AUI().add('liferay_replacetext', function(A) {

	var AArray = A.Array;

	var BLOCK_ELEMENTS = 'br address article aside audio blockquote body caption center dd details dir div dl dt fieldset figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li menu nav noframes ol p pre section table td th tr ul video'.split(' ');

	var ReplaceText = A.Component.create(
		{
			NAME: 'replaceText',

			EXTENDS: A.Base,

			_previousWords: [],

			findAndReplaceDOMText: function(regex, node, replacementNodeFn, captureGroup) {
				var instance = this;

				var returnValue = true;

				var match;
				var matches = [];

				var text = instance._getText(node);

				var replaceFn = instance._genReplacer(replacementNodeFn);

				if (typeof text !== 'undefined') {
					if (regex.global) {
						while (!!(match = regex.exec(text))) {
							var matchIndexes = instance._getMatchIndexes(match, captureGroup)

							if (matchIndexes !== false) {
								matches.push(matchIndexes);
							}
							else {
								returnValue = false;
							}
						}
					}
					else {
						match = text.match(regex);

						var matchIndexes = instance._getMatchIndexes(match, captureGroup)

						if (matchIndexes !== false) {
							matches.push(matchIndexes);
						}
						else {
							returnValue = false;
						}
					}

					if (matches.length) {
						instance._stepThroughMatches(node, matches, replaceFn);
					}
				}

				return returnValue;
			},

			revert: function() {
			    var instance = this;

			    var previousWords = instance._previousWords;

			    for (var i = 0, length = previousWords.length; i < length; i ++) {
					previousWords[i]();
				}

				instance._previousWords = [];
			},

			_fixWhiteSpace: function(node) {
			    var instance = this;

			    var nodeNameLower = node.nodeName.toLowerCase();

				if (AArray.indexOf(BLOCK_ELEMENTS, nodeNameLower) !== -1) {
					var nextSibling = node.nextSibling;

					if (!nextSibling || !((nextSibling.nodeType === 3 || nextSibling.nodeType === 4) && /^\s+$/.test(nextSibling.nodeValue))) {
						node.parentNode.insertBefore(
							document.createTextNode('\n'),
							nextSibling
						);
					}
				}
			},

			_genReplacer: function(replacementNodeFn) {
			    var instance = this;

			    instance._previousWords = [];

				var makeReplacementNode;

				if (typeof replacementNodeFn !== 'function') {
					var stencilNode = replacementNodeFn.nodeType ? replacementNodeFn : document.createElement(replacementNodeFn);

					makeReplacementNode = function(fillText) {
						var element = document.createElement('div');

						element.innerHTML = stencilNode.outerHTML || new window.XMLSerializer().serializeToString(stencilNode);

						var firstChild = element.firstChild;

						if (fillText) {
							firstChild.appendChild(
								document.createTextNode(fillText)
							);
						}

						return firstChild;
					};
				}
				else {
					makeReplacementNode = replacementNodeFn;
				}

				return function(range) {
					var textNodeEnd;
					var	textNodeStart;

					var	rangeEndNode = range.endNode;
					var	rangeMatchIndex = range.matchIndex;
					var	rangeStartNode = range.startNode;

					if (rangeStartNode === rangeEndNode) {
						var rangeNode = rangeStartNode;
						var parentRangeNode = rangeNode.parentNode;

						if (range.startNodeIndex > 0) {
							textNodeStart = document.createTextNode(
								rangeNode.data.substring(0, range.startNodeIndex)
							);

							parentRangeNode.insertBefore(textNodeStart, rangeNode);
						}

						var replacementNode = makeReplacementNode(range.match[0], rangeMatchIndex, range.match[0]);

						parentRangeNode.insertBefore(replacementNode, rangeNode);

						if (range.endNodeIndex < rangeNode.length) {
							textNodeEnd = document.createTextNode(
								rangeNode.data.substring(range.endNodeIndex)
							);

							parentRangeNode.insertBefore(textNodeEnd, rangeNode);
						}

						parentRangeNode.removeChild(rangeNode);

						instance._previousWords.push(
							function() {
								var parentNode = replacementNode.parentNode;

								parentNode.insertBefore(replacementNode.firstChild, replacementNode);
								parentNode.removeChild(replacementNode);
								parentNode.normalize();
							}
						);

						return replacementNode;
					}
					else {
						textNodeStart = document.createTextNode(
							rangeStartNode.data.substring(0, range.startNodeIndex)
						);

						textNodeEnd = document.createTextNode(
							rangeEndNode.data.substring(range.endNodeIndex)
						);

						var replacementStartNode = makeReplacementNode(
							rangeStartNode.data.substring(range.startNodeIndex),
							rangeMatchIndex, range.match[0]
						);

						var replacementInnerNodes = [];

						for (var i = 0, length = range.innerNodes.length; i < length; i ++) {
							var innerNode = range.innerNodes[i];

							var replacementInnerNode = makeReplacementNode(innerNode.data, rangeMatchIndex, range.match[0]);

							innerNode.parentNode.replaceChild(replacementInnerNode, innerNode);
							replacementInnerNodes.push(replacementInnerNode);
						}

						var replacementEndNode = makeReplacementNode(
							rangeEndNode.data.substring(0, range.endNodeIndex),
							rangeMatchIndex, range.match[0]
						);

						rangeStartNode.parentNode.insertBefore(textNodeStart, rangeStartNode);
						rangeStartNode.parentNode.insertBefore(replacementStartNode, rangeStartNode);
						rangeStartNode.parentNode.removeChild(rangeStartNode);

						rangeEndNode.parentNode.insertBefore(replacementEndNode, rangeEndNode);
						rangeEndNode.parentNode.insertBefore(textNodeEnd, rangeEndNode);
						rangeEndNode.parentNode.removeChild(rangeEndNode);

						instance._previousWords.push(
							function() {
								replacementInnerNodes.unshift(replacementStartNode);
								replacementInnerNodes.push(replacementEndNode);

								for (var i = 0, length = replacementInnerNodes.length; i < length; i ++) {
									var replacementInnerNode = replacementInnerNodes[i];
									var parentNode = replacementInnerNode.parentNode;

									parentNode.insertBefore(replacementInnerNode.firstChild, replacementInnerNode);
									parentNode.removeChild(replacementInnerNode);
									parentNode.normalize();
								}
							}
						);

						return replacementEndNode;
					}
				};
			},

			_getMatchIndexes: function(match, captureGroup) {
			    var instance = this;

			    var returnValue;

			    captureGroup = captureGroup || 0;

				if (!match[0]) {
			        A.log(
			        	Language.get('findAndReplaceDomText-cannot-handle-zero-length-matches'),
			        	'error'
			        );

			        returnValue = false;
				}
				else {
					var index = match.index;

					if (captureGroup > 0) {
						var cg = match[captureGroup];

						if (!cg) {
					        A.log(
					        	Language.get('invalid-capture-group'), 'error'
					        );

					        returnValue = false;
						}
						else {
							index += match[0].indexOf(cg);
		
							match[0] = cg;

							returnValue = [ index, index + match[0].length, [ match[0] ] ];
						}
					}
				}

				return returnValue;
			},

			_getText: function(node) {
				var instance = this;

				var returnValue;

				if (node.nodeType === 3) {
					returnValue = node.data;
				}
				else {
					var tmpNode = node;
					var text = '';

					if (!!(node = node.firstChild)) {
						do {
							text += instance._getText(node);
						}
						while (!!(node = node.nextSibling));
					}

					instance._fixWhiteSpace(tmpNode);

					returnValue = text;
				}

				return returnValue;
			},

			_stepThroughMatches: function(node, matches, replaceFn) {
			    var instance = this;

			    var atIndex = 0;
				var	curNode = node;
				var	endNode;
				var	endNodeIndex;
				var	innerNodes = [];
				var	matchLocation = matches.shift();
				var	matchIndex = 0;
				var	startNode;
				var	startNodeIndex;

				out: while (true) {
					if (curNode.nodeType === 3) {
						if (!endNode && curNode.length + atIndex >= matchLocation[1]) {
							endNode = curNode;

							endNodeIndex = matchLocation[1] - atIndex;
						}
						else if (startNode) {
							innerNodes.push(curNode);
						}

						if (!startNode && curNode.length + atIndex > matchLocation[0]) {
							startNode = curNode;

							startNodeIndex = matchLocation[0] - atIndex;
						}

						atIndex += curNode.length;
					}

					if (startNode && endNode) {
						curNode = replaceFn(
							{
								endNode: endNode,
								endNodeIndex: endNodeIndex,
								innerNodes: innerNodes,
								match: matchLocation[2],
								matchIndex: matchIndex,
								startNode: startNode,
								startNodeIndex: startNodeIndex
							}
						);

						atIndex -= (endNode.length - endNodeIndex);
						endNode = null;
						innerNodes = [];
						matchLocation = matches.shift();
						matchIndex++;
						startNode = null;

						if (!matchLocation) {
							break;
						}
					}
					else if (curNode.firstChild || curNode.nextSibling) {
						curNode = curNode.firstChild || curNode.nextSibling;
						continue;
					}

					while (true) {
						if (curNode.nextSibling) {
							curNode = curNode.nextSibling;

							break;
						}
						else if (curNode.parentNode !== node) {
							curNode = curNode.parentNode;
						}
						else {
							break out;
						}
					}
				}
			}
		}
	);

	A.ReplaceText = ReplaceText;

}, '1.0', {requires: ['aui-base']});