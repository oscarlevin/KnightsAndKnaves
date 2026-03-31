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
    var NUM_QUESTION_TYPES = 2;
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
            };
            _this.cardwidth = 72;
            _this.cardheight = 96;
            _this.currentState = '';
            _this.cardDataById = {};
            return _this;
        }
        KnightsAndKnaves.prototype.setup = function (gamedatas) {
            var _this = this;
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
            this.commonArea = new ebg.stock();
            this.commonArea.create(this, $('commonarea'), this.cardwidth, this.cardheight);
            this.commonArea.setSelectionMode(0);
            this.commonArea.image_items_per_row = 1;
            this.playerTribe = new ebg.stock();
            this.playerTribe.create(this, $('myTribe'), this.cardwidth, this.cardheight);
            this.playerTribe.setSelectionMode(0);
            this.playerTribe.image_items_per_row = 1;
            this.playerNumber = new ebg.stock();
            this.playerNumber.create(this, $('myNumber'), this.cardwidth, this.cardheight);
            this.playerNumber.setSelectionMode(0);
            this.playerNumber.image_items_per_row = 1;
            var cardImg = g_gamethemeurl + 'img/card.png';
            this.playerHand.addItemType(0, 0, cardImg, 0);
            this.commonArea.addItemType(0, 0, cardImg, 0);
            this.playerTribe.addItemType(0, 0, cardImg, 0);
            this.playerNumber.addItemType(0, 0, cardImg, 0);
            var questions = gamedatas.questions;
            var extractCardId = function (divId) { var _a; return (_a = divId.split('_item_')[1]) !== null && _a !== void 0 ? _a : divId; };
            this.playerHand.onItemCreate = function (cardDiv, _type, divId) {
                var _a, _b;
                var data = _this.cardDataById[extractCardId(divId)];
                var text = data ? ((_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '') : '';
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_content\">".concat(text, "</div>"));
            };
            this.commonArea.onItemCreate = function (cardDiv, _type, divId) {
                var _a, _b;
                var data = _this.cardDataById[extractCardId(divId)];
                var text = data ? ((_b = (_a = questions[parseInt(data.type_arg)]) === null || _a === void 0 ? void 0 : _a.description) !== null && _b !== void 0 ? _b : '') : '';
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_content\">".concat(text, "</div>"));
            };
            this.playerTribe.onItemCreate = function (cardDiv, _type, divId) {
                var data = _this.cardDataById[extractCardId(divId)];
                var text = data ? (data.type === 'knight' ? 'Knight' : 'Knave') : '';
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_content kk_identity_content\">".concat(text, "</div>"));
            };
            this.playerNumber.onItemCreate = function (cardDiv, _type, divId) {
                var data = _this.cardDataById[extractCardId(divId)];
                var text = data ? data.type_arg : '';
                cardDiv.insertAdjacentHTML('beforeend', "<div class=\"kk_card_content kk_identity_content kk_number_content\">".concat(text, "</div>"));
            };
            for (var i in this.gamedatas['hand']) {
                var card = this.gamedatas['hand'][i];
                this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
                this.playerHand.addToStockWithId(0, card.id);
            }
            for (var i in this.gamedatas['commonarea']) {
                var card = this.gamedatas['commonarea'][i];
                this.cardDataById[card.id] = { type: card.type, type_arg: card.type_arg };
                this.commonArea.addToStockWithId(0, card.id);
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
                for (var _i = 0, _a = this.gamedatas['answers']; _i < _a.length; _i++) {
                    var ans = _a[_i];
                    this.displayAnswerChip(ans.card_id, ans.player_id, ans.answer);
                }
            }
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
                    break;
                case 'targetResponse':
                    break;
            }
        };
        KnightsAndKnaves.prototype.onLeavingState = function (stateName) {
            console.log('Leaving state: ' + stateName);
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
        KnightsAndKnaves.prototype.displayAnswerChip = function (cardId, playerId, answer) {
            var cardDiv = $('commonarea_item_' + cardId);
            if (!cardDiv)
                return;
            var playerInfo = this.gamedatas.players[playerId];
            if (!playerInfo)
                return;
            var color = '#' + playerInfo.color;
            var symbol = answer === 'yes' ? '👍' : '👎';
            var chipClass = answer === 'yes' ? 'kk_chip_yes' : 'kk_chip_no';
            dojo.place("<div class=\"kk_answer_chip ".concat(chipClass, "\" style=\"color: ").concat(color, "; text-shadow: 0 0 2px ").concat(color, ";\" title=\"").concat(playerInfo.name, ": ").concat(answer, "\">").concat(symbol, "</div>"), cardDiv);
        };
        KnightsAndKnaves.prototype.onPlayerHandSelectionChanged = function (evt) {
            var _this = this;
            var _a, _b;
            if (this.currentState !== 'playerTurnAsk' || !this.isCurrentPlayerActive()) {
                return;
            }
            var selection = this.playerHand.getSelectedItems();
            if (selection.length === 0) {
                this.removeActionButtons();
                this.addActionButton('discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray');
                return;
            }
            var item = selection[0];
            var cardType = parseInt((_b = (_a = this.cardDataById[item.id]) === null || _a === void 0 ? void 0 : _a.type) !== null && _b !== void 0 ? _b : '1');
            this.removeActionButtons();
            if (cardType === 1) {
                this.changeMainBar(_("Select a player to ask:"));
                var _loop_1 = function (pid) {
                    if (pid == String(this_1.player_id))
                        return "continue";
                    var p = this_1.gamedatas.players[pid];
                    if (p.eliminated == 1)
                        return "continue";
                    this_1.addActionButton("target_button_".concat(pid), _(p.name), function () { return _this.playCardWithTarget(item.id, parseInt(pid)); });
                };
                var this_1 = this;
                for (var pid in this.gamedatas.players) {
                    _loop_1(pid);
                }
                this.addActionButton('cancel_button', _('Cancel'), 'playCardCancel', undefined, false, 'gray');
            }
            else {
                this.changeMainBar(_("Play this card to ask everyone?"));
                this.addActionButton('playCard_button', _('Play Card'), function () { return _this.playCardWithTarget(item.id, 0); });
                this.addActionButton('cancel_button', _('Cancel'), 'playCardCancel', undefined, false, 'gray');
            }
        };
        KnightsAndKnaves.prototype.playCardWithTarget = function (cardId, targetId) {
            this.bgaPerformAction('actPlayCard', { card_id: cardId, target_id: targetId });
            this.playerHand.removeFromStockById(cardId);
        };
        KnightsAndKnaves.prototype.playCardCancel = function (evt) {
            this.playerHand.unselectAll();
            this.removeActionButtons();
            this.addActionButton('discard_button', _('Discard & Redraw'), 'onDiscardAndRedraw', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.onDiscardAndRedraw = function (evt) {
            this.bgaPerformAction('actDiscardAndRedraw', {});
        };
        KnightsAndKnaves.prototype.promptResponse = function () {
            this.addActionButton('yes_button', _('Yes'), 'yesResponse');
            this.addActionButton('no_button', _('No'), 'noResponse');
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
            var _loop_2 = function (player_id) {
                if (player_id == String(this_2.player_id))
                    return "continue";
                var playerInfo = this_2.gamedatas.players[player_id];
                if (playerInfo.eliminated == 1)
                    return "continue";
                this_2.addActionButton("guess_button_".concat(player_id), _(playerInfo.name), function () { return _this.playGuessTribe(playerInfo); });
            };
            var this_2 = this;
            for (var player_id in this.gamedatas.players) {
                _loop_2(player_id);
            }
            this.addActionButton('cancel_guess', _('Cancel'), function () {
                _this.removeActionButtons();
                _this.promptGuessOrPass();
            }, undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.playGuessTribe = function (playerInfo) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar("Is ".concat(playerInfo.name, " a Knight or a Knave?"));
            this.addActionButton('guess_button_knight', _('Knight'), function () { return _this.playGuessNumber(playerInfo, 'knight'); });
            this.addActionButton('guess_button_knave', _('Knave'), function () { return _this.playGuessNumber(playerInfo, 'knave'); });
            this.addActionButton('cancel_guess', _('Cancel'), 'playGuessTarget', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.playGuessNumber = function (playerInfo, tribe) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar("What is ".concat(playerInfo.name, "'s number?"));
            var _loop_3 = function (num) {
                var numCopy = num;
                this_3.addActionButton("guess_button_".concat(num), _(numCopy.toString()), function () { return _this.finalizeGuess(playerInfo, tribe, numCopy); });
            };
            var this_3 = this;
            for (var num = 1; num <= 10; num++) {
                _loop_3(num);
            }
            this.addActionButton('cancel_guess', _('Cancel'), function () { return _this.playGuessTribe(playerInfo); }, undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.finalizeGuess = function (playerInfo, tribe, num) {
            var _this = this;
            this.removeActionButtons();
            this.changeMainBar("Guess: ".concat(playerInfo.name, " is a ").concat(tribe, " with number ").concat(num));
            this.addActionButton('confirm_button', _('Confirm Guess'), function () { return _this.confirmGuess(playerInfo, tribe, num); });
            this.addActionButton('cancel_button', _('Cancel'), 'playGuessTarget', undefined, false, 'gray');
        };
        KnightsAndKnaves.prototype.confirmGuess = function (playerInfo, tribe, num) {
            this.bgaPerformAction('actGuess', { target_id: String(playerInfo.id), tribe: tribe, number: num });
        };
        KnightsAndKnaves.prototype.playerPass = function (evt) {
            this.bgaPerformAction('actPass', {});
        };
        KnightsAndKnaves.prototype.ntf_actCardPlayed = function (notif) {
            console.log('ntf_actCardPlayed', notif);
            this.cardDataById[notif.args.card_id] = { type: notif.args.card_type, type_arg: notif.args.card_type_arg };
            this.commonArea.addToStockWithId(0, notif.args.card_id);
            this.playerHand.removeFromStockById(notif.args.card_id);
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
        return KnightsAndKnaves;
    }(Gamegui));
    window.bgagame = { knightsandknaves: KnightsAndKnaves };
});
function toggleScratch(cell) {
    cell.classList.toggle('scratched');
}
