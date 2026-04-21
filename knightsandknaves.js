"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
define("deck_base", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.imagesPerRow = exports.deckMap = void 0;
    exports.deckMap = {
        '0000000001': 0,
        '0000000011': 1,
        '0000000111': 2,
        '0000001111': 3,
        '0000011111': 4,
        '0000111111': 5,
        '0001111111': 6,
        '0011111111': 7,
        '0111111111': 8,
        '1111111110': 9,
        '1111111100': 10,
        '1111111000': 11,
        '1111110000': 12,
        '1111100000': 13,
        '1111000000': 14,
        '1110000000': 15,
        '1100000000': 16,
        '1000000000': 17,
    };
    exports.imagesPerRow = Object.keys(exports.deckMap).length;
});
define("bgagame/knightsandknaves", ["require", "exports", "ebg/core/gamegui", "deck_base", "ebg/counter", "ebg/stock"], function (require, exports, Gamegui, deck_base_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NUM_QUESTION_TYPES = 3;
    var NUM_QUESTIONS = 18;
    var KnightsAndKnaves = (function (_super) {
        __extends(KnightsAndKnaves, _super);
        function KnightsAndKnaves() {
            var _this = _super.call(this) || this;
            _this.setupNotifications = function () {
                console.log('notifications subscriptions setup');
                dojo.subscribe('actPlayCard', _this, "ntf_actCardPlayed");
                dojo.subscribe('actGiveAnswer', _this, "ntf_actGiveAnswer");
                dojo.subscribe('actPass', _this, "ntf_actPass");
                dojo.subscribe('guessCorrect', _this, "ntf_guessResult");
                dojo.subscribe('guessIncorrect', _this, "ntf_guessResult");
                dojo.subscribe('playerEliminated', _this, "ntf_playerEliminated");
                dojo.subscribe('newScores', _this, "ntf_newScores");
                dojo.subscribe('cardsDrawn', _this, "ntf_cardsDrawn");
                dojo.subscribe('newHand', _this, "ntf_newHand");
                dojo.subscribe('actDiscardAndRedraw', _this, "ntf_discardAndRedraw");
                dojo.subscribe('secretQuestion', _this, "ntf_secretQuestion");
            };
            _this.cardwidth = 72;
            _this.cardheight = 96;
            _this.currentState = '';
            _this.cardDataById = {};
            _this.currentQuestionCardId = null;
            _this.currentQuestionTargetId = null;
            _this.currentQuestionAskerId = null;
            _this.secretCardTargets = {};
            _this.cardAnswers = {};
            return _this;
        }
        KnightsAndKnaves.prototype.setup = function (gamedatas) {
            var _this = this;
            var _a, _b, _c;
            console.log("Starting game setup");
            for (var player_id in gamedatas.players) {
                var player = gamedatas.players[player_id];
                var playerBoardDiv = $('player_board_' + player_id);
                if (playerBoardDiv) {
                    dojo.place("<div class=\"kk_player_info\">\n\t\t\t\t\t\t<span class=\"kk_trophy_icon\">\uD83C\uDFC6</span>\n\t\t\t\t\t\t<span id=\"trophy_count_".concat(player_id, "\" class=\"kk_trophy_count\">").concat(player.trophies || 0, "</span>\n\t\t\t\t\t</div>"), playerBoardDiv);
                    if (player.eliminated == 1) {
                        dojo.addClass('overall_player_board_' + player_id, 'kk_eliminated');
                    }
                }
            }
            this.playerHand = new ebg.stock();
            this.playerHand.create(this, $('myhand'), this.cardwidth, this.cardheight);
            this.playerHand.setSelectionMode(1);
            this.playerHand.image_items_per_row = 1;
            this.playerHand.item_margin = 4;
            this.commonArea = new ebg.stock();
            this.commonArea.create(this, $('commonarea'), this.cardwidth, this.cardheight);
            this.commonArea.setSelectionMode(0);
            this.commonArea.image_items_per_row = 1;
            this.commonArea.item_margin = 4;
            this.playerTribe = new ebg.stock();
            this.playerTribe.create(this, $('myTribe'), this.cardwidth, this.cardheight);
            this.playerTribe.setSelectionMode(0);
            this.playerTribe.image_items_per_row = 1;
            this.playerTribe.item_margin = 4;
            this.playerNumber = new ebg.stock();
            this.playerNumber.create(this, $('myNumber'), this.cardwidth, this.cardheight);
            this.playerNumber.setSelectionMode(0);
            this.playerNumber.image_items_per_row = 1;
            this.playerNumber.item_margin = 4;
            var cardImg = g_gamethemeurl + 'img/card.png';
            this.playerHand.addItemType(0, 0, cardImg, 0);
            this.commonArea.addItemType(0, 0, cardImg, 0);
            this.playerTribe.addItemType(0, 0, cardImg, 0);
            this.playerNumber.addItemType(0, 0, cardImg, 0);
            var questions = gamedatas.questions;
            var extractCardId = function (divId) { var _a; return (_a = divId.split('_item_')[1]) !== null && _a !== void 0 ? _a : divId; };
            var typeClassMap = { 1: 'kk_card_ask_one', 2: 'kk_card_ask_all', 3: 'kk_card_ask_secret' };
            var typeIconMap = { 1: '👤', 2: '👥', 3: '🤫' };
            this.playerHand.onItemCreate = function (cardDiv, _type, divId) {
                var _a, _b, _c, _d;
                var cardId = extractCardId(divId);
                var data = _this.cardDataById[cardId];
                var cardType = data ? parseInt(data.type) : 1;
                var text = data ? ((_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '') : '';
                cardDiv.style.removeProperty('left');
                dojo.addClass(cardDiv, (_c = typeClassMap[cardType]) !== null && _c !== void 0 ? _c : 'kk_card_ask_one');
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_type_icon\">".concat((_d = typeIconMap[cardType]) !== null && _d !== void 0 ? _d : '👤', "</div>") +
                    "<div class=\"kk_card_content\">".concat(text, "</div>"));
            };
            this.commonArea.onItemCreate = function (cardDiv, _type, divId) {
                var _a, _b, _c, _d;
                var cardId = extractCardId(divId);
                var data = _this.cardDataById[cardId];
                var cardType = data ? parseInt(data.type) : 1;
                var text = data ? ((_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '') : '';
                cardDiv.style.removeProperty('left');
                dojo.addClass(cardDiv, (_c = typeClassMap[cardType]) !== null && _c !== void 0 ? _c : 'kk_card_ask_one');
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_type_icon\">".concat((_d = typeIconMap[cardType]) !== null && _d !== void 0 ? _d : '👤', "</div>") +
                    "<div class=\"kk_card_content\">".concat(text, "</div>"));
            };
            this.playerTribe.onItemCreate = function (cardDiv, _type, divId) {
                var _a;
                var data = _this.cardDataById[extractCardId(divId)];
                var tribe = (_a = data === null || data === void 0 ? void 0 : data.type) !== null && _a !== void 0 ? _a : '';
                var isKnight = tribe === 'knight';
                dojo.addClass(cardDiv, isKnight ? 'kk_card_knight' : 'kk_card_knave');
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_content kk_identity_content\">".concat(isKnight ? '⚔️ Knight' : '🎭 Knave', "</div>"));
            };
            this.playerNumber.onItemCreate = function (cardDiv, _type, divId) {
                var _a;
                var data = _this.cardDataById[extractCardId(divId)];
                var num = (_a = data === null || data === void 0 ? void 0 : data.type_arg) !== null && _a !== void 0 ? _a : '';
                dojo.addClass(cardDiv, 'kk_card_number');
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_content kk_number_content\">".concat(num, "</div>"));
            };
            this.secretCardTargets = (_a = gamedatas.secretCardTargets) !== null && _a !== void 0 ? _a : {};
            var lastPlayedCard = gamedatas.lastPlayedCard;
            if (lastPlayedCard) {
                this.currentQuestionCardId = String(lastPlayedCard);
                this.currentQuestionTargetId = String(gamedatas.lastPlayedTarget || '');
                var playedCardData = (_b = gamedatas.commonarea) === null || _b === void 0 ? void 0 : _b[lastPlayedCard];
                if (playedCardData) {
                    this.currentQuestionAskerId = String(playedCardData.location_arg);
                }
            }
            for (var i in this.gamedatas['hand']) {
                var card = this.gamedatas['hand'][i];
                this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
                this.playerHand.addToStockWithId(0, card.id);
            }
            for (var i in this.gamedatas['commonarea']) {
                var card = this.gamedatas['commonarea'][i];
                this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
                this.commonArea.addToStockWithId(0, card.id);
                if (parseInt(card.type) === 3) {
                    var askerPlayerId = String(card.location_arg);
                    var targetPlayerId = String((_c = this.secretCardTargets[card.id]) !== null && _c !== void 0 ? _c : '');
                    var isParticipant = askerPlayerId === String(this.player_id) || targetPlayerId === String(this.player_id);
                    if (!isParticipant) {
                        var el = $('commonarea_item_' + card.id);
                        if (el)
                            dojo.addClass(el, 'kk_secret_hidden');
                    }
                }
            }
            for (var i in this.gamedatas['idtribe']) {
                var card = this.gamedatas['idtribe'][i];
                this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
                this.playerTribe.addToStockWithId(0, card.id);
            }
            for (var i in this.gamedatas['idnumber']) {
                var card = this.gamedatas['idnumber'][i];
                this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
                this.playerNumber.addToStockWithId(0, card.id);
            }
            if (this.gamedatas['answers']) {
                for (var _i = 0, _d = this.gamedatas['answers']; _i < _d.length; _i++) {
                    var ans = _d[_i];
                    this.displayAnswerChip(ans.card_id, ans.player_id, ans.answer);
                }
            }
            dojo.place("\n\t\t\t<div id=\"kk_card_preview_overlay\" class=\"kk_overlay kk_overlay_clickable\" style=\"display:none\">\n\t\t\t\t<div id=\"kk_card_preview\" class=\"kk_card_preview\">\n\t\t\t\t\t<div class=\"kk_card_preview_inner\">\n\t\t\t\t\t\t<div id=\"kk_preview_card\" class=\"kk_preview_card\"></div>\n\t\t\t\t\t\t<div id=\"kk_preview_hint\" class=\"kk_preview_hint\"></div>\n\t\t\t\t\t\t<div id=\"kk_preview_actions_title\" class=\"kk_preview_actions_title\"></div>\n\t\t\t\t\t\t<div id=\"kk_preview_actions\" class=\"kk_preview_actions\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t", document.body);
            dojo.connect($('kk_card_preview_overlay'), 'onclick', function (e) {
                if (e.target.id === 'kk_card_preview_overlay') {
                    _this.playCardCancel(e);
                }
            });
            dojo.connect(this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged');
            this.setupNotifications();
            console.log("Ending game setup");
        };
        KnightsAndKnaves.prototype.onEnteringState = function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var stateName = _a[0], state = _a[1];
            console.log('Entering state: ' + stateName);
            this.currentState = stateName;
            switch (stateName) {
                case 'playerTurnAsk':
                    this.hideCurrentQuestion();
                    break;
                case 'targetResponse':
                    if (!this.currentQuestionCardId) {
                        var lastCard = this.gamedatas.lastPlayedCard;
                        if (lastCard) {
                            this.currentQuestionCardId = String(lastCard);
                            this.currentQuestionTargetId = String(this.gamedatas.lastPlayedTarget || '');
                        }
                    }
                    this.updateCurrentQuestionDisplay();
                    break;
                case 'playerTurnGuess':
                    this.hideCurrentQuestion();
                    break;
            }
        };
        KnightsAndKnaves.prototype.onLeavingState = function (stateName) {
            console.log('Leaving state: ' + stateName);
            if (stateName === 'targetResponse') {
                this.hideCurrentQuestion();
            }
        };
        KnightsAndKnaves.prototype.onUpdateActionButtons = function () {
            var _a = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _a[_i] = arguments[_i];
            }
            var stateName = _a[0], args = _a[1];
            console.log('onUpdateActionButtons: ' + stateName, args);
            if (!this.isCurrentPlayerActive())
                return;
            switch (stateName) {
                case 'playerTurnAsk':
                    this.addActionButton('discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray');
                    break;
                case 'targetResponse':
                    this.removeActionButtons();
                    this.promptResponse();
                    break;
                case 'playerTurnGuess':
                    this.removeActionButtons();
                    this.promptGuessOrPass();
                    break;
            }
        };
        KnightsAndKnaves.prototype.changeMainBar = function (message) {
            $("generalactions").innerHTML = "";
            $("pagemaintitletext").innerHTML = message;
        };
        KnightsAndKnaves.prototype.getCardSpritePos = function (cardType, qIndex) {
            return (cardType - 1) * deck_base_1.imagesPerRow + qIndex;
        };
        KnightsAndKnaves.prototype.getCurrentQuestionDetails = function () {
            var _a, _b;
            var cardId = this.currentQuestionCardId;
            if (!cardId)
                return null;
            var data = this.cardDataById[cardId];
            if (!data)
                return null;
            var questions = this.gamedatas.questions;
            var text = (_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '';
            if (!text)
                return null;
            return {
                cardId: cardId,
                cardType: parseInt(data.type),
                text: text
            };
        };
        KnightsAndKnaves.prototype.showQuestionStatusForAsker = function () {
            var _a;
            var details = this.getCurrentQuestionDetails();
            if (!details || this.currentQuestionAskerId !== String(this.player_id))
                return;
            if (details.cardType === 2) {
                this.changeMainBar("You asked everyone: ".concat(details.text));
                return;
            }
            var target = this.currentQuestionTargetId
                ? this.gamedatas.players[this.currentQuestionTargetId]
                : null;
            var targetName = (_a = target === null || target === void 0 ? void 0 : target.name) !== null && _a !== void 0 ? _a : _('another player');
            if (details.cardType === 3) {
                this.changeMainBar("You asked ".concat(targetName, " in secret: ").concat(details.text));
                return;
            }
            this.changeMainBar("You asked ".concat(targetName, ": ").concat(details.text));
        };
        KnightsAndKnaves.prototype.showQuestionStatusForResponder = function () {
            var details = this.getCurrentQuestionDetails();
            if (!details || !this.isCurrentPlayerActive())
                return;
            this.changeMainBar("Answer the question: ".concat(details.text));
        };
        KnightsAndKnaves.prototype.updateCurrentQuestionDisplay = function () {
            if (this.currentState !== 'targetResponse')
                return;
            if (this.currentQuestionAskerId === String(this.player_id)) {
                this.showQuestionStatusForAsker();
                return;
            }
            if (this.isCurrentPlayerActive()) {
                this.showQuestionStatusForResponder();
            }
        };
        KnightsAndKnaves.prototype.hideCurrentQuestion = function () { };
        KnightsAndKnaves.prototype.showCardPreview = function (cardId) {
            var _a, _b, _c, _d, _e;
            var overlay = $('kk_card_preview_overlay');
            if (!overlay)
                return;
            var data = this.cardDataById[cardId];
            if (!data)
                return;
            var questions = this.gamedatas.questions;
            var text = (_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '';
            var cardType = parseInt(data.type);
            var typeIcons = { 1: '👤', 2: '👥', 3: '🤫' };
            var typeNames = { 1: 'Ask one player', 2: 'Ask all players', 3: 'Ask in secret' };
            var typeClassMap = { 1: 'kk_card_ask_one', 2: 'kk_card_ask_all', 3: 'kk_card_ask_secret' };
            var icon = (_c = typeIcons[cardType]) !== null && _c !== void 0 ? _c : '👤';
            var cardEl = $('kk_preview_card');
            if (cardEl) {
                cardEl.className = "kk_preview_card ".concat((_d = typeClassMap[cardType]) !== null && _d !== void 0 ? _d : 'kk_card_ask_one');
                cardEl.innerHTML =
                    "<div class=\"kk_card_type_icon kk_preview_card_icon\">".concat(icon, "</div>") +
                        "<div class=\"kk_card_content kk_preview_card_text\">".concat(text, "</div>");
            }
            var hintEl = $('kk_preview_hint');
            var typeName = (_e = typeNames[cardType]) !== null && _e !== void 0 ? _e : '';
            if (hintEl)
                hintEl.innerHTML =
                    "<strong>".concat(icon, " ").concat(typeName, "</strong><br>") +
                        ((cardType === 1 || cardType === 3) ? _('Select a player to ask') : _('This will ask all players'));
            overlay.style.display = 'flex';
        };
        KnightsAndKnaves.prototype.hideCardPreview = function () {
            var overlay = $('kk_card_preview_overlay');
            if (overlay)
                overlay.style.display = 'none';
            this.clearCardPreviewActions();
        };
        KnightsAndKnaves.prototype.clearCardPreviewActions = function () {
            var titleEl = $('kk_preview_actions_title');
            var actionsEl = $('kk_preview_actions');
            if (titleEl)
                titleEl.innerHTML = '';
            if (actionsEl)
                actionsEl.innerHTML = '';
        };
        KnightsAndKnaves.prototype.getAskTargets = function () {
            var _this = this;
            return Object.entries(this.gamedatas.players)
                .filter(function (_a) {
                var pid = _a[0], player = _a[1];
                return pid !== String(_this.player_id) && player.eliminated != 1;
            })
                .map(function (_a) {
                var pid = _a[0], player = _a[1];
                return ({ id: pid, name: player.name });
            });
        };
        KnightsAndKnaves.prototype.addPreviewActionButton = function (container, label, handler, colorClass) {
            if (colorClass === void 0) { colorClass = 'blue'; }
            var button = dojo.create('a', {
                className: "bgabutton bgabutton_".concat(colorClass, " kk_preview_action_button"),
                href: '#',
                innerHTML: label
            }, container);
            dojo.connect(button, 'onclick', function (evt) {
                dojo.stopEvent(evt);
                handler();
            });
        };
        KnightsAndKnaves.prototype.renderCardPreviewActions = function (cardId) {
            var _this = this;
            var _a, _b;
            var titleEl = $('kk_preview_actions_title');
            var actionsEl = $('kk_preview_actions');
            if (!titleEl || !actionsEl)
                return;
            this.clearCardPreviewActions();
            var cardType = parseInt((_b = (_a = this.cardDataById[cardId]) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : '1');
            if (cardType === 1 || cardType === 3) {
                titleEl.innerHTML = _('Select a player to ask');
                var _loop_1 = function (target) {
                    this_1.addPreviewActionButton(actionsEl, target.name, function () { return _this.playCardWithTarget(cardId, parseInt(target.id)); });
                };
                var this_1 = this;
                for (var _i = 0, _c = this.getAskTargets(); _i < _c.length; _i++) {
                    var target = _c[_i];
                    _loop_1(target);
                }
            }
            else {
                titleEl.innerHTML = _('Ask everyone this question?');
                this.addPreviewActionButton(actionsEl, _('Ask all'), function () { return _this.playCardWithTarget(cardId, 0); });
            }
            this.addPreviewActionButton(actionsEl, _('Cancel'), function () { return _this.playCardCancel(); }, 'gray');
        };
        KnightsAndKnaves.prototype.showAskActions = function (cardId) {
            var _this = this;
            var _a, _b;
            var cardType = parseInt((_b = (_a = this.cardDataById[cardId]) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : '1');
            this.removeActionButtons();
            this.renderCardPreviewActions(cardId);
            if (cardType === 1 || cardType === 3) {
                this.changeMainBar(_("Select a player to ask:"));
                var _loop_2 = function (target) {
                    this_2.addActionButton("target_button_".concat(target.id), _(target.name), function () { return _this.playCardWithTarget(cardId, parseInt(target.id)); });
                };
                var this_2 = this;
                for (var _i = 0, _c = this.getAskTargets(); _i < _c.length; _i++) {
                    var target = _c[_i];
                    _loop_2(target);
                }
                this.addActionButton('cancel_button', _('Cancel'), 'playCardCancel', undefined, false, 'gray');
            }
            else {
                this.changeMainBar(_("Ask everyone this question?"));
                this.addActionButton('playCard_button', _('Ask all'), function () { return _this.playCardWithTarget(cardId, 0); });
                this.addActionButton('cancel_button', _('Cancel'), 'playCardCancel', undefined, false, 'gray');
            }
        };
        KnightsAndKnaves.prototype.displayAnswerChip = function (cardId, playerId, answer) {
            var _this = this;
            var cardDiv = $('commonarea_item_' + cardId);
            if (!cardDiv)
                return;
            var playerInfo = this.gamedatas.players[playerId];
            if (!playerInfo)
                return;
            var color = '#' + playerInfo.color;
            var key = String(cardId);
            if (!this.cardAnswers[key])
                this.cardAnswers[key] = [];
            if (this.cardAnswers[key].some(function (a) { return a.playerId === String(playerId); }))
                return;
            this.cardAnswers[key].push({ playerId: String(playerId), answer: answer, color: color });
            var oldContainer = cardDiv.querySelector('.kk_chips_container');
            if (oldContainer)
                oldContainer.remove();
            var sorted = __spreadArray([], this.cardAnswers[key], true).sort(function (a, b) {
                if (a.answer !== b.answer)
                    return a.answer === 'yes' ? -1 : 1;
                return a.color.localeCompare(b.color);
            });
            var chipHtml = function (a) {
                var _a;
                var p = _this.gamedatas.players[a.playerId];
                var initial = p ? p.name.charAt(0).toUpperCase() : '?';
                var label = a.answer === 'yes' ? 'Y' : 'N';
                var cls = a.answer === 'yes' ? 'kk_chip_yes' : 'kk_chip_no';
                return "<div class=\"kk_answer_chip ".concat(cls, "\" title=\"").concat((_a = p === null || p === void 0 ? void 0 : p.name) !== null && _a !== void 0 ? _a : '', ": ").concat(a.answer, "\" style=\"background:").concat(a.color, "\"><span class=\"kk_chip_initial\">").concat(initial, "</span><span class=\"kk_chip_label\">").concat(label, "</span></div>");
            };
            cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_chips_container\">".concat(sorted.map(chipHtml).join(''), "</div>"));
        };
        KnightsAndKnaves.prototype.onPlayerHandSelectionChanged = function (evt) {
            if (this.currentState !== 'playerTurnAsk' || !this.isCurrentPlayerActive()) {
                return;
            }
            var selection = this.playerHand.getSelectedItems();
            if (selection.length === 0) {
                this.hideCardPreview();
                this.removeActionButtons();
                this.addActionButton('discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray');
                return;
            }
            var item = selection[0];
            this.showCardPreview(item.id);
            this.showAskActions(String(item.id));
        };
        KnightsAndKnaves.prototype.playCardWithTarget = function (cardId, targetId) {
            var numericCardId = parseInt(String(cardId));
            this.currentQuestionCardId = String(numericCardId);
            this.currentQuestionTargetId = String(targetId);
            this.currentQuestionAskerId = String(this.player_id);
            this.hideCardPreview();
            this.removeActionButtons();
            this.showQuestionStatusForAsker();
            this.bgaPerformAction('actPlayCard', { card_id: numericCardId, target_id: targetId });
            this.playerHand.removeFromStockById(numericCardId);
        };
        KnightsAndKnaves.prototype.playCardCancel = function (evt) {
            this.playerHand.unselectAll();
            this.hideCardPreview();
            this.removeActionButtons();
            this.addActionButton('discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.onDiscardAndRedraw = function (evt) {
            this.bgaPerformAction('actDiscardAndRedraw', {});
        };
        KnightsAndKnaves.prototype.promptResponse = function () {
            var _this = this;
            var _a;
            var questions = this.gamedatas.questions;
            var idtribe = this.gamedatas['idtribe'];
            var idnumber = this.gamedatas['idnumber'];
            var tribeCard = Object.values(idtribe !== null && idtribe !== void 0 ? idtribe : {})[0];
            var numberCard = Object.values(idnumber !== null && idnumber !== void 0 ? idnumber : {})[0];
            var expectedAnswer = null;
            if (tribeCard && numberCard && this.currentQuestionCardId) {
                var cardData = this.cardDataById[this.currentQuestionCardId];
                if (cardData) {
                    var typeArg = parseInt(cardData.type_arg);
                    var question = questions[typeArg];
                    if (question === null || question === void 0 ? void 0 : question.code) {
                        var number = parseInt(numberCard.type_arg);
                        var tribe_1 = tribeCard.type;
                        var truthIsYes = question.code[10 - number] === '1';
                        expectedAnswer = (tribe_1 === 'knight') ? (truthIsYes ? 'yes' : 'no') : (truthIsYes ? 'no' : 'yes');
                    }
                }
            }
            var tribe = (_a = tribeCard === null || tribeCard === void 0 ? void 0 : tribeCard.type) !== null && _a !== void 0 ? _a : 'knight';
            var wrongHandler = function () {
                _this.showMessage(_("That's not correct! As a ".concat(tribe, ", you must answer ").concat(expectedAnswer, ".")), 'error');
            };
            this.showQuestionStatusForResponder();
            if (expectedAnswer === 'yes') {
                this.addActionButton('yes_button', _('Yes ✓'), 'yesResponse');
                this.addActionButton('no_button', _('No'), wrongHandler, undefined, false, 'red');
            }
            else if (expectedAnswer === 'no') {
                this.addActionButton('yes_button', _('Yes'), wrongHandler, undefined, false, 'red');
                this.addActionButton('no_button', _('No ✓'), 'noResponse');
            }
            else {
                this.addActionButton('yes_button', _('Yes'), 'yesResponse');
                this.addActionButton('no_button', _('No'), 'noResponse');
            }
        };
        KnightsAndKnaves.prototype.yesResponse = function (evt) {
            this.bgaPerformAction('actGiveAnswer', { response: 'yes' });
        };
        KnightsAndKnaves.prototype.noResponse = function (evt) {
            this.bgaPerformAction('actGiveAnswer', { response: 'no' });
        };
        KnightsAndKnaves.prototype.promptGuessOrPass = function () {
            this.addActionButton('guess_button', _('Guess'), 'playGuessTarget');
            this.addActionButton('pass_button', _('Pass'), 'playerPass', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.playGuessTarget = function (evt) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar(_("Whose identity do you want to guess?"));
            var _loop_3 = function (player_id) {
                if (player_id == String(this_3.player_id))
                    return "continue";
                var playerInfo = this_3.gamedatas.players[player_id];
                if (playerInfo.eliminated == 1)
                    return "continue";
                this_3.addActionButton("guess_button_".concat(player_id), _(playerInfo.name), function () { return _this.playGuessTribe(player_id, playerInfo.name); });
            };
            var this_3 = this;
            for (var player_id in this.gamedatas.players) {
                _loop_3(player_id);
            }
            this.addActionButton('cancel_guess', _('Cancel'), function () {
                _this.removeActionButtons();
                _this.promptGuessOrPass();
            }, undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.playGuessTribe = function (playerId, playerName) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar("Is ".concat(playerName, " a Knight or a Knave?"));
            this.addActionButton('guess_button_knight', _('Knight'), function () { return _this.playGuessNumber(playerId, playerName, 'knight'); });
            this.addActionButton('guess_button_knave', _('Knave'), function () { return _this.playGuessNumber(playerId, playerName, 'knave'); });
            this.addActionButton('cancel_guess', _('Cancel'), 'playGuessTarget', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.playGuessNumber = function (playerId, playerName, tribe) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar("What is ".concat(playerName, "'s number?"));
            var _loop_4 = function (num) {
                var numCopy = num;
                this_4.addActionButton("guess_button_".concat(num), _(numCopy.toString()), function () { return _this.finalizeGuess(playerId, playerName, tribe, numCopy); });
            };
            var this_4 = this;
            for (var num = 1; num <= 10; num++) {
                _loop_4(num);
            }
            this.addActionButton('cancel_guess', _('Cancel'), function () { return _this.playGuessTribe(playerId, playerName); }, undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.finalizeGuess = function (playerId, playerName, tribe, num) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar("Guess: ".concat(playerName, " is a ").concat(tribe, " with number ").concat(num));
            this.addActionButton('confirm_button', _('Confirm Guess'), function () { return _this.confirmGuess(playerId, tribe, num); });
            this.addActionButton('cancel_button', _('Cancel'), 'playGuessTarget', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.confirmGuess = function (playerId, tribe, num) {
            this.bgaPerformAction('actGuess', { target_id: playerId, tribe: tribe, number: num });
        };
        KnightsAndKnaves.prototype.playerPass = function (evt) {
            this.bgaPerformAction('actPass', {});
        };
        KnightsAndKnaves.prototype.ntf_actCardPlayed = function (notif) {
            console.log('ntf_actCardPlayed', notif);
            var cardId = String(notif.args.card_id);
            var cardType = parseInt(notif.args.card_type);
            var isAsker = String(notif.args.player_id) === String(this.player_id);
            if (!isAsker || cardType !== 3) {
                this.cardDataById[cardId] = { type: notif.args.card_type, type_arg: notif.args.card_type_arg };
            }
            this.currentQuestionCardId = cardId;
            this.currentQuestionTargetId = notif.args.target_id ? String(notif.args.target_id) : null;
            this.currentQuestionAskerId = String(notif.args.player_id);
            if (cardType === 3 && notif.args.target_id) {
                this.secretCardTargets[cardId] = parseInt(notif.args.target_id);
            }
            this.commonArea.addToStockWithId(0, notif.args.card_id);
            if (cardType === 3) {
                var isAsker_1 = String(notif.args.player_id) === String(this.player_id);
                var isTarget = String(notif.args.target_id) === String(this.player_id);
                if (!isAsker_1 && !isTarget) {
                    var cardEl = $('commonarea_item_' + cardId);
                    if (cardEl)
                        dojo.addClass(cardEl, 'kk_secret_hidden');
                }
            }
            this.playerHand.removeFromStockById(notif.args.card_id);
            this.hideCardPreview();
            if (this.currentState === 'targetResponse') {
                this.updateCurrentQuestionDisplay();
            }
        };
        KnightsAndKnaves.prototype.ntf_actGiveAnswer = function (notif) {
            console.log('ntf_actGiveAnswer', notif);
            this.displayAnswerChip(notif.args.card_id, notif.args.player_id, notif.args.response);
        };
        KnightsAndKnaves.prototype.ntf_actPass = function (notif) {
            console.log('ntf_actPass', notif);
        };
        KnightsAndKnaves.prototype.ntf_guessResult = function (notif) {
            console.log('ntf_guessResult', notif);
            var isCorrect = notif.type === 'guessCorrect';
            var tribe = notif.args.tribe;
            var num = notif.args.number;
            if (isCorrect) {
                this.showMessage("\uD83C\uDF89 ".concat(notif.args.player_name, " correctly guessed! ").concat(notif.args.target_name, " is a ").concat(tribe, " with number ").concat(num, " and is eliminated!"), 'info');
                if (this.gamedatas.players[notif.args.target_id]) {
                    this.gamedatas.players[notif.args.target_id].eliminated = 1;
                }
            }
            else {
                this.showMessage("\uD83D\uDE13 ".concat(notif.args.player_name, " guessed wrong! ").concat(notif.args.target_name, " is NOT a ").concat(tribe, " with number ").concat(num, ". ").concat(notif.args.player_name, " is eliminated!"), 'error');
                if (this.gamedatas.players[notif.args.player_id]) {
                    this.gamedatas.players[notif.args.player_id].eliminated = 1;
                }
            }
        };
        KnightsAndKnaves.prototype.ntf_playerEliminated = function (notif) {
            console.log('ntf_playerEliminated', notif);
            var eliminatedId = notif.args.who_quits;
            dojo.addClass('overall_player_board_' + eliminatedId, 'kk_eliminated');
            if (this.gamedatas.players[eliminatedId]) {
                this.gamedatas.players[eliminatedId].eliminated = 1;
            }
        };
        KnightsAndKnaves.prototype.ntf_newScores = function (notif) {
            var _a;
            console.log('ntf_newScores', notif);
            for (var pid in notif.args.newScores) {
                (_a = this.scoreCtrl[pid]) === null || _a === void 0 ? void 0 : _a.toValue(notif.args.newScores[pid]);
                var trophyDiv = $('trophy_count_' + pid);
                if (trophyDiv)
                    trophyDiv.innerHTML = notif.args.newScores[pid];
            }
        };
        KnightsAndKnaves.prototype.ntf_cardsDrawn = function (notif) {
            console.log('ntf_cardsDrawn', notif);
            for (var _i = 0, _a = notif.args.cards; _i < _a.length; _i++) {
                var card = _a[_i];
                this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
                this.playerHand.addToStockWithId(0, card.id);
            }
        };
        KnightsAndKnaves.prototype.ntf_newHand = function (notif) {
            console.log('ntf_newHand', notif);
            this.playerHand.removeAll();
            for (var _i = 0, _a = notif.args.cards; _i < _a.length; _i++) {
                var card = _a[_i];
                this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
                this.playerHand.addToStockWithId(0, card.id);
            }
        };
        KnightsAndKnaves.prototype.ntf_discardAndRedraw = function (notif) {
            console.log('ntf_discardAndRedraw', notif);
        };
        KnightsAndKnaves.prototype.ntf_secretQuestion = function (notif) {
            var _a, _b;
            console.log('ntf_secretQuestion', notif);
            var cardId = String(notif.args.card_id);
            var questions = this.gamedatas.questions;
            var text = (_b = (_a = questions[parseInt(notif.args.card_type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '';
            if (this.cardDataById[cardId]) {
                this.cardDataById[cardId].type_arg = String(notif.args.card_type_arg);
            }
            this.currentQuestionCardId = cardId;
            var cardEl = $('commonarea_item_' + cardId);
            if (cardEl) {
                dojo.removeClass(cardEl, 'kk_secret_hidden');
                var contentEl = cardEl.querySelector('.kk_card_content');
                if (contentEl)
                    contentEl.innerHTML = text;
            }
            this.updateCurrentQuestionDisplay();
        };
        return KnightsAndKnaves;
    }(Gamegui));
    window.bgagame = { knightsandknaves: KnightsAndKnaves };
});
function toggleScratch(cell) {
    cell.classList.toggle('scratched');
}
