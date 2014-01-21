AUI().add('aui-replacetext', function(A) {

	var REPLACE_TEXT = 'replaceText';

	var AArray = A.Array;

	var blockElements = 'br address article aside audio blockquote body caption center dd details dir div dl dt fieldset figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li menu nav noframes ol p pre section table td th tr ul video'.split(' ');

	var previousWords = [];

	var ReplaceText = A.Component.create(
		{
			NAME: REPLACE_TEXT,

			EXTENDS: A.Base,

			findAndReplaceDOMText: function(regex, node, replacementNode, captureGroup) {
				var instance = this;

				var m;
				var matches = [];

				var text = instance._getText(node);

				var replaceFn = instance._genReplacer(replacementNode);

				if (typeof text === 'undefined') {
					return;
				}

				if (regex.global) {
					while (!!(m = regex.exec(text))) {
						matches.push(instance._getMatchIndexes(m, captureGroup));
					}
				}
				else {
					m = text.match(regex);

					matches.push(instance._getMatchIndexes(m, captureGroup));
				}

				if (matches.length) {
					instance._stepThroughMatches(node, matches, replaceFn);
				}
			},

			revert: function() {
				for (var i = 0, l = previousWords.length; i < l; ++i) {
					previousWords[i]();
				}

				previousWords = [];
			},

			_fixWhiteSpace: function(node) {
				var nodeNameLower = node.nodeName.toLowerCase();

				if (AArray.indexOf(blockElements, nodeNameLower) !== -1) {
					var nextSibling = node.nextSibling;

					if (!nextSibling || !((nextSibling.nodeType === 3 || nextSibling.nodeType === 4) && /^\s+$/.test(nextSibling.nodeValue))) {
						node.parentNode.insertBefore(
							document.createTextNode('\n'),
							nextSibling
						);
					}
				}
			},

			_genReplacer: function(nodeName) {
				previousWords = [];

				var makeReplacementNode;

				if (typeof nodeName !== 'function') {
					var stencilNode = nodeName.nodeType ? nodeName : document.createElement(nodeName);

					makeReplacementNode = function(fill) {
						var clone = document.createElement('div');

						clone.innerHTML = stencilNode.outerHTML || new window.XMLSerializer().serializeToString(stencilNode);

						var el = clone.firstChild;

						if (fill) {
							el.appendChild(
								document.createTextNode(fill)
							);
						}

						return el;
					};
				}
				else {
					makeReplacementNode = nodeName;
				}

				return function(range) {
					var after,
						before,
						endNode = range.endNode,
						matchIndex = range.matchIndex,
						startNode = range.startNode;

					if (startNode === endNode) {
						var node = startNode;
						var parent = node.parentNode;

						if (range.startNodeIndex > 0) {
							before = document.createTextNode(node.data.substring(0, range.startNodeIndex));

							parent.insertBefore(before, node);
						}

						var el = makeReplacementNode(range.match[0], matchIndex, range.match[0]);

						parent.insertBefore(el, node);

						if (range.endNodeIndex < node.length) {
							after = document.createTextNode(node.data.substring(range.endNodeIndex));

							parent.insertBefore(after, node);
						}

						parent.removeChild(node);

						previousWords.push(
							function() {
								var parentNode = el.parentNode;

								parentNode.insertBefore(el.firstChild, el);
								parentNode.removeChild(el);
								parentNode.normalize();
							}
						);

						return el;
					}
					else {
						before = document.createTextNode(startNode.data.substring(0, range.startNodeIndex));
						after = document.createTextNode(endNode.data.substring(range.endNodeIndex));

						var elA = makeReplacementNode(startNode.data.substring(range.startNodeIndex), matchIndex, range.match[0]);

						var innerEls = [];

						for (var i = 0, l = range.innerNodes.length; i < l; ++i) {
							var innerNode = range.innerNodes[i];

							var innerEl = makeReplacementNode(
								innerNode.data,
								matchIndex, range.match[0]
							);

							innerNode.parentNode.replaceChild(innerEl, innerNode);
							innerEls.push(innerEl);
						}

						var elB = makeReplacementNode(
							endNode.data.substring(0, range.endNodeIndex),
							matchIndex, range.match[0]
						);

						startNode.parentNode.insertBefore(before, startNode);
						startNode.parentNode.insertBefore(elA, startNode);
						startNode.parentNode.removeChild(startNode);

						endNode.parentNode.insertBefore(elB, endNode);
						endNode.parentNode.insertBefore(after, endNode);
						endNode.parentNode.removeChild(endNode);

						previousWords.push(
							function() {
								innerEls.unshift(elA);
								innerEls.push(elB);

								for (var i = 0, l = innerEls.length; i < l; ++i) {
									var el = innerEls[i];
									var pnode = el.parentNode;

									pnode.insertBefore(el.firstChild, el);
									pnode.removeChild(el);
									pnode.normalize();
								}
							}
						);

						return elB;
					}
				};
			},

			_getMatchIndexes: function(m, captureGroup) {
				captureGroup = captureGroup || 0;

				if (!m[0]) {
					throw 'findAndReplaceDOMText cannot handle zero-length matches';
				}

				var index = m.index;

				if (captureGroup > 0) {
					var cg = m[captureGroup];

					if (!cg) {
						throw 'Invalid capture group';
					}

					index += m[0].indexOf(cg);

					m[0] = cg;
				}

				return [ index, index + m[0].length, [ m[0] ] ];
			},

			_getText: function(node) {
				var instance = this;

				if (node.nodeType === 3) {
					return node.data;
				}

				var tmpNode = node;
				var txt = '';

				if (!!(node = node.firstChild)) {
					do {
						txt += instance._getText(node);
					}
					while (!!(node = node.nextSibling));
				}

				instance._fixWhiteSpace(tmpNode);

				return txt;
			},

			_stepThroughMatches: function(node, matches, replaceFn) {
				var atIndex = 0,
					curNode = node,
					endNode,
					endNodeIndex,
					innerNodes = [],
					matchLocation = matches.shift(),
					matchIndex = 0,
					startNode,
					startNodeIndex;

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