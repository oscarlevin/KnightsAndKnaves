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
                dojo.subscribe('guessesRevealed', _this, "ntf_guessesRevealed");
                dojo.subscribe('newScores', _this, "ntf_newScores");
                dojo.subscribe('cardsDrawn', _this, "ntf_cardsDrawn");
                dojo.subscribe('newHand', _this, "ntf_newHand");
                dojo.subscribe('actDiscardAndRedraw', _this, "ntf_discardAndRedraw");
                dojo.subscribe('secretQuestion', _this, "ntf_secretQuestion");
            };
            _this.cardwidth = 72;
            _this.cardheight = 96;
            _this.handCardWidth = 82;
            _this.handCardHeight = 109;
            _this.currentState = '';
            _this.cardDataById = {};
            _this.currentQuestionCardId = null;
            _this.currentQuestionTargetId = null;
            _this.currentQuestionAskerId = null;
            _this.secretCardTargets = {};
            _this.cardAnswers = {};
            _this.playedQuestionAskers = {};
            _this.previewSource = null;
            _this.previewMode = null;
            _this.joinGuessArgs = null;
            _this.pendingGuess = null;
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
                    dojo.place("<div class=\"kk_player_info\">\n\t\t\t\t\t\t<span class=\"kk_trophy_icon\">\uD83C\uDFC6</span>\n\t\t\t\t\t\t<span id=\"trophy_count_".concat(player_id, "\" class=\"kk_trophy_count\">").concat(player.trophies || 0, "</span>\n\t\t\t\t\t\t<span class=\"kk_wrong_icon\">\u274C</span>\n\t\t\t\t\t\t<span id=\"wrong_count_").concat(player_id, "\" class=\"kk_wrong_count\">").concat(player.wrongGuesses || 0, "</span>\n\t\t\t\t\t</div>"), playerBoardDiv);
                    dojo.place(this.renderPlayerNotesPanel(), playerBoardDiv);
                }
            }
            this.playerHand = new ebg.stock();
            this.playerHand.create(this, $('myhand'), this.handCardWidth, this.handCardHeight);
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
            var typeIconMap = { 1: '', 2: '👥', 3: '🔇' };
            var typeNameMap = { 1: 'Ask one player', 2: 'Ask all players', 3: 'Ask in secret' };
            this.playerHand.onItemCreate = function (cardDiv, _type, divId) {
                var _a, _b, _c, _d, _e, _f;
                var cardId = extractCardId(divId);
                var data = _this.cardDataById[cardId];
                var cardType = data ? parseInt(data.type) : 1;
                var text = data ? ((_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '') : '';
                cardDiv.style.removeProperty('left');
                dojo.addClass(cardDiv, (_c = typeClassMap[cardType]) !== null && _c !== void 0 ? _c : 'kk_card_ask_one');
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_type_icon\" title=\"".concat((_d = typeNameMap[cardType]) !== null && _d !== void 0 ? _d : 'Ask one player', "\" aria-label=\"").concat((_e = typeNameMap[cardType]) !== null && _e !== void 0 ? _e : 'Ask one player', "\">").concat((_f = typeIconMap[cardType]) !== null && _f !== void 0 ? _f : '👤', "</div>") +
                    "<div class=\"kk_card_content\">".concat(text, "</div>"));
                _this.fitCardTextDeferred(cardDiv.querySelector('.kk_card_content'));
            };
            this.commonArea.onItemCreate = function (cardDiv, _type, divId) {
                var _a, _b, _c, _d, _e, _f;
                var cardId = extractCardId(divId);
                var data = _this.cardDataById[cardId];
                var cardType = data ? parseInt(data.type) : 1;
                var text = data ? ((_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '') : '';
                cardDiv.style.removeProperty('left');
                dojo.addClass(cardDiv, (_c = typeClassMap[cardType]) !== null && _c !== void 0 ? _c : 'kk_card_ask_one');
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_type_icon\" title=\"".concat((_d = typeNameMap[cardType]) !== null && _d !== void 0 ? _d : 'Ask one player', "\" aria-label=\"").concat((_e = typeNameMap[cardType]) !== null && _e !== void 0 ? _e : 'Ask one player', "\">").concat((_f = typeIconMap[cardType]) !== null && _f !== void 0 ? _f : '👤', "</div>") +
                    "<div class=\"kk_card_content\">".concat(text, "</div>"));
                _this.fitCardTextDeferred(cardDiv.querySelector('.kk_card_content'));
                dojo.connect(cardDiv, 'onclick', function (evt) {
                    dojo.stopEvent(evt);
                    _this.openQuestionCardPopup(cardId, 'commonarea');
                });
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
                this.playedQuestionAskers[card.id] = String(card.location_arg);
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
            var revealedIdentities = gamedatas.revealedIdentities;
            for (var player_id in revealedIdentities) {
                var identity = revealedIdentities[player_id];
                this.renderRevealedIdentity(player_id, identity.tribe, identity.number);
            }
            if (this.gamedatas['answers']) {
                for (var _i = 0, _d = this.gamedatas['answers']; _i < _d.length; _i++) {
                    var ans = _d[_i];
                    this.displayAnswerChip(ans.card_id, ans.player_id, ans.answer);
                }
            }
            var pendingGuess = gamedatas.pendingGuess;
            if (pendingGuess) {
                this.pendingGuess = { tribe: pendingGuess.tribe, number: parseInt(pendingGuess.number) };
            }
            dojo.place("\n\t\t\t<div id=\"kk_card_preview_overlay\" class=\"kk_overlay kk_overlay_clickable\" style=\"display:none\">\n\t\t\t\t<div id=\"kk_card_preview\" class=\"kk_card_preview\">\n\t\t\t\t\t<div class=\"kk_card_preview_inner\">\n\t\t\t\t\t\t<div id=\"kk_preview_card\" class=\"kk_preview_card\"></div>\n\t\t\t\t\t\t<div id=\"kk_preview_hint\" class=\"kk_preview_hint\"></div>\n\t\t\t\t\t\t<div id=\"kk_preview_actions_title\" class=\"kk_preview_actions_title\"></div>\n\t\t\t\t\t\t<div id=\"kk_preview_actions\" class=\"kk_preview_actions\"></div>\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t", document.body);
            dojo.connect($('kk_card_preview_overlay'), 'onclick', function (e) {
                if (e.target.id === 'kk_card_preview_overlay') {
                    _this.dismissCardPreview();
                }
            });
            dojo.place("\n\t\t\t<div id=\"kk_guess_results_overlay\" class=\"kk_overlay kk_overlay_clickable\" style=\"display:none\">\n\t\t\t\t<div id=\"kk_guess_results\" class=\"kk_card_preview kk_guess_results\"></div>\n\t\t\t</div>\n\t\t", document.body);
            dojo.connect($('kk_guess_results_overlay'), 'onclick', function (e) {
                if (e.target.id === 'kk_guess_results_overlay') {
                    _this.hideGuessResults();
                }
            });
            dojo.connect(this.playerHand, 'onChangeSelection', this, 'onPlayerHandSelectionChanged');
            requestAnimationFrame(function () { return requestAnimationFrame(function () {
                document.querySelectorAll('#myhand .kk_card_content, #commonarea .kk_card_content').forEach(function (el) {
                    _this.fitCardText(el);
                });
            }); });
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
            if (stateName === 'targetResponse') {
                this.showQuestionBanner();
            }
            if (stateName === 'joinGuess') {
                this.joinGuessArgs = args;
                this.showJoinGuessStatus();
            }
            if (!this.isCurrentPlayerActive())
                return;
            switch (stateName) {
                case 'playerTurnAsk':
                    this.removeActionButtons();
                    this.promptAskOptions();
                    break;
                case 'targetResponse':
                    this.removeActionButtons();
                    this.promptResponse();
                    break;
                case 'playerTurnGuess':
                    this.removeActionButtons();
                    this.promptGuessOrEndTurn();
                    break;
                case 'joinGuess':
                    this.removeActionButtons();
                    this.promptJoinGuess();
                    break;
            }
        };
        KnightsAndKnaves.prototype.renderPlayerNotesPanel = function () {
            var renderScratchRow = function (label) {
                var cells = Array.from({ length: 10 }, function (_, index) {
                    return "<td onclick=\"toggleScratch(this)\">".concat(index + 1, "</td>");
                }).join('');
                return "<tr><th>".concat(label, "</th>").concat(cells, "</tr>");
            };
            return "\n\t\t\t<details class=\"kk_player_notes\">\n\t\t\t\t<summary class=\"kk_player_notes_summary\">Notes</summary>\n\t\t\t\t<div class=\"kk_player_notes_body\">\n\t\t\t\t\t<table class=\"number-table kk_player_notes_table\">\n\t\t\t\t\t\t".concat(renderScratchRow('knight'), "\n\t\t\t\t\t\t").concat(renderScratchRow('knave'), "\n\t\t\t\t\t</table>\n\t\t\t\t</div>\n\t\t\t</details>\n\t\t");
        };
        KnightsAndKnaves.prototype.changeMainBar = function (message) {
            $("pagemaintitletext").innerHTML = message;
        };
        KnightsAndKnaves.prototype.fitCardText = function (el) {
            var _a;
            if (!el)
                return;
            var baseFontSize = parseFloat((_a = el.dataset['baseFontSize']) !== null && _a !== void 0 ? _a : '');
            if (!baseFontSize) {
                baseFontSize = parseFloat(getComputedStyle(el).fontSize);
                el.dataset['baseFontSize'] = String(baseFontSize);
            }
            var minFontSize = 6;
            var fontSize = baseFontSize;
            el.style.fontSize = fontSize + 'px';
            while (fontSize > minFontSize && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
                fontSize -= 0.5;
                el.style.fontSize = fontSize + 'px';
            }
        };
        KnightsAndKnaves.prototype.fitCardTextDeferred = function (el) {
            var _this = this;
            if (!el)
                return;
            requestAnimationFrame(function () { return requestAnimationFrame(function () { return _this.fitCardText(el); }); });
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
            var details = this.getCurrentQuestionDetails();
            if (!details || this.currentQuestionAskerId !== String(this.player_id))
                return;
            if (details.cardType === 2) {
                this.changeMainBar("You asked everyone: ".concat(details.text));
                return;
            }
            var targetName = this.coloredPlayerName(this.currentQuestionTargetId);
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
            var askerName = this.coloredPlayerName(this.currentQuestionAskerId);
            if (details.cardType === 2) {
                this.changeMainBar("".concat(askerName, " asks everyone: ").concat(details.text));
                return;
            }
            if (details.cardType === 3) {
                this.changeMainBar("".concat(askerName, " asks you in secret: ").concat(details.text));
                return;
            }
            this.changeMainBar("".concat(askerName, " asks you: ").concat(details.text));
        };
        KnightsAndKnaves.prototype.showQuestionStatusForObserver = function () {
            var _a, _b;
            var cardId = this.currentQuestionCardId;
            if (!cardId || !this.currentQuestionAskerId)
                return;
            var cardType = parseInt((_b = (_a = this.cardDataById[cardId]) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : '1');
            var askerName = this.coloredPlayerName(this.currentQuestionAskerId);
            var targetName = this.coloredPlayerName(this.currentQuestionTargetId);
            if (cardType === 3) {
                this.changeMainBar("".concat(askerName, " asks ").concat(targetName, " a question in secret"));
                return;
            }
            var text = this.getQuestionCardText(cardId);
            if (cardType === 2) {
                this.changeMainBar("".concat(askerName, " asks everyone: ").concat(text));
                return;
            }
            this.changeMainBar("".concat(askerName, " asks ").concat(targetName, ": ").concat(text));
        };
        KnightsAndKnaves.prototype.showQuestionBanner = function () {
            if (this.currentQuestionAskerId === String(this.player_id)) {
                this.showQuestionStatusForAsker();
            }
            else if (this.isCurrentPlayerActive()) {
                this.showQuestionStatusForResponder();
            }
            else {
                this.showQuestionStatusForObserver();
            }
        };
        KnightsAndKnaves.prototype.updateCurrentQuestionDisplay = function () {
            if (this.currentState !== 'targetResponse')
                return;
            this.showQuestionBanner();
        };
        KnightsAndKnaves.prototype.hideCurrentQuestion = function () { };
        KnightsAndKnaves.prototype.getQuestionCardText = function (cardId) {
            var _a, _b;
            var data = this.cardDataById[cardId];
            if (!data)
                return '';
            var questions = this.gamedatas.questions;
            return (_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : (parseInt(data.type_arg) === -1 ? _('Secret question') : '');
        };
        KnightsAndKnaves.prototype.getPlayerDisplayName = function (playerId) {
            var _a, _b;
            if (!playerId)
                return _('Unknown player');
            return (_b = (_a = this.gamedatas.players[playerId]) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : _('Unknown player');
        };
        KnightsAndKnaves.prototype.coloredPlayerName = function (playerId) {
            var player = playerId ? this.gamedatas.players[playerId] : null;
            if (!player)
                return _('another player');
            return "<span style=\"font-weight:bold;color:#".concat(player.color, "\">").concat(player.name, "</span>");
        };
        KnightsAndKnaves.prototype.stylePlayerButton = function (button, playerId) {
            var _a;
            var hex = (_a = this.gamedatas.players[playerId]) === null || _a === void 0 ? void 0 : _a.color;
            if (!button || !hex)
                return;
            button.classList.add('kk_player_button');
            button.style.color = '#' + hex;
        };
        KnightsAndKnaves.prototype.addCancelButton = function (id, method) {
            var _a;
            this.addActionButton(id, _('Cancel'), method, undefined, false, 'gray');
            (_a = $(id)) === null || _a === void 0 ? void 0 : _a.classList.add('kk_cancel_button');
        };
        KnightsAndKnaves.prototype.isQuestionCardPlayable = function (cardId) {
            if (this.currentState !== 'playerTurnAsk' || !this.isCurrentPlayerActive())
                return false;
            return this.playerHand.getSelectedItems().some(function (item) { return String(item.id) === cardId; });
        };
        KnightsAndKnaves.prototype.getCardPreviewHint = function (cardId, source, mode, cardType, typeName, icon) {
            var _a;
            var lines = ["<strong>".concat(icon ? icon + ' ' : '').concat(typeName, "</strong>")];
            if (source === 'commonarea' || this.playedQuestionAskers[cardId]) {
                lines.push("".concat(_('Asked by'), ": ").concat(this.coloredPlayerName(this.playedQuestionAskers[cardId])));
                var responses = __spreadArray([], ((_a = this.cardAnswers[cardId]) !== null && _a !== void 0 ? _a : []), true).sort(function (left, right) { return left.playerId.localeCompare(right.playerId); });
                if (responses.length > 0) {
                    for (var _i = 0, responses_1 = responses; _i < responses_1.length; _i++) {
                        var response = responses_1[_i];
                        var answerText = response.answer === 'yes' ? _('Yes') : _('No');
                        lines.push("".concat(this.coloredPlayerName(response.playerId), ": ").concat(answerText));
                    }
                }
                else if (cardId === this.currentQuestionCardId && (cardType === 1 || cardType === 3) && this.currentQuestionTargetId) {
                    lines.push("".concat(_('Waiting for response from'), ": ").concat(this.coloredPlayerName(this.currentQuestionTargetId)));
                }
                else if (cardId === this.currentQuestionCardId && cardType === 2) {
                    lines.push(_('Waiting for responses.'));
                }
                else {
                    lines.push(_('No responses yet.'));
                }
                return lines.join('<br>');
            }
            lines.push(mode === 'play'
                ? ((cardType === 1 || cardType === 3) ? _('Select a player to ask') : _('This will ask all players'))
                : _('This card has not been played yet.'));
            return lines.join('<br>');
        };
        KnightsAndKnaves.prototype.getCardAnswerDotsHtml = function (cardId, containerClass) {
            var _this = this;
            var _a;
            if (containerClass === void 0) { containerClass = 'kk_chips_container'; }
            var answers = (_a = this.cardAnswers[cardId]) !== null && _a !== void 0 ? _a : [];
            if (answers.length === 0)
                return '';
            var renderDots = function (answer) { return answers
                .filter(function (entry) { return entry.answer === answer; })
                .sort(function (left, right) { return left.color.localeCompare(right.color); })
                .map(function (entry) {
                var playerName = _this.getPlayerDisplayName(entry.playerId);
                var answerText = answer === 'yes' ? _('Yes') : _('No');
                var chipClass = answer === 'yes' ? 'kk_chip_yes' : 'kk_chip_no';
                return "<div class=\"kk_answer_chip ".concat(chipClass, "\" title=\"").concat(playerName, ": ").concat(answerText, "\" aria-label=\"").concat(playerName, ": ").concat(answerText, "\" style=\"background:").concat(entry.color, "\"></div>");
            })
                .join(''); };
            return "\n\t\t\t<div class=\"".concat(containerClass, "\">\n\t\t\t\t<div class=\"kk_chips_row kk_chips_row_top\">").concat(renderDots('yes'), "</div>\n\t\t\t\t<div class=\"kk_chips_row kk_chips_row_bottom\">").concat(renderDots('no'), "</div>\n\t\t\t</div>\n\t\t");
        };
        KnightsAndKnaves.prototype.openQuestionCardPopup = function (cardId, source) {
            var mode = source === 'hand' && this.isQuestionCardPlayable(cardId) ? 'play' : 'inspect';
            this.showCardPreview(cardId, source, mode);
            if (mode === 'play') {
                this.showAskActions(cardId);
                return;
            }
            this.clearCardPreviewActions();
        };
        KnightsAndKnaves.prototype.showCardPreview = function (cardId, source, mode) {
            var _a, _b, _c;
            if (source === void 0) { source = 'hand'; }
            if (mode === void 0) { mode = 'inspect'; }
            var overlay = $('kk_card_preview_overlay');
            if (!overlay)
                return;
            var data = this.cardDataById[cardId];
            if (!data)
                return;
            var text = this.getQuestionCardText(cardId);
            var cardType = parseInt(data.type);
            var typeIcons = { 1: '', 2: '👥', 3: '🤫' };
            var typeNames = { 1: 'Ask one player', 2: 'Ask all players', 3: 'Ask in secret' };
            var typeClassMap = { 1: 'kk_card_ask_one', 2: 'kk_card_ask_all', 3: 'kk_card_ask_secret' };
            var icon = (_a = typeIcons[cardType]) !== null && _a !== void 0 ? _a : '';
            var typeName = (_b = typeNames[cardType]) !== null && _b !== void 0 ? _b : '';
            this.previewSource = source;
            this.previewMode = mode;
            var cardEl = $('kk_preview_card');
            if (cardEl) {
                cardEl.className = "kk_preview_card ".concat((_c = typeClassMap[cardType]) !== null && _c !== void 0 ? _c : 'kk_card_ask_one');
                cardEl.innerHTML =
                    "<div class=\"kk_card_type_icon kk_preview_card_icon\" title=\"".concat(typeName, "\" aria-label=\"").concat(typeName, "\">").concat(icon, "</div>") +
                        "<div class=\"kk_card_content kk_preview_card_text\">".concat(text, "</div>") +
                        this.getCardAnswerDotsHtml(cardId, 'kk_chips_container kk_preview_chips_container');
            }
            var hintEl = $('kk_preview_hint');
            if (hintEl) {
                hintEl.innerHTML = this.getCardPreviewHint(cardId, source, mode, cardType, typeName, icon);
            }
            overlay.style.display = 'flex';
            if (cardEl)
                this.fitCardTextDeferred(cardEl.querySelector('.kk_card_content'));
        };
        KnightsAndKnaves.prototype.hideCardPreview = function () {
            var overlay = $('kk_card_preview_overlay');
            if (overlay)
                overlay.style.display = 'none';
            this.previewSource = null;
            this.previewMode = null;
            this.clearCardPreviewActions();
        };
        KnightsAndKnaves.prototype.dismissCardPreview = function () {
            var previewSource = this.previewSource;
            var previewMode = this.previewMode;
            this.hideCardPreview();
            if (previewSource === 'hand') {
                this.playerHand.unselectAll();
            }
            if (previewMode === 'play') {
                this.removeActionButtons();
                this.promptAskOptions();
            }
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
                return pid !== String(_this.player_id) && player.revealed != 1;
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
            return button;
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
                    var button = this_1.addPreviewActionButton(actionsEl, target.name, function () { return _this.playCardWithTarget(cardId, parseInt(target.id)); }, 'gray');
                    this_1.stylePlayerButton(button, target.id);
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
            this.addPreviewActionButton(actionsEl, _('Cancel'), function () { return _this.playCardCancel(); }, 'gray')
                .classList.add('kk_cancel_button');
        };
        KnightsAndKnaves.prototype.showAskActions = function (cardId) {
            var _this = this;
            var _a, _b;
            var cardType = parseInt((_b = (_a = this.cardDataById[cardId]) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : '1');
            this.removeActionButtons();
            this.renderCardPreviewActions(cardId);
            if (cardType === 1 || cardType === 3) {
                var _loop_2 = function (target) {
                    this_2.addActionButton("target_button_".concat(target.id), _(target.name), function () { return _this.playCardWithTarget(cardId, parseInt(target.id)); }, undefined, false, 'gray');
                    this_2.stylePlayerButton($("target_button_".concat(target.id)), target.id);
                };
                var this_2 = this;
                for (var _i = 0, _c = this.getAskTargets(); _i < _c.length; _i++) {
                    var target = _c[_i];
                    _loop_2(target);
                }
            }
            else {
                this.addActionButton('playCard_button', _('Ask all'), function () { return _this.playCardWithTarget(cardId, 0); });
            }
            this.addCancelButton('cancel_button', 'playCardCancel');
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
            var sortByColor = function (a, b) {
                return a.color.localeCompare(b.color);
            };
            var yesAnswers = this.cardAnswers[key].filter(function (a) { return a.answer === 'yes'; }).sort(sortByColor);
            var noAnswers = this.cardAnswers[key].filter(function (a) { return a.answer === 'no'; }).sort(sortByColor);
            var chipHtml = function (a) {
                var _a, _b;
                var p = _this.gamedatas.players[a.playerId];
                var cls = a.answer === 'yes' ? 'kk_chip_yes' : 'kk_chip_no';
                var answerText = a.answer === 'yes' ? 'Yes' : 'No';
                return "<div class=\"kk_answer_chip ".concat(cls, "\" title=\"").concat((_a = p === null || p === void 0 ? void 0 : p.name) !== null && _a !== void 0 ? _a : '', ": ").concat(answerText, "\" aria-label=\"").concat((_b = p === null || p === void 0 ? void 0 : p.name) !== null && _b !== void 0 ? _b : '', ": ").concat(answerText, "\" style=\"background:").concat(a.color, "\"></div>");
            };
            cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_chips_container\">" +
                "<div class=\"kk_chips_row kk_chips_row_top\">".concat(yesAnswers.map(chipHtml).join(''), "</div>") +
                "<div class=\"kk_chips_row kk_chips_row_bottom\">".concat(noAnswers.map(chipHtml).join(''), "</div>") +
                "</div>");
        };
        KnightsAndKnaves.prototype.onPlayerHandSelectionChanged = function (evt) {
            var canPlaySelectedCard = this.currentState === 'playerTurnAsk' && this.isCurrentPlayerActive();
            var selection = this.playerHand.getSelectedItems();
            if (selection.length === 0) {
                this.hideCardPreview();
                if (canPlaySelectedCard) {
                    this.removeActionButtons();
                    this.promptAskOptions();
                }
                return;
            }
            var item = selection[0];
            this.openQuestionCardPopup(String(item.id), 'hand');
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
            this.dismissCardPreview();
        };
        KnightsAndKnaves.prototype.onDiscardAndRedraw = function (evt) {
            var _this = this;
            this.confirmationDialog(_('Discard your whole hand and draw 5 new question cards? You will not ask a question this turn, but you may still make a guess.'), function () { return _this.bgaPerformAction('actDiscardAndRedraw', {}); });
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
            if (expectedAnswer === 'yes') {
                this.addActionButton('yes_button', _('Yes'), 'yesResponse');
                this.addActionButton('no_button', _('No'), wrongHandler, undefined, false, 'red');
            }
            else if (expectedAnswer === 'no') {
                this.addActionButton('yes_button', _('Yes'), wrongHandler, undefined, false, 'red');
                this.addActionButton('no_button', _('No'), 'noResponse');
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
        KnightsAndKnaves.prototype.promptAskOptions = function () {
            this.addActionButton('discard_button', _('Draw new hand'), 'onDiscardAndRedraw', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.promptGuessOrEndTurn = function () {
            this.addActionButton('guess_button', _('Guess'), 'playGuessTarget');
            this.addActionButton('pass_button', _('End turn'), 'playerPass', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.cancelGuess = function () {
            this.removeActionButtons();
            this.changeMainBar(_('You may make a guess or end your turn'));
            this.promptGuessOrEndTurn();
        };
        KnightsAndKnaves.prototype.promptJoinGuess = function () {
            var _this = this;
            var args = this.joinGuessArgs;
            if (!args)
                return;
            var targetId = String(args.target_id);
            this.changeMainBar("".concat(this.coloredPlayerName(String(args.guesser_id)), " is guessing ").concat(this.coloredPlayerName(targetId), "'s identity. Guess too? (1 point if right, an X if wrong)"));
            this.addActionButton('join_guess_button', _('Guess too'), function () { return _this.playGuessTribe(targetId); });
            this.addActionButton('decline_guess_button', _("Don't guess"), function () { return _this.bgaPerformAction('actDeclineGuess', {}); }, undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.showJoinGuessStatus = function () {
            var args = this.joinGuessArgs;
            if (!args || this.isCurrentPlayerActive())
                return;
            var me = String(this.player_id);
            var target = this.coloredPlayerName(String(args.target_id));
            if (String(args.target_id) === me) {
                this.changeMainBar("".concat(this.coloredPlayerName(String(args.guesser_id)), " is guessing your identity, and the other players may guess it too"));
            }
            else if (this.pendingGuess) {
                this.changeMainBar("You guessed that ".concat(target, " is a ").concat(this.pendingGuess.tribe, " with number ").concat(this.pendingGuess.number, ". Waiting for the other players to decide whether to guess too\u2026"));
            }
            else if (String(args.guesser_id) !== me && this.gamedatas.players[me]) {
                this.changeMainBar("You chose not to guess ".concat(target, "'s identity. Waiting for the other players to decide\u2026"));
            }
        };
        KnightsAndKnaves.prototype.restartGuess = function () {
            if (this.currentState === 'joinGuess') {
                this.removeActionButtons();
                this.promptJoinGuess();
            }
            else {
                this.playGuessTarget();
            }
        };
        KnightsAndKnaves.prototype.playGuessTarget = function (evt) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar(_("Whose identity do you want to guess?"));
            var _loop_3 = function (player_id) {
                if (player_id == String(this_3.player_id))
                    return "continue";
                var playerInfo = this_3.gamedatas.players[player_id];
                if (playerInfo.revealed == 1)
                    return "continue";
                this_3.addActionButton("guess_button_".concat(player_id), _(playerInfo.name), function () { return _this.playGuessTribe(player_id); }, undefined, false, 'gray');
                this_3.stylePlayerButton($("guess_button_".concat(player_id)), player_id);
            };
            var this_3 = this;
            for (var player_id in this.gamedatas.players) {
                _loop_3(player_id);
            }
            this.addCancelButton('cancel_guess', 'cancelGuess');
        };
        KnightsAndKnaves.prototype.playGuessTribe = function (playerId) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar("Is ".concat(this.coloredPlayerName(playerId), " a Knight or a Knave?"));
            this.addActionButton('guess_button_knight', _('Knight'), function () { return _this.playGuessNumber(playerId, 'knight'); });
            this.addActionButton('guess_button_knave', _('Knave'), function () { return _this.playGuessNumber(playerId, 'knave'); });
            this.addCancelButton('cancel_guess', function () { return _this.restartGuess(); });
        };
        KnightsAndKnaves.prototype.playGuessNumber = function (playerId, tribe) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar("What is ".concat(this.coloredPlayerName(playerId), "'s number?"));
            var _loop_4 = function (num) {
                var numCopy = num;
                this_4.addActionButton("guess_button_".concat(num), _(numCopy.toString()), function () { return _this.finalizeGuess(playerId, tribe, numCopy); });
            };
            var this_4 = this;
            for (var num = 1; num <= 10; num++) {
                _loop_4(num);
            }
            this.addCancelButton('cancel_guess', function () { return _this.playGuessTribe(playerId); });
        };
        KnightsAndKnaves.prototype.finalizeGuess = function (playerId, tribe, num) {
            var _this = this;
            this.removeActionButtons();
            var othersMayJoin = this.currentState === 'playerTurnGuess' && this.gamedatas.everyoneMayJoinGuesses;
            this.changeMainBar("Guess: ".concat(this.coloredPlayerName(playerId), " is a ").concat(tribe, " with number ").concat(num) +
                (othersMayJoin ? ' (it stays secret while everyone else may guess too)' : ''));
            this.addActionButton('confirm_button', _('Confirm Guess'), function () { return _this.confirmGuess(playerId, tribe, num); });
            this.addCancelButton('cancel_button', function () { return _this.restartGuess(); });
        };
        KnightsAndKnaves.prototype.confirmGuess = function (playerId, tribe, num) {
            var _this = this;
            var joining = this.currentState === 'joinGuess';
            if (joining || this.gamedatas.everyoneMayJoinGuesses) {
                this.pendingGuess = { tribe: tribe, number: num };
            }
            var request = joining
                ? this.bgaPerformAction('actJoinGuess', { tribe: tribe, number: num })
                : this.bgaPerformAction('actGuess', { target_id: playerId, tribe: tribe, number: num });
            Promise.resolve(request).catch(function () { _this.pendingGuess = null; });
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
            this.playedQuestionAskers[cardId] = String(notif.args.player_id);
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
                this.showMessage("\uD83C\uDF89 ".concat(notif.args.player_name, " correctly guessed! ").concat(notif.args.target_name, " is a ").concat(tribe, " with number ").concat(num, " and their identity is revealed!"), 'info');
                if (this.gamedatas.players[notif.args.target_id]) {
                    this.gamedatas.players[notif.args.target_id].revealed = 1;
                }
                this.renderRevealedIdentity(notif.args.target_id, tribe, num);
            }
            else {
                this.showMessage("\uD83D\uDE13 ".concat(notif.args.player_name, " guessed wrong! ").concat(notif.args.target_name, " is NOT a ").concat(tribe, " with number ").concat(num, "."), 'error');
                var wrongCountDiv = $('wrong_count_' + notif.args.player_id);
                if (wrongCountDiv)
                    wrongCountDiv.textContent = notif.args.wrong_guesses;
            }
        };
        KnightsAndKnaves.prototype.ntf_guessesRevealed = function (notif) {
            console.log('ntf_guessesRevealed', notif);
            var args = notif.args;
            this.pendingGuess = null;
            for (var _i = 0, _a = args.results; _i < _a.length; _i++) {
                var result = _a[_i];
                var wrongCountDiv = $('wrong_count_' + result.player_id);
                if (wrongCountDiv)
                    wrongCountDiv.textContent = result.wrong_guesses;
            }
            if (args.tribe) {
                var target = this.gamedatas.players[args.target_id];
                if (target)
                    target.revealed = 1;
                this.renderRevealedIdentity(args.target_id, args.tribe, args.number);
            }
            this.showGuessResults(args);
        };
        KnightsAndKnaves.prototype.showGuessResults = function (args) {
            var _this = this;
            var overlay = $('kk_guess_results_overlay');
            var panel = $('kk_guess_results');
            if (!overlay || !panel)
                return;
            var target = this.coloredPlayerName(String(args.target_id));
            var tribeLabel = function (tribe) { return tribe === 'knight' ? "\u2694\uFE0F ".concat(_('Knight')) : "\uD83C\uDFAD ".concat(_('Knave')); };
            var rows = args.results.map(function (result) { return "\n\t\t\t<tr class=\"".concat(result.correct ? 'kk_guess_correct' : 'kk_guess_wrong', "\">\n\t\t\t\t<td>").concat(_this.coloredPlayerName(String(result.player_id)), "</td>\n\t\t\t\t<td>").concat(tribeLabel(result.tribe), " ").concat(result.number, "</td>\n\t\t\t\t<td>").concat(result.correct ? "\uD83C\uDFC6 +".concat(result.points) : '❌ +1', "</td>\n\t\t\t</tr>"); });
            for (var _i = 0, _a = args.declined; _i < _a.length; _i++) {
                var playerId = _a[_i];
                rows.push("\n\t\t\t<tr class=\"kk_guess_declined\">\n\t\t\t\t<td>".concat(this.coloredPlayerName(String(playerId)), "</td>\n\t\t\t\t<td colspan=\"2\">").concat(_('Did not guess'), "</td>\n\t\t\t</tr>"));
            }
            var outcome = args.tribe
                ? "".concat(target, " is a ").concat(tribeLabel(args.tribe), " with number ").concat(args.number)
                : "Nobody guessed correctly, so ".concat(target, "'s identity stays secret");
            panel.innerHTML = "\n\t\t\t<div class=\"kk_guess_results_title\">Guesses about ".concat(target, "</div>\n\t\t\t<table class=\"kk_guess_results_table\">").concat(rows.join(''), "</table>\n\t\t\t<div class=\"kk_guess_results_outcome\">").concat(outcome, "</div>\n\t\t");
            this.addPreviewActionButton(panel, _('OK'), function () { return _this.hideGuessResults(); });
            overlay.style.display = 'flex';
        };
        KnightsAndKnaves.prototype.hideGuessResults = function () {
            var overlay = $('kk_guess_results_overlay');
            if (overlay)
                overlay.style.display = 'none';
        };
        KnightsAndKnaves.prototype.renderRevealedIdentity = function (playerId, tribe, number) {
            if ($('kk_revealed_identity_' + playerId))
                return;
            var playerBoardDiv = $('player_board_' + playerId);
            if (!playerBoardDiv)
                return;
            var tribeClass = tribe === 'knight' ? 'kk_revealed_card_knight' : 'kk_revealed_card_knave';
            var tribeIcon = tribe === 'knight' ? '⚔️' : '🎭';
            var tribeLabel = tribe === 'knight' ? _('Knight') : _('Knave');
            dojo.place("<div id=\"kk_revealed_identity_".concat(playerId, "\" class=\"kk_player_info kk_revealed_identity\">\n\t\t\t\t<div class=\"kk_revealed_card ").concat(tribeClass, "\" title=\"").concat(tribeLabel, "\" aria-label=\"").concat(tribeLabel, "\">").concat(tribeIcon, "</div>\n\t\t\t\t<div class=\"kk_revealed_card kk_revealed_card_number\">").concat(number, "</div>\n\t\t\t</div>"), playerBoardDiv);
            if (String(playerId) === String(this.player_id)) {
                this.playerTribe.removeAll();
                this.playerNumber.removeAll();
            }
        };
        KnightsAndKnaves.prototype.ntf_newScores = function (notif) {
            var _a;
            console.log('ntf_newScores', notif);
            for (var pid in notif.args.newScores) {
                (_a = this.scoreCtrl[pid]) === null || _a === void 0 ? void 0 : _a.toValue(notif.args.newScores[pid]);
                var trophyDiv = $('trophy_count_' + pid);
                if (trophyDiv)
                    trophyDiv.textContent = notif.args.newScores[pid];
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
                if (contentEl) {
                    contentEl.innerHTML = text;
                    this.fitCardTextDeferred(contentEl);
                }
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
